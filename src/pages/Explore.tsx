import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TripCard } from "@/components/trips/TripCard";
import { Input } from "@/components/ui/input";
import { Search, Users, ChevronLeft, ChevronRight, TrendingUp, UserPlus } from "lucide-react";
import { useState, useRef, useMemo } from "react";
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis,
} from "@/components/ui/pagination";

const PAGE_SIZE = 21;

export default function Explore() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollCarousel = (offset: number) => {
    carouselRef.current?.scrollBy({ left: offset, behavior: "smooth" });
  };

  // Reset to page 1 when search changes
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["explore-trips", search, page],
    queryFn: async () => {
      let countQuery = supabase
        .from("trips")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true);

      if (search) {
        countQuery = countQuery.or(`title.ilike.%${search}%,destination.ilike.%${search}%`);
      }

      const { count } = await countQuery;

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("trips")
        .select("*, profiles!trips_creator_id_profiles_fkey(display_name, avatar_url, username)")
        .eq("is_published", true)
        .order("total_bookings", { ascending: false })
        .range(from, to);

      if (search) {
        query = query.or(`title.ilike.%${search}%,destination.ilike.%${search}%`);
      }

      const { data: trips } = await query;
      return { trips: trips || [], total: count || 0 };
    },
  });

  // Trips from creators the user follows
  const { data: followingTrips, isLoading: followingLoading } = useQuery({
    queryKey: ["explore-following-trips", user?.id],
    queryFn: async () => {
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user!.id);
      if (!follows || follows.length === 0) return { trips: [], hasFollows: false };
      const creatorIds = follows.map((f) => f.following_id);
      const { data } = await supabase
        .from("trips")
        .select("*, profiles!trips_creator_id_profiles_fkey(display_name, avatar_url, username)")
        .eq("is_published", true)
        .in("creator_id", creatorIds)
        .order("created_at", { ascending: false })
        .limit(12);
      return { trips: data || [], hasFollows: true };
    },
    enabled: !!user,
  });

  const hasFollows = followingTrips?.hasFollows ?? false;
  const allFollowingTrips = followingTrips?.trips || [];

  // Filter following trips by search
  const filteredFollowingTrips = useMemo(() => {
    if (!search) return allFollowingTrips;
    const s = search.toLowerCase();
    return allFollowingTrips.filter(
      (t: any) =>
        t.title?.toLowerCase().includes(s) ||
        t.destination?.toLowerCase().includes(s)
    );
  }, [allFollowingTrips, search]);

  const trips = data?.trips || [];
  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("ellipsis");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="container py-8 md:py-12">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold">Explore Trips</h1>
        <p className="mt-2 text-muted-foreground">Discover curated travel itineraries from creators around the world</p>
      </div>

      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search destinations or trips..."
          className="pl-10"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* From Creators You Follow — horizontal carousel */}
      {user && followingTrips && followingTrips.length > 0 && !search && (
        <div className="mb-10 relative">
          <h2 className="font-display text-xl font-bold mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" /> From Creators You Follow
          </h2>
          <div className="relative group">
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x snap-mandatory scrollbar-hide scroll-smooth"
            >
              {followingTrips.map((trip: any) => (
                <div key={trip.id} className="min-w-[260px] max-w-[280px] snap-start flex-shrink-0">
                  <TripCard
                    id={trip.id}
                    title={trip.title}
                    destination={trip.destination}
                    coverImage={trip.cover_image_url}
                    durationDays={trip.duration_days}
                    priceEstimate={trip.price_estimate}
                    avgRating={trip.avg_rating}
                    totalBookings={trip.total_bookings}
                    creatorName={trip.profiles?.display_name}
                    creatorAvatar={trip.profiles?.avatar_url}
                    creatorUsername={trip.profiles?.username}
                    creatorId={trip.creator_id}
                    tags={trip.tags}
                  />
                </div>
              ))}
            </div>
            {/* Fade hint on right edge */}
            <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
            {/* Arrow buttons */}
            <button
              onClick={() => scrollCarousel(-300)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 h-9 w-9 rounded-full bg-background border shadow-md flex items-center justify-center hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scrollCarousel(300)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 h-9 w-9 rounded-full bg-background border shadow-md flex items-center justify-center hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-accent" /> Trending Trips
      </h2>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border bg-muted aspect-[4/5]" />
          ))}
        </div>
      ) : trips.length > 0 ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip: any) => (
              <TripCard
                key={trip.id}
                id={trip.id}
                title={trip.title}
                destination={trip.destination}
                coverImage={trip.cover_image_url}
                durationDays={trip.duration_days}
                priceEstimate={trip.price_estimate}
                avgRating={trip.avg_rating}
                totalBookings={trip.total_bookings}
                creatorName={trip.profiles?.display_name}
                creatorAvatar={trip.profiles?.avatar_url}
                creatorUsername={trip.profiles?.username}
                creatorId={trip.creator_id}
                tags={trip.tags}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination className="mt-10">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {getPageNumbers().map((p, i) =>
                  p === "ellipsis" ? (
                    <PaginationItem key={`e-${i}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={p}>
                      <PaginationLink
                        isActive={p === page}
                        onClick={() => setPage(p)}
                        className="cursor-pointer"
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <div className="rounded-xl border-2 border-dashed bg-muted/50 p-12 text-center">
          <p className="text-muted-foreground">No trips found. Try a different search or check back later!</p>
        </div>
      )}
    </div>
  );
}
