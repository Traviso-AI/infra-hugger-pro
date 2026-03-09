import { Skeleton } from "@/components/ui/skeleton";

export function TripDetailSkeleton() {
  return (
    <div>
      <Skeleton className="w-full h-[50vh]" />
      <div className="container -mt-16 relative pb-16">
        <Skeleton className="h-8 w-20 mb-4" />
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Sidebar */}
          <div className="space-y-6 order-first lg:order-last">
            <div className="rounded-xl border bg-card p-6 space-y-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <div className="border-t pt-4 mt-4 space-y-3">
                <Skeleton className="h-3 w-20" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Main */}
          <div className="lg:col-span-2 space-y-6 order-last lg:order-first">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-10 w-3/4" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-8 w-32" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
