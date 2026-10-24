import { Card } from "@/components/ui/card";
import { formatCompactPrice, formatCount } from "@/lib/format";
import { getRegionBreakdown } from "@/features/analytics/queries/get-region-breakdown";

const VISIBLE_ROWS = 8;

/**
 * Region-wise traffic, sales and enquiries — one row per state, so "Karnataka
 * sends lots of visitors but few orders" reads straight across a line.
 *
 * The bar under each state is its share of the range's revenue (or of its
 * sessions when nothing sold), one hue, the only colour on the card.
 */
export async function RegionCard({ range }) {
  const { rows, totals } = await getRegionBreakdown(range);

  const byRevenue = totals.revenue > 0;
  const shareOf = (row) =>
    byRevenue
      ? row.revenue / totals.revenue
      : totals.sessions > 0
        ? row.sessions / totals.sessions
        : 0;

  return (
    <Card
      title="Sales, traffic and inquiries by region"
      subtitle={`${range.label} · by shipping state for orders and inquiries, by visitor location for sessions`}
    >
      {rows.length === 0 ? (
        <p className="px-4 pb-5 pt-3 text-sm text-muted">
          Nothing in this range yet.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-[0.8125rem]">
            <thead className="border-y border-border bg-surface-subdued text-xs text-muted">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">State</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Sessions</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Orders</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Sales</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Inquiries</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.slice(0, VISIBLE_ROWS).map((row) => (
                <RegionRow key={row.state} row={row} share={shareOf(row)} />
              ))}
            </tbody>
            {rows.length > VISIBLE_ROWS ? (
              <tbody className="divide-y divide-border border-t border-border">
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-xs text-muted">
                    {rows.length - VISIBLE_ROWS} more{" "}
                    {rows.length - VISIBLE_ROWS === 1 ? "state" : "states"} ·{" "}
                    {formatCount(
                      rows.slice(VISIBLE_ROWS).reduce((s, r) => s + r.sessions, 0)
                    )}{" "}
                    sessions,{" "}
                    {formatCount(
                      rows.slice(VISIBLE_ROWS).reduce((s, r) => s + r.orders, 0)
                    )}{" "}
                    orders
                  </td>
                </tr>
              </tbody>
            ) : null}
            <tfoot className="border-t border-border bg-surface-subdued text-xs font-semibold text-foreground">
              <tr>
                <td className="px-4 py-2">Total</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCount(totals.sessions)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCount(totals.orders)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCompactPrice(totals.revenue)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatCount(totals.inquiries)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Card>
  );
}

function RegionRow({ row, share }) {
  return (
    <tr className="transition hover:bg-surface-subdued">
      <td className="px-4 py-2">
        <span className="block truncate font-medium text-foreground">{row.state}</span>
        <span className="mt-1 block h-1 w-full max-w-40 rounded-full bg-black/[0.06]" aria-hidden="true">
          <span
            className="block h-1 rounded-full bg-[#7e0917]"
            style={{ width: `${Math.max(share > 0 ? 3 : 0, Math.round(share * 100))}%` }}
          />
        </span>
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-foreground">{formatCount(row.sessions)}</td>
      <td className="px-3 py-2 text-right tabular-nums text-foreground">{formatCount(row.orders)}</td>
      <td className="px-3 py-2 text-right tabular-nums text-foreground">{formatCompactPrice(row.revenue)}</td>
      <td className="px-4 py-2 text-right tabular-nums text-foreground">
        {formatCount(row.inquiries)}
      </td>
    </tr>
  );
}
