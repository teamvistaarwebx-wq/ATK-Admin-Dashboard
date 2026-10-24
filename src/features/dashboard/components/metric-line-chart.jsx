"use client";

import { useMemo } from "react";
import {
  CategoryScale,
  Chart,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

/**
 * Registered à la carte rather than importing `chart.js/auto`, which pulls in
 * every controller, scale and plugin in the library.
 */
Chart.register(
  CategoryScale,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
);

const CURRENT = "#7e0917";
const PREVIOUS = "#a8a8a8";
const GRID = "#ebebeb";
const INK = "#616161";

/**
 * A vertical hairline under the pointer — the crosshair Shopify draws, so the
 * eye can drop from the tooltip to the x-axis.
 */
const crosshair = {
  id: "crosshair",
  afterDatasetsDraw(chart) {
    const active = chart.tooltip?.getActiveElements?.() ?? [];
    if (active.length === 0) return;

    const { ctx, chartArea } = chart;
    const x = active[0].element.x;

    ctx.save();
    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.stroke();
    ctx.restore();
  },
};

/**
 * This period against the comparison period, on one axis.
 *
 * Two lines of the same measure, so one y-scale is honest. Identity is never
 * colour alone: the comparison is dashed as well as grey, and the legend
 * above the chart names both.
 */
export function MetricLineChart({
  labels,
  previousLabels,
  series,
  previousSeries,
  formatValue,
  formatAxis,
  currentName,
  previousName,
}) {
  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: currentName,
          data: series,
          borderColor: CURRENT,
          backgroundColor: "rgba(126, 9, 23, 0.06)",
          fill: true,
          borderWidth: 2,
          // Monotone so a curve never dips below zero between two points.
          cubicInterpolationMode: "monotone",
          pointRadius: series.length === 1 ? 3 : 0,
          pointHoverRadius: 4,
          pointHoverBorderWidth: 2,
          pointHoverBorderColor: "#ffffff",
          pointHoverBackgroundColor: CURRENT,
        },
        ...(previousSeries
          ? [
              {
                label: previousName,
                data: previousSeries.slice(0, series.length),
                borderColor: PREVIOUS,
                borderDash: [4, 4],
                borderWidth: 2,
                cubicInterpolationMode: "monotone",
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointHoverBorderWidth: 2,
                pointHoverBorderColor: "#ffffff",
                pointHoverBackgroundColor: PREVIOUS,
              },
            ]
          : []),
      ],
    }),
    [labels, series, previousSeries, currentName, previousName]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      interaction: { mode: "index", intersect: false },
      layout: { padding: { top: 8, right: 4 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#ffffff",
          titleColor: "#303030",
          bodyColor: "#303030",
          borderColor: "#e3e3e3",
          borderWidth: 1,
          padding: 10,
          boxPadding: 4,
          usePointStyle: true,
          callbacks: {
            title: (items) => items[0]?.label ?? "",
            label: (item) => {
              const value = formatValue(item.parsed.y);
              if (item.datasetIndex === 0) return ` ${value}`;
              const label = previousLabels?.[item.dataIndex];
              return ` ${value}${label ? `  (${label})` : ""}`;
            },
            labelPointStyle: (item) => ({
              pointStyle: item.datasetIndex === 0 ? "line" : "dash",
              rotation: 0,
            }),
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { color: GRID },
          ticks: {
            color: INK,
            font: { size: 11 },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 7,
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: GRID },
          border: { display: false },
          ticks: {
            color: INK,
            font: { size: 11 },
            maxTicksLimit: 5,
            precision: 0,
            callback: (value) => formatAxis(value),
          },
        },
      },
    }),
    [formatValue, formatAxis, previousLabels]
  );

  return (
    <div className="h-64 w-full">
      <Line data={data} options={options} plugins={[crosshair]} />
    </div>
  );
}
