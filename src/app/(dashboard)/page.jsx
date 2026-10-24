import { Suspense } from "react";
import { House } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { CompareSelect, DateRangePicker } from "@/components/ui/date-range-picker";
import { requireAdmin } from "@/lib/auth/dal";
import { formatRangeLabel, resolveDateRange } from "@/lib/date-range";
import { getOverview } from "@/features/analytics/queries/get-overview";
import { getLiveView } from "@/features/analytics/queries/get-live-view";
import { GiftingRequests } from "@/features/dashboard/components/gifting-requests";
import { LiveViewCard } from "@/features/dashboard/components/live-view-card";
import { LowStock } from "@/features/dashboard/components/low-stock";
import { MetricsCard } from "@/features/dashboard/components/metrics-card";
import { RecentOrdersCard } from "@/features/dashboard/components/recent-orders-card";
import { RegionCard } from "@/features/dashboard/components/region-card";
import { PanelSkeleton } from "@/features/dashboard/components/panel-skeletons";

export const metadata = { title: "Home | AKT Gifting Admin" };

/**
 * The home screen, after Shopify's: pick a range, read the headline numbers
 * against the period before, then where the traffic and sales came from and
 * who is on the store right now.
 *
 * Every panel fetches its own data behind its own Suspense boundary, so the
 * header and the range controls paint immediately and each card fills in as
 * its aggregation lands.
 */
export default async function DashboardPage({ searchParams }) {
  const session = await requireAdmin();
  const params = await searchParams;

  const range = resolveDateRange({
    range: params?.range,
    from: params?.from,
    to: params?.to,
    compare: params?.compare,
  });

  // Only plain fields cross into the client controls.
  const control = {
    key: range.key,
    label: range.label,
    from: range.from,
    to: range.to,
    compare: range.compare,
  };

  return (
    <>
      <PageHeader
        title="Home"
        icon={<House className="h-5 w-5" strokeWidth={2} />}
        subtitle={`${greeting()}, ${firstName(session)}. Here is how the store is doing.`}
      />

      <PageBody className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker range={control} />
          <CompareSelect range={control} />
          <span className="ml-auto text-xs text-muted">All figures in IST</span>
        </div>

        <Suspense fallback={<PanelSkeleton height="h-[22rem]" />}>
          <Overview range={range} />
        </Suspense>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Suspense fallback={<PanelSkeleton height="h-96" />}>
              <RegionCard range={range} />
            </Suspense>
          </div>

          <Suspense fallback={<PanelSkeleton height="h-96" />}>
            <LiveView />
          </Suspense>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Suspense fallback={<PanelSkeleton height="h-80" />}>
            <RecentOrdersCard />
          </Suspense>

          <Suspense fallback={<PanelSkeleton height="h-80" />}>
            <GiftingRequests />
          </Suspense>

          <Suspense fallback={<PanelSkeleton height="h-80" />}>
            <LowStock />
          </Suspense>
        </div>
      </PageBody>
    </>
  );
}

async function Overview({ range }) {
  const overview = await getOverview(range);
  const m = overview.metrics;

  const noTraffic =
    m.sessions.total === 0 && (m.sessions.previous ?? 0) === 0
      ? "No storefront visits recorded in this range. Sessions and visitors fill in once the storefront calls /api/analytics/track — see the README."
      : null;

  // Serialisable rows only: the card picks a formatter by name.
  const metrics = [
    { key: "revenue", label: "Total sales", format: "money", ...m.revenue },
    { key: "orders", label: "Orders", format: "count", ...m.orders },
    { key: "aov", label: "Average order value", format: "money", ...m.aov },
    { key: "visitors", label: "Visitors", format: "count", empty: noTraffic, ...m.visitors },
    { key: "sessions", label: "Sessions", format: "count", empty: noTraffic, ...m.sessions },
    { key: "inquiries", label: "Inquiries", format: "count", ...m.inquiries },
  ];

  return (
    <MetricsCard
      metrics={metrics}
      labels={overview.labels}
      previousLabels={overview.previousLabels}
      rangeLabel={formatRangeLabel(range.from, range.to)}
      comparisonLabel={range.comparison?.label ?? null}
    />
  );
}

async function LiveView() {
  const live = await getLiveView();
  return <LiveViewCard initial={live} />;
}

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date())
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function firstName(session) {
  return String(session.name || session.email || "there").split(/[\s@]/)[0];
}
