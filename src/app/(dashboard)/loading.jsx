import { PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

/**
 * The home screen's route-transition fallback, the same shape as the page so
 * the screen does not reflow twice on the way in.
 */
export default function DashboardLoading() {
  return (
    <>
      <PageHeaderSkeleton />

      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 pb-10 sm:px-6">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-36 rounded-lg" />
          <Skeleton className="h-8 w-44 rounded-lg" />
        </div>
        <Skeleton className="h-[22rem] rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    </>
  );
}
