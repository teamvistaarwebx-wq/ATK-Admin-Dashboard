import { PageHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

/** Matches the two-column order detail. */
export default function OrderDetailLoading() {
  return (
    <>
      <PageHeaderSkeleton hasAction />
      <div className="mx-auto grid w-full max-w-[1100px] gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </>
  );
}
