import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { formatCompactPrice, formatCount, formatPrice, formatRelativeDateTime } from "@/lib/format";
import { orderStatusView } from "../lib/order-status";
import { buildOrdersHref } from "../lib/orders-url";

/**
 * The orders table, split out of the page so it can stream behind a Suspense
 * boundary while the header, tabs and search render immediately.
 *
 * Laid out like Shopify's index table: order, date, customer, channel, total,
 * then payment, fulfilment and delivery as badges, items and destination.
 */
export async function OrdersSection({ ordersPromise, current, filtered }) {
  const { items, page, totalPages, total } = await ordersPromise;

  if (items.length === 0) {
    return (
      <p className="px-4 py-16 text-center text-sm text-muted">
        {filtered ? "No orders match these filters." : "No orders yet."}
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[72rem] text-left text-[0.8125rem]">
          <thead className="border-y border-border bg-surface-subdued text-xs text-muted">
            <tr>
              <th scope="col" className="py-2 pl-4 pr-3 font-medium">Order</th>
              <th scope="col" className="px-3 py-2 font-medium">Date</th>
              <th scope="col" className="px-3 py-2 font-medium">Customer</th>
              <th scope="col" className="px-3 py-2 font-medium">Channel</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Total</th>
              <th scope="col" className="px-3 py-2 font-medium">Payment status</th>
              <th scope="col" className="px-3 py-2 font-medium">Fulfillment status</th>
              <th scope="col" className="px-3 py-2 font-medium">Items</th>
              <th scope="col" className="px-3 py-2 font-medium">Delivery status</th>
              <th scope="col" className="py-2 pl-3 pr-4 font-medium">Destination</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border px-4 pb-3">
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          noun="order"
          buildHref={(target) => buildOrdersHref(current, { page: target })}
        />
      </div>
    </>
  );
}

/**
 * Finished orders are greyed like Shopify's, so the rows that still need a
 * person stand out without a filter.
 */
function OrderRow({ order }) {
  const view = orderStatusView(order.status);
  const done = !view.fulfillment || view.fulfillment.progress === "complete";
  const href = `/orders/${order.orderNumber}`;

  return (
    <tr className={`transition hover:bg-surface-subdued ${done ? "text-muted" : "text-foreground"}`}>
      <td className="py-2 pl-4 pr-3">
        <span className="flex items-center gap-1.5">
          <Link href={href} className="font-semibold text-foreground hover:underline">
            {order.orderNumber}
          </Link>
          {order.needsReview ? (
            <AlertCircle
              className="h-4 w-4 text-danger"
              strokeWidth={2}
              aria-label="Needs review"
            />
          ) : null}
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-2">{formatRelativeDateTime(order.createdAt)}</td>
      <td className="max-w-48 truncate px-3 py-2">{order.contact.fullName}</td>
      <td className="whitespace-nowrap px-3 py-2">
        {order.companyName ? `Corporate · ${order.companyName}` : "Online store"}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
        {formatPrice(order.total)}
      </td>
      <td className="px-3 py-2">
        <StatusBadge badge={view.payment} />
      </td>
      <td className="px-3 py-2">
        <StatusBadge badge={view.fulfillment} />
      </td>
      <td className="whitespace-nowrap px-3 py-2">
        {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
      </td>
      <td className="px-3 py-2">
        <StatusBadge badge={view.delivery} />
      </td>
      <td className="whitespace-nowrap py-2 pl-3 pr-4 uppercase">
        {[order.city, order.state].filter(Boolean).join(", ") || "—"}
      </td>
    </tr>
  );
}

function StatusBadge({ badge }) {
  if (!badge) return null;
  return (
    <Badge tone={badge.tone} progress={badge.progress}>
      {badge.label}
    </Badge>
  );
}

/**
 * The figures strip under the header — Shopify's "Today · Orders · Items
 * ordered …" bar. Every figure is for the chosen range, so changing the range
 * visibly changes the numbers even before the table is read.
 */
export async function OrdersStats({ statsPromise }) {
  const stats = await statsPromise;

  return (
    <>
      <Stat label="Orders" value={formatCount(stats.orders)} />
      <Stat label="Items ordered" value={formatCount(stats.items)} />
      <Stat label="Sales" value={formatCompactPrice(stats.revenue)} note={`${formatCount(stats.paid)} paid`} />
      <Stat label="To fulfil" value={formatCount(stats.toFulfil)} />
      <Stat label="Orders fulfilled" value={formatCount(stats.fulfilled)} />
      <Stat label="Orders delivered" value={formatCount(stats.delivered)} />
    </>
  );
}

export function Stat({ label, value, note }) {
  return (
    <div className="min-w-32 shrink-0 border-l border-border px-4 py-3">
      <p className="text-xs font-semibold text-foreground">
        <span className="border-b border-dashed border-border-strong">{label}</span>
      </p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="text-base font-semibold tabular-nums text-foreground">{value}</span>
        {note ? <span className="text-xs text-muted">{note}</span> : null}
      </p>
    </div>
  );
}
