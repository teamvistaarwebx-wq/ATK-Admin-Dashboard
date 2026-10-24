import { Suspense } from "react";
import Link from "next/link";
import { Download, Inbox, Search } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { buttonClass } from "@/components/ui/button";
import { chipClass } from "@/components/ui/chip";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { OrdersSection, OrdersStats, Stat } from "@/features/orders/components/orders-section";
import { getOrderRangeStats, getOrders } from "@/features/orders/queries/get-orders";
import { ORDER_VIEWS } from "@/features/orders/lib/order-status";
import { buildOrdersHref } from "@/features/orders/lib/orders-url";
import { requireAdmin } from "@/lib/auth/dal";
import { formatRangeLabel, resolveDateRange } from "@/lib/date-range";

export const metadata = { title: "Orders | AKT Gifting Admin" };

/**
 * Orders list, Shopify-style: a date range with the range's figures beside it,
 * status tabs and search over one table, and an export of exactly what the
 * table shows.
 *
 * Calls the queries directly rather than its own HTTP API — it runs inside the
 * app that owns the model. Both are started here and awaited nowhere, so the
 * header, tabs and search render while the table and strip stream in.
 */
export default async function OrdersPage({ searchParams }) {
  await requireAdmin();

  const params = await searchParams;
  const q = params?.q ?? "";
  // `status` is the old single-status filter; existing bookmarks still work.
  const view = params?.view ?? params?.status ?? "";

  const range = resolveDateRange(
    { range: params?.range, from: params?.from, to: params?.to },
    { fallback: "all", allowAllTime: true }
  );

  // What every link on the page must carry forward.
  const current = {
    // "All time" is the default, so it needs no param of its own.
    range: range.key === "custom" || range.key === "all" ? "" : range.key,
    from: range.key === "custom" ? range.from : "",
    to: range.key === "custom" ? range.to : "",
    view,
    q,
  };

  const ordersPromise = getOrders({ view, q, range, page: params?.page });
  const statsPromise = getOrderRangeStats({ q, range });

  const exportHref = buildOrdersHref(current, {}, "/api/orders/export");

  return (
    <>
      <PageHeader title="Orders" icon={<Inbox className="h-5 w-5" strokeWidth={2} />}>
        {/* A plain link: the browser handles the download, no JS needed. */}
        <a href={exportHref} className={buttonClass("secondary")} download>
          <Download className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Export
        </a>
      </PageHeader>

      <PageBody className="flex flex-col gap-4">
        <section className="flex items-stretch overflow-x-auto rounded-xl bg-surface shadow-card">
          <div className="flex shrink-0 items-center px-3 py-3">
            <DateRangePicker
              range={{
                key: range.key,
                label: range.label,
                from: range.from,
                to: range.to,
                compare: range.compare,
              }}
              allowAllTime
            />
          </div>
          <Suspense fallback={<StatsSkeleton />}>
            <OrdersStats statsPromise={statsPromise} />
          </Suspense>
        </section>

        <section className="overflow-hidden rounded-xl bg-surface shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-2">
            <nav aria-label="Order views" className="flex flex-wrap items-center gap-1">
              {ORDER_VIEWS.map((item) => (
                <Link
                  key={item.key || "all"}
                  href={buildOrdersHref(current, { view: item.key })}
                  aria-current={view === item.key ? "page" : undefined}
                  className={chipClass(view === item.key)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <form action="/orders" className="relative w-full sm:w-72">
              {/* Searching keeps the range and tab. */}
              {Object.entries(current).map(([key, value]) =>
                key !== "q" && value ? (
                  <input key={key} type="hidden" name={key} value={value} />
                ) : null
              )}
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                strokeWidth={2}
                aria-hidden="true"
              />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search orders, customers, phone, company"
                aria-label="Search orders"
                className="h-8 w-full rounded-lg border border-border-strong bg-surface pl-8 pr-3 text-[0.8125rem] outline-none transition placeholder:text-subtle focus:border-foreground/50 focus:ring-2 focus:ring-black/5"
              />
            </form>
          </div>

          <p className="border-t border-border px-4 py-2 text-xs text-muted">
            {range.from
              ? `Placed ${formatRangeLabel(range.from, range.to)} · ${range.label} (IST)`
              : "Every order, newest first"}
            {q ? ` matching “${q}”` : ""}
          </p>

          <Suspense fallback={<TableSkeleton rows={10} columns={8} />}>
            <OrdersSection
              ordersPromise={ordersPromise}
              current={current}
              filtered={Boolean(q || view || range.from)}
            />
          </Suspense>
        </section>
      </PageBody>
    </>
  );
}

function StatsSkeleton() {
  return (
    <>
      {["Orders", "Items ordered", "Sales", "To fulfil", "Orders fulfilled", "Orders delivered"].map(
        (label) => (
          <Stat key={label} label={label} value={<Skeleton className="inline-block h-4 w-10" />} />
        )
      )}
    </>
  );
}
