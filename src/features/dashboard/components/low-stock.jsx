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
          className="font-nunito text-xs font-semibold text-brand underline-offset-2 hover:underline"
        >
          View all
        </Link>
      }
    >
      {oversoldCount > 0 ? (
        <Link
          href={`/inventory?view=${STOCK_VIEW.OVERSOLD}`}
          className="mx-5 mt-3 block rounded-lg border border-danger/30 bg-danger/8 px-3 py-2.5 transition hover:bg-danger/12"
        >
          <p className="font-nunito text-xs font-semibold text-danger">
            {oversoldCount} {oversoldCount === 1 ? "SKU is" : "SKUs are"} oversold
          </p>
          <p className="font-nunito text-[11px] text-danger/90">
            Paid for but not on the shelf — someone needs to call the customer.
          </p>
        </Link>
      ) : null}

      {items.length === 0 ? (
        <p className="px-5 pb-5 pt-3 text-sm text-muted">
          Everything is comfortably in stock.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-2.5 px-5 pb-2 pt-4">
            {items.map((row) => (
              <li key={row.id} className="flex items-center gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs text-foreground">
                    {row.title}
                  </span>
                  <span className="block truncate font-nunito text-[11px] text-muted">
                    {row.sku}
                  </span>
                </span>

                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 font-nunito text-[11px] font-semibold tabular-nums ${
                    row.available < 0
                      ? "bg-red-600 text-white"
                      : row.available === 0
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {row.available} left
                </span>
              </li>
            ))}
          </ul>

          {/* Only when the list is truncated — "6 of 6" would be noise. */}
          {lowCount > items.length ? (
            <p className="px-5 pb-5 pt-1 font-nunito text-[11px] text-muted">
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
