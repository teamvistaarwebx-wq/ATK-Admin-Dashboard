"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import {
  formatCompactPrice,
  formatCount,
  formatShortNumber,
  formatShortPrice,
} from "@/lib/format";
import { percentChange } from "@/lib/date-range";

/**
 * chart.js is ~60KB for one panel, so it is split into its own chunk and
 * fetched after hydration. `ssr: false` because the chart paints to a canvas —
 * server-rendering it produces an empty element that is thrown away.
 */
const MetricLineChart = dynamic(
  () => import("./metric-line-chart").then((mod) => mod.MetricLineChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full animate-pulse rounded-lg bg-surface-subdued" />
    ),
  }
);

/**
 * Formatters by name. The metrics come from a server component, and a
 * function cannot cross that boundary — a string can.
 */
const FORMATS = {
  money: { value: formatCompactPrice, axis: formatShortPrice },
  count: { value: formatCount, axis: formatShortNumber },
  percent: {
    value: (v) => `${Number(v).toFixed(2)}%`,
    axis: (v) => `${Number(v).toFixed(1)}%`,
  },
};

/**
 * Shopify's analytics header: a row of metric tabs, each with its figure and
 * its change against the comparison period, and one line chart below for
 * whichever tab is selected.
 *
 * Every series is already here, so switching tabs is instant — there is no
 * round trip for something that is a few dozen numbers.
 */
export function MetricsCard({
  metrics,
  labels,
  previousLabels,
  rangeLabel,
  comparisonLabel,
}) {
  const [selected, setSelected] = useState(metrics[0].key);
  const metric = metrics.find((m) => m.key === selected) ?? metrics[0];
  const format = FORMATS[metric.format] ?? FORMATS.count;

  return (
    <section className="overflow-hidden rounded-xl bg-surface shadow-card">
      <div
        role="tablist"
        aria-label="Metrics"
        className="-mb-px grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6"
      >
        {metrics.map((item) => (
          <MetricTab
            key={item.key}
            metric={item}
            active={item.key === selected}
            onSelect={() => setSelected(item.key)}
          />
        ))}
      </div>

      <div className="px-4 pb-4 pt-3">
        <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-0.5 w-4 rounded-full bg-[#7e0917]"
            />
            {rangeLabel}
          </span>
          {comparisonLabel ? (
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="w-4 border-t-2 border-dashed border-[#a8a8a8]"
              />
              {comparisonLabel}
            </span>
          ) : null}
        </div>

        <MetricLineChart
          labels={labels}
          previousLabels={previousLabels}
          series={metric.series}
          previousSeries={metric.previousSeries}
          formatValue={format.value}
          formatAxis={format.axis}
          currentName={rangeLabel}
          previousName={comparisonLabel}
        />

        {metric.empty ? (
          <p className="mt-2 text-xs text-muted">{metric.empty}</p>
        ) : null}
      </div>
    </section>
  );
}

function MetricTab({ metric, active, onSelect }) {
  const format = FORMATS[metric.format] ?? FORMATS.count;
  const change = percentChange(metric.total, metric.previous);

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onSelect}
      className={`relative flex min-w-0 flex-col items-start gap-1 border-b border-r border-border px-4 py-3 text-left transition xl:border-b-0 xl:last:border-r-0 ${
        active ? "bg-surface-subdued" : "hover:bg-surface-subdued/60"
      }`}
    >
      {active ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-0.5 bg-foreground"
        />
      ) : null}
      <span className="border-b border-dashed border-border-strong text-xs font-semibold text-foreground">
        {metric.label}
      </span>
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-lg font-semibold tabular-nums text-foreground">
          {format.value(metric.total)}
        </span>
        <Change value={change} hasComparison={metric.previous != null} />
      </span>
    </button>
  );
}

/** "↗ 12%" in green, "↘ 4%" in red, "—" when there is nothing to compare. */
export function Change({ value, hasComparison = true }) {
  if (!hasComparison) return null;

  if (value == null) {
    return <span className="text-xs text-subtle">—</span>;
  }

  const rounded = Math.round(value);
  if (rounded === 0)
    return <span className="text-xs font-medium text-muted">0%</span>;

  const up = rounded > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center text-xs font-semibold tabular-nums ${
        up ? "text-success" : "text-danger"
      }`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
      {Math.abs(rounded)}%
      <span className="sr-only">
        {up ? " up" : " down"} on the comparison period
      </span>
    </span>
  );
}
