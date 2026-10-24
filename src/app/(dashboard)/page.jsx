import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdmin } from "@/lib/auth/dal";
import { GiftingRequests } from "@/features/dashboard/components/gifting-requests";
import { KpiRow } from "@/features/dashboard/components/kpi-row";
import { LowStock } from "@/features/dashboard/components/low-stock";
import { OrdersSalesCard } from "@/features/dashboard/components/orders-sales-card";
import { QuickActions } from "@/features/dashboard/components/quick-actions";
import { RecentActivity } from "@/features/dashboard/components/recent-activity";
import { StockByCategory } from "@/features/dashboard/components/stock-by-category";
import {
  KpiRowSkeleton,
  PanelSkeleton,
} from "@/features/dashboard/components/panel-skeletons";

export const metadata = { title: "Dashboard | AKT Gifting Admin" };

/**
 * Every panel fetches its own data behind its own Suspense boundary, so the
 * header and the sidebar paint immediately and each card fills in as its
 * aggregation lands. Awaiting them all here would hold the whole page on the
 * slowest one.
 */
export default async function DashboardPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="A quick look at your catalogue and site content."
      />

      <div className="flex flex-col gap-5 px-6 py-6 sm:px-8">
        <Suspense fallback={<KpiRowSkeleton />}>
          <KpiRow />
        </Suspense>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="flex flex-col gap-5 lg:col-span-2">
            <Suspense fallback={<PanelSkeleton height="h-96" />}>
              <OrdersSalesCard />
            </Suspense>

            <Suspense fallback={<PanelSkeleton height="h-80" />}>
              <RecentActivity />
            </Suspense>
          </div>

          <div className="flex flex-col gap-5">
            <QuickActions />

            <Suspense fallback={<PanelSkeleton height="h-64" />}>
              <LowStock />
            </Suspense>

            <Suspense fallback={<PanelSkeleton height="h-64" />}>
              <StockByCategory />
            </Suspense>

            <Suspense fallback={<PanelSkeleton height="h-56" />}>
              <GiftingRequests />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
