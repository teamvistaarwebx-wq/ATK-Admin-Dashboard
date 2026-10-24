import { IndianRupee, Package, PackageX, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { formatCompactPrice } from "@/lib/format";
import { getCatalogStats } from "../queries/get-catalog-stats";
import { getOrderStats } from "../queries/get-order-stats";

const ICON_CLASS = "h-6 w-6";

/** Small counts read better zero-padded on a dashboard: "09", not "9". */
function padCount(value) {
  return value < 10 ? `0${value}` : String(value);
}

export async function KpiRow() {
  // Independent reads, so they go out together rather than one after the
  // other — the panel is only as slow as its slowest query.
  const [catalog, orders] = await Promise.all([
    getCatalogStats(),
    getOrderStats(),
  ]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total products"
        value={padCount(catalog.totalProducts)}
        icon={<Package className={ICON_CLASS} strokeWidth={1.75} />}
      />

      <StatCard
        label="Sold Out"
        value={padCount(catalog.soldOut)}
        note={
          catalog.lowStock > 0
            ? `${catalog.lowStock} need restocking`
            : undefined
        }
        noteTone="danger"
        icon={<PackageX className={ICON_CLASS} strokeWidth={1.75} />}
      />

      <StatCard
        label={`Orders this week`}
        value={padCount(orders.orders)}
        note={`${formatCompactPrice(orders.revenue)} revenue`}
        noteTone="success"
        icon={<TrendingUp className={ICON_CLASS} strokeWidth={1.75} />}
      />

      <StatCard
        label="Total Revenue"
        value={formatCompactPrice(orders.totalRevenue)}
        note={`${orders.totalOrders} paid ${orders.totalOrders === 1 ? "order" : "orders"} all time`}
        icon={<IndianRupee className={ICON_CLASS} strokeWidth={1.75} />}
      />
    </div>
  );
}
