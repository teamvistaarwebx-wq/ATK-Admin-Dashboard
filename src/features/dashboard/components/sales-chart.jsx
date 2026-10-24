"use client";

import dynamic from "next/dynamic";

/**
 * Client boundary that exists only to hold the lazy import.
 *
 * chart.js is ~60KB for one panel below the header, so it is split into its
 * own chunk and fetched after hydration. `ssr: false` is what buys that — the
 * chart paints to a canvas, so server-rendering it produces an empty element
 * that is thrown away moments later — and Next only allows `ssr: false` on
 * `next/dynamic` inside a client component, which is why this wrapper is not
 * folded into the server card.
 */
const SalesBarChart = dynamic(
  () => import("./sales-bar-chart").then((mod) => mod.SalesBarChart),
  {
    ssr: false,
    loading: () => <div className="h-52 w-full animate-pulse bg-background" />,
  }
);

export function SalesChart({ labels, values }) {
  return <SalesBarChart labels={labels} values={values} />;
}
