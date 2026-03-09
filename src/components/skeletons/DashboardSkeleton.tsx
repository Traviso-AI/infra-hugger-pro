import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="container px-4 py-6 md:py-12 space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-5 flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-7 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-24" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-4 flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
