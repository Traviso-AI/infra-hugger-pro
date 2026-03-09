import { Skeleton } from "@/components/ui/skeleton";

export function TripCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function TripCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <TripCardSkeleton key={i} />
      ))}
    </div>
  );
}
