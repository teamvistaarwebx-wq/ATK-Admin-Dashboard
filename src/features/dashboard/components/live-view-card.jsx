"use client";

import { useEffect, useState } from "react";
import { formatCompactPrice, formatCount } from "@/lib/format";

const POLL_MS = 30 * 1000;

/**
 * Shopify's Live View, as a card: visitors right now, carts with something in
 * them, shoppers at the payment step, and where the live visitors are.
 *
 * Seeded with the server's first read so it paints filled, then refreshed
 * every thirty seconds while the tab is visible — a background tab polling a
 * database all afternoon helps nobody.
 */
export function LiveViewCard({ initial }) {
  const [live, setLive] = useState(initial);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let timer = null;
    let cancelled = false;

    async function refresh() {
      try {
        const response = await fetch("/api/analytics/live", { cache: "no-store" });
        if (!response.ok) throw new Error(String(response.status));
        const payload = await response.json();
        if (!cancelled) {
          setLive(payload.data);
          setStale(false);
        }
      } catch {
        if (!cancelled) setStale(true);
      }
    }

    function schedule() {
      clearInterval(timer);
      if (document.visibilityState === "visible") {
        timer = setInterval(refresh, POLL_MS);
      }
    }

    function onVisibility() {
      if (document.visibilityState === "visible") refresh();
      schedule();
    }

    schedule();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <section className="flex flex-col overflow-hidden rounded-xl bg-surface shadow-card">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <h2 className="text-sm font-semibold text-foreground">Live view</h2>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            {stale ? null : (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#29845a] opacity-60" />
            )}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                stale ? "bg-border-strong" : "bg-[#29845a]"
              }`}
            />
          </span>
          {stale ? "Reconnecting" : "Live"}
        </span>
      </div>

      <dl className="grid grid-cols-3 gap-px px-4 pt-3">
        <LiveFigure label="Visitors now" value={formatCount(live.visitors)} />
        <LiveFigure label="Active carts" value={formatCount(live.activeCarts)} />
        <LiveFigure label="Checking out" value={formatCount(live.checkingOut)} />
      </dl>

      <p className="px-4 pt-1 text-xs text-muted">
        {live.activeCarts > 0
          ? `${formatCount(live.cartItems)} ${live.cartItems === 1 ? "item" : "items"} worth ${formatCompactPrice(live.cartValue)} in open carts`
          : "No open carts right now"}
      </p>

      <div className="mt-4 grid flex-1 grid-cols-1 gap-4 border-t border-border px-4 py-4 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
        <LiveList
          title="Top locations"
          empty="No one on the store"
          rows={live.places.map((row) => ({ label: row.label, value: row.visitors }))}
        />
        <LiveList
          title="Pages being viewed"
          empty="—"
          rows={live.pages.map((row) => ({ label: row.path, value: row.visitors }))}
        />
      </div>
    </section>
  );
}

function LiveFigure({ label, value }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-2xl font-semibold tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

function LiveList({ title, rows, empty }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold text-foreground">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-1.5 text-xs text-muted">{empty}</p>
      ) : (
        <ul className="mt-1.5 flex flex-col gap-1">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate text-foreground">{row.label}</span>
              <span className="shrink-0 tabular-nums text-muted">{row.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
