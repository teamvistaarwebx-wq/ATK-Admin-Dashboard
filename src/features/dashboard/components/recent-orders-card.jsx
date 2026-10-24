import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatPrice, formatRelativeDateTime } from "@/lib/format";
import { getOrders } from "@/features/orders/queries/get-orders";
import { orderStatusView } from "@/features/orders/lib/order-status";

/** The last few orders, whatever their state — the "what just happened" card. */
export async function RecentOrdersCard() {
  const { items } = await getOrders({ limit: 6 });

  return (
    <Card
      title="Recent orders"
      action={
        <Link
          href="/orders"
          className="text-xs font-semibold text-link hover:underline"
        >
          View all
        </Link>
      }
    >
      {items.length === 0 ? (
        <p className="px-4 pb-5 pt-3 text-sm text-muted">No orders yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border border-t border-border">
          {items.map((order) => {
            const view = orderStatusView(order.status);
            return (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.orderNumber}`}
                  className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-surface-subdued"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8125rem] font-semibold text-foreground">
                      {order.orderNumber}
                      <span className="font-normal text-muted">
                        {" "}
                        · {order.contact.fullName}
                      </span>
                    </span>
                    <span className="block text-xs text-muted">
                      {formatRelativeDateTime(order.createdAt)}
                    </span>
                  </span>
                  <Badge
                    tone={view.payment.tone}
                    progress={view.payment.progress}
                  >
                    {view.payment.label}
                  </Badge>
                  <span className="w-20 shrink-0 text-right text-[0.8125rem] tabular-nums text-foreground">
                    {formatPrice(order.total)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
