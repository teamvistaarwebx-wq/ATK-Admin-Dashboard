import { PageSkeleton, Skeleton, TableSkeleton } from "@/components/ui/skeleton";

/** Mirrors the orders page: the figures strip, then the table card. */
export default function OrdersLoading() {
  return (
    <PageSkeleton hasAction>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16 rounded-xl" />
        <TableSkeleton rows={10} columns={8} />
      </div>
    </PageSkeleton>
  );
}
