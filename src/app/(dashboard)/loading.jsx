import { PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";
import { KpiRowSkeleton } from "@/features/dashboard/components/panel-skeletons";

/**
 * The dashboard's own route-transition fallback.
 *
 * It mirrors the panel grid rather than showing a generic block, because the
 * page it replaces already streams panel by panel — a fallback of a different
 * shape would make the screen reflow twice on the way in. Every other section
 * has its own `loading.jsx` for the same reason; this file is not a shared
 * default.
 */
export default function DashboardLoading() {
  return (
    <>
      <PageHeaderSkeleton />

      <div className="flex flex-col gap-5 px-6 py-6 sm:px-8">
        <KpiRowSkeleton />

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="flex flex-col gap-5 lg:col-span-2">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>

          <div className="flex flex-col gap-5">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
          </div>
        </div>
      </div>
    </>
  );
}
