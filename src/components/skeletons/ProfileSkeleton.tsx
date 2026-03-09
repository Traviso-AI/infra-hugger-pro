import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="container py-8 md:py-12">
      <div className="flex flex-col items-center text-center mb-10">
        <Skeleton className="h-24 w-24 rounded-full mb-4" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-4 w-64 mb-6" />
        <div className="flex items-center gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-8 w-10 mx-auto mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>
      <div className="flex justify-center mb-6">
        <Skeleton className="h-10 w-72 rounded-lg" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card overflow-hidden">
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
