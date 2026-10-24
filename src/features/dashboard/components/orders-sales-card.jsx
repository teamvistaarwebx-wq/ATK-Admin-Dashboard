import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCompactPrice } from "@/lib/format";
import { getOrderStats } from "../queries/get-order-stats";
import { getSalesByDay } from "../queries/get-sales-by-day";
import { SalesChart } from "./sales-chart";

export async function OrdersSalesCard() {
  const [stats, series] = await Promise.all([getOrderStats(), getSalesByDay()]);

  // Only primitives cross into the client component — no documents, no dates.
  const labels = series.map((day) => day.label);
  const values = series.map((day) => day.orders);

  return (
    <Card
      title="Orders & sales"
      subtitle={`Last ${stats.windowDays} days`}
      action={
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition hover:gap-2.5"
        >
          View Orders
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      }
    >
      <dl className="flex flex-wrap gap-x-10 gap-y-4 px-5 pb-5 pt-4">
        <Figure label="Orders" value={stats.orders} />
        <Figure label="Revenue" value={formatCompactPrice(stats.revenue)} />
        <Figure
          label="Avg. order value"
          value={formatCompactPrice(stats.averageOrderValue)}
        />
      </dl>

      <div className="border-t border-border px-3 py-4">
        <SalesChart labels={labels} values={values} />
      </div>
    </Card>
  );
}

function Figure({ label, value }) {
  return (
    <div>
      <dd className="font-newsreader text-xl font-semibold text-brand">
        {value}
      </dd>
      <dt className="mt-0.5 font-nunito text-[11px] uppercase tracking-wide text-muted">
        {label}
      </dt>
    </div>
  );
}
