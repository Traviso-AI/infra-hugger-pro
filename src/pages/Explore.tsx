import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TripCard } from "@/components/trips/TripCard";
import { ExploreFilterBar, ExploreFilters, defaultFilters } from "@/components/trips/ExploreFilterBar";
import { SearchAutocomplete } from "@/components/explore/SearchAutocomplete";
import { ExploreMap } from "@/components/explore/ExploreMap";
import { Users, ChevronLeft, ChevronRight, TrendingUp, UserPlus, Map as MapIcon, LayoutGrid } from "lucide-react";
import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis,
} from "@/components/ui/pagination";

const PAGE_SIZE = 21;

export default function Explore() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ExploreFilters>(defaultFilters);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);

  const scrollCarousel = (offset: number) => {
    const el = carouselRef.current;
    if (!el) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10;
    const atStart = el.scrollLeft <= 10;
    if (offset > 0 && atEnd) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else if (offset < 0 && atStart) {
      el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    } else {
      el.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  // Reset to page 1 when search changes
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: ExploreFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["explore-trips", search, page, filters],
    queryFn: async () => {
      let countQuery = supabase
        .from("trips")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true);

      if (search) {
        countQuery = countQuery.or(`title.ilike.%${search}%,destination.ilike.%${search}%`);
      }
      if (filters.minPrice > 0) {
        countQuery = countQuery.gte("price_estimate", filters.minPrice);
      }
      if (filters.maxPrice < 10000) {
        countQuery = countQuery.lte("price_estimate", filters.maxPrice);
      }
      if (filters.minDuration > 1) {
        countQuery = countQuery.gte("duration_days", filters.minDuration);
      }
      if (filters.maxDuration < 30) {
        countQuery = countQuery.lte("duration_days", filters.maxDuration);
      }
      if (filters.selectedTags.length > 0) {
        countQuery = countQuery.overlaps("tags", filters.selectedTags);
      }

      const { count } = await countQuery;

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Determine sort
      let orderCol = "total_bookings";
      let ascending = false;
      if (filters.sortBy === "newest") { orderCol = "created_at"; ascending = false; }
      else if (filters.sortBy === "price-low") { orderCol = "price_estimate"; ascending = true; }
      else if (filters.sortBy === "price-high") { orderCol = "price_estimate"; ascending = false; }
      else if (filters.sortBy === "rating") { orderCol = "avg_rating"; ascending = false; }

      let query = supabase
        .from("trips")
        .select("*, profiles!trips_creator_id_profiles_fkey(display_name, avatar_url, username)")
        .eq("is_published", true)
        .order(orderCol, { ascending })
        .range(from, to);

      if (search) {
        query = query.or(`title.ilike.%${search}%,destination.ilike.%${search}%`);
      }
      if (filters.minPrice > 0) {
        query = query.gte("price_estimate", filters.minPrice);
      }
      if (filters.maxPrice < 10000) {
        query = query.lte("price_estimate", filters.maxPrice);
      }
      if (filters.minDuration > 1) {
        query = query.gte("duration_days", filters.minDuration);
      }
      if (filters.maxDuration < 30) {
        query = query.lte("duration_days", filters.maxDuration);
      }
      if (filters.selectedTags.length > 0) {
        query = query.overlaps("tags", filters.selectedTags);
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

  // Track carousel scroll position for smart fades
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    // Small delay to let DOM update after filtered trips change
    const timer = setTimeout(updateScrollState, 100);
    el.addEventListener("scroll", updateScrollState, { passive: true });
    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", updateScrollState);
    };
  }, [updateScrollState, filteredFollowingTrips]);

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
        <p className="mt-2 text-lg text-muted-foreground">Travel like your favorite influencer. Find their itineraries, book their spots.</p>
      </div>

      <SearchAutocomplete
        value={search}
        onChange={handleSearch}
        className="mb-4 max-w-md"
      />

      <div className="mb-8">
        <ExploreFilterBar filters={filters} onChange={handleFiltersChange} />
      </div>

      {/* From Creators You Follow */}
      {user && (
        <div className="mb-10">
          <h2 className="font-display text-xl font-bold mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" /> From Creators You Follow
          </h2>
          {!hasFollows ? (
            <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center">
              <UserPlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Follow creators to see their trips here</p>
            </div>
          ) : filteredFollowingTrips.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center">
              <p className="text-sm text-muted-foreground">No matching trips from creators you follow</p>
            </div>
          ) : (
            <div className="relative group">
              <div
                ref={carouselRef}
                className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x snap-mandatory scrollbar-hide scroll-smooth"
              >
                {filteredFollowingTrips.map((trip: any) => (
                  <div key={trip.id} className="w-[280px] snap-start flex-shrink-0">
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
                      maxTags={2}
                    />
                  </div>
                ))}
              </div>
              {/* Fade hints — only when scrollable in that direction */}
              {canScrollLeft && (
                <div className="absolute left-0 top-0 bottom-4 w-10 bg-gradient-to-r from-background to-transparent pointer-events-none z-[1]" />
              )}
              {canScrollRight && (
                <div className="absolute right-0 top-0 bottom-4 w-10 bg-gradient-to-l from-background to-transparent pointer-events-none z-[1]" />
              )}
              {/* Arrow buttons — always visible on mobile, hover on desktop */}
              <button
                onClick={() => scrollCarousel(-300)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 h-9 w-9 rounded-full bg-background border shadow-md flex items-center justify-center hover:bg-muted transition-colors md:opacity-0 md:group-hover:opacity-100"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scrollCarousel(300)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 h-9 w-9 rounded-full bg-background border shadow-md flex items-center justify-center hover:bg-muted transition-colors md:opacity-0 md:group-hover:opacity-100"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {user && (
        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
          <div className="h-1.5 w-1.5 rounded-full bg-accent/40" />
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" /> Trending Trips
        </h2>
        <div className="flex rounded-lg border overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors ${viewMode === "grid" ? "bg-accent text-white" : "hover:bg-muted"}`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Grid
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors ${viewMode === "map" ? "bg-accent text-white" : "hover:bg-muted"}`}
          >
            <MapIcon className="h-3.5 w-3.5" /> Map
          </button>
        </div>
      </div>

      {viewMode === "map" ? (
        <ExploreMap trips={trips} />
      ) : isLoading ? (
        <TripCardSkeletonGrid />
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
