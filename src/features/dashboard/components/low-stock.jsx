import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getLowStock } from "@/features/inventory/queries/get-low-stock";
import { STOCK_VIEW } from "@/constants/inventory";

/**
 * What needs restocking, and what needs a phone call.
 *
 * Oversold rows are separated out and shown first: availability below zero is
 * not a purchasing decision for next week, it is somebody who has already paid
 * for something we do not have.
 */
export async function LowStock() {
  const { items, lowCount, oversoldCount } = await getLowStock();

  return (
    <Card
      title="Needs restocking"
      action={
        <Link
          href={`/inventory?view=${STOCK_VIEW.LOW}`}
          className="text-xs font-semibold text-link hover:underline"
        >
          View all
        </Link>
      }
    >
      {oversoldCount > 0 ? (
        <Link
          href={`/inventory?view=${STOCK_VIEW.OVERSOLD}`}
          className="mx-4 mt-3 block rounded-lg bg-badge-critical px-3 py-2.5 transition hover:brightness-95"
        >
          <p className="text-xs font-semibold text-badge-critical-ink">
            {oversoldCount} {oversoldCount === 1 ? "SKU is" : "SKUs are"} oversold
          </p>
          <p className="text-[11px] text-badge-critical-ink/90">
            Paid for but not on the shelf — someone needs to call the customer.
          </p>
        </Link>
      ) : null}

      {items.length === 0 ? (
        <p className="px-4 pb-5 pt-3 text-sm text-muted">
          Everything is comfortably in stock.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-2.5 px-4 pb-2 pt-4">
            {items.map((row) => (
              <li key={row.id} className="flex items-center gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.8125rem] text-foreground">
                    {row.title}
                  </span>
                  <span className="block truncate text-[11px] text-muted">
                    {row.sku}
                  </span>
                </span>

                <span
                  className={`shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                    row.available < 0
                      ? "bg-danger text-white"
                      : row.available === 0
                        ? "bg-badge-critical text-badge-critical-ink"
                        : "bg-badge-attention text-badge-attention-ink"
                  }`}
                >
                  {row.available} left
                </span>
              </li>
            ))}
          </ul>

          {/* Only when the list is truncated — "6 of 6" would be noise. */}
          {lowCount > items.length ? (
            <p className="px-4 pb-4 pt-1 text-[11px] text-muted">
              and {lowCount - items.length} more
            </p>
          ) : (
            <div className="pb-3" />
          )}
        </>
      )}
    </Card>
  );
}
