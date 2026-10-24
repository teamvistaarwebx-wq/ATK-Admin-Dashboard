"use client";

import { useMemo } from "react";
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

/**
 * Registered à la carte rather than importing `chart.js/auto`, which pulls in
 * every controller, scale and plugin in the library — line, radar, pie, the
 * radial scales — for a chart that needs five of them.
 */
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

const BRAND = "#7e0917";
const TRACK = "#f9ebec";
const FOREGROUND = "#1c1c1c";

/**
 * The canvas cannot resolve `var(--nunito)` — `ctx.font` takes a real font
 * shorthand — so the family is read off the element, which inherits Nunito
 * from the body. Cached per canvas because reading computed style forces a
 * style recalc, and the draw hook runs on every animation frame.
 */
const familyCache = new WeakMap();

function fontFamily(canvas) {
  let family = familyCache.get(canvas);

  if (!family) {
    family =
      getComputedStyle(canvas).fontFamily || "system-ui, sans-serif";
    familyCache.set(canvas, family);
  }

  return family;
}

/**
 * Draws the order count above each bar, and points the axis labels at the
 * same family.
 *
 * A plugin rather than absolutely-positioned HTML: Chart.js owns the bar
 * geometry, so anything outside the canvas has to re-derive it and then stays
 * only approximately aligned as the container resizes.
 */
const barValueLabels = {
  id: "barValueLabels",

  beforeInit(chart) {
    chart.options.font = {
      ...chart.options.font,
      family: fontFamily(chart.canvas),
    };
  },

  afterDatasetsDraw(chart) {
    // Dataset 0 is the filled portion — its bars are the ones with a value.
    const meta = chart.getDatasetMeta(0);
    if (!meta) return;

    const { ctx } = chart;
    const values = chart.data.datasets[0].data;

    ctx.save();
    ctx.fillStyle = BRAND;
    ctx.font = `600 12px ${fontFamily(chart.canvas)}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";

    for (const [index, bar] of meta.data.entries()) {
      // Anchored to the top of the plot area, not the top of each fill, so
      // the labels sit on one line instead of stepping with the bars.
      ctx.fillText(String(values[index]), bar.x, chart.chartArea.top - 6);
    }

    ctx.restore();
  },
};

const OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  // The value labels are drawn above the plot area, so leave them room.
  layout: { padding: { top: 22 } },
  animation: { duration: 400 },
  plugins: {
    legend: { display: false },
    tooltip: {
      // The pink remainder is scenery — a tooltip for it would report a
      // number that means nothing.
      filter: (item) => item.datasetIndex === 0,
      displayColors: false,
      backgroundColor: BRAND,
      padding: 10,
      callbacks: {
        label: (item) =>
          `${item.parsed.y} ${item.parsed.y === 1 ? "order" : "orders"}`,
      },
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: { display: false },
      border: { display: false },
      ticks: {
        color: FOREGROUND,
        font: { size: 11, weight: 600 },
        padding: 8,
      },
    },
    y: {
      stacked: true,
      display: false,
      beginAtZero: true,
    },
  },
};

/**
 * The mock's bars are a light pink rounded track with brand red rising from
 * the bottom, so this is a stacked bar of two datasets: the value, then the
 * remainder up to the busiest day. That is why the peak day reads as solid
 * red — its remainder is zero.
 */
export function SalesBarChart({ labels, values }) {
  const data = useMemo(() => {
    // Guard the all-zero week: without a floor every remainder would be 0 and
    // the chart would render nothing instead of seven empty tracks.
    const peak = Math.max(1, ...values);

    const shared = {
      borderRadius: 8,
      // Chart.js skips the edge where a bar meets the axis or its neighbour by
      // default; `false` rounds all four corners, which is what gives the fill
      // its rounded bottom and the track its rounded top.
      borderSkipped: false,
      barPercentage: 0.72,
      categoryPercentage: 0.85,
    };

    return {
      labels,
      datasets: [
        { ...shared, label: "Orders", data: values, backgroundColor: BRAND },
        {
          ...shared,
          label: "Remaining",
          data: values.map((value) => peak - value),
          backgroundColor: TRACK,
        },
      ],
    };
  }, [labels, values]);

  return (
    <div className="h-52 w-full">
      <Bar data={data} options={OPTIONS} plugins={[barValueLabels]} />
    </div>
  );
}
