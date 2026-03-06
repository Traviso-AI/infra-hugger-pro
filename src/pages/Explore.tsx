import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TripCard } from "@/components/trips/TripCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

export default function Explore() {
  const [search, setSearch] = useState("");

  const { data: trips, isLoading } = useQuery({
    queryKey: ["explore-trips", search],
    queryFn: async () => {
      let query = supabase
        .from("trips")
        .select("*, profiles!trips_creator_id_profiles_fkey(display_name, avatar_url, username)")
        .eq("is_published", true)
        .order("total_bookings", { ascending: false });

      if (search) {
        query = query.or(`title.ilike.%${search}%,destination.ilike.%${search}%`);
      }

      const { data } = await query.limit(24);
      return data || [];
    },
  });

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
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border bg-muted aspect-[4/5]" />
          ))}
        </div>
      ) : trips && trips.length > 0 ? (
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
      ) : (
        <div className="rounded-xl border-2 border-dashed bg-muted/50 p-12 text-center">
          <p className="text-muted-foreground">No trips found. Try a different search or check back later!</p>
        </div>
      )}
    </div>
  );
}
