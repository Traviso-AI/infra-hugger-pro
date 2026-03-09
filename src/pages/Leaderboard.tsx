import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Users, TrendingUp, MapPin, Heart } from "lucide-react";
import { Link } from "react-router-dom";

export default function Leaderboard() {
  const { data: topTrips } = useQuery({
    queryKey: ["leaderboard-trips"],
    queryFn: async () => {
      const { data } = await supabase
        .from("trips")
        .select("*, profiles!trips_creator_id_profiles_fkey(display_name)")
        .eq("is_published", true)
        .order("total_bookings", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const { data: topCreators } = useQuery({
    queryKey: ["leaderboard-creators"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_creator", true)
        .order("total_earnings", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const { data: topRated } = useQuery({
    queryKey: ["leaderboard-rated"],
    queryFn: async () => {
      const { data } = await supabase
        .from("trips")
        .select("*, profiles!trips_creator_id_profiles_fkey(display_name)")
        .eq("is_published", true)
        .order("avg_rating", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const { data: topSaved } = useQuery({
    queryKey: ["leaderboard-saved"],
    queryFn: async () => {
      const { data } = await supabase
        .from("trips")
        .select("*, profiles!trips_creator_id_profiles_fkey(display_name)")
        .eq("is_published", true)
        .order("total_favorites", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  return (
    <div className="container py-8 md:py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-8 w-8 text-sunset" />
          <h1 className="font-display text-4xl font-bold">Leaderboard</h1>
        </div>
        <p className="text-muted-foreground">Top trips and creators on Traviso</p>
      </div>

      <Tabs defaultValue="bookings">
        <TabsList className="mb-6">
          <TabsTrigger value="bookings">Most Booked</TabsTrigger>
          <TabsTrigger value="rated">Top Rated</TabsTrigger>
          <TabsTrigger value="saved">Most Saved</TabsTrigger>
          <TabsTrigger value="creators">Top Creators</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <div className="space-y-3">
            {topTrips?.map((trip: any, i: number) => (
              <Link key={trip.id} to={`/trip/${trip.id}`}>
                <Card className="transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-[1.02] hover:border-l-4 hover:border-l-accent">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 font-display text-lg font-bold text-accent">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{trip.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {trip.destination} · by {trip.profiles?.display_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold flex items-center gap-1">
                        <Users className="h-4 w-4" /> {trip.total_bookings || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">bookings</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {(!topTrips || topTrips.length === 0) && (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-muted/30 px-6 py-14 text-center">
                <Users className="h-10 w-10 text-accent/40 mb-3" />
                <h3 className="font-display text-lg font-semibold mb-1">No trips yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">Be the first to create and publish a trip to appear on the leaderboard.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rated">
          <div className="space-y-3">
            {topRated?.map((trip: any, i: number) => (
              <Link key={trip.id} to={`/trip/${trip.id}`}>
                <Card className="transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-[1.02] hover:border-l-4 hover:border-l-accent">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sunset/10 font-display text-lg font-bold text-sunset">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{trip.title}</h3>
                      <p className="text-sm text-muted-foreground">{trip.destination}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold flex items-center gap-1">
                        <Star className="h-4 w-4 fill-sunset text-sunset" /> {trip.avg_rating?.toFixed(1) || "—"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {(!topRated || topRated.length === 0) && (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-muted/30 px-6 py-14 text-center">
                <Star className="h-10 w-10 text-sunset/40 mb-3" />
                <h3 className="font-display text-lg font-semibold mb-1">No rated trips yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">Book a trip and leave a review to see ratings here.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="saved">
          <div className="space-y-3">
            {topSaved?.map((trip: any, i: number) => (
              <Link key={trip.id} to={`/trip/${trip.id}`}>
                <Card className="transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-[1.02] hover:border-l-4 hover:border-l-accent">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 font-display text-lg font-bold text-red-500">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{trip.title}</h3>
                      <p className="text-sm text-muted-foreground">{trip.destination} · by {trip.profiles?.display_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold flex items-center gap-1">
                        <Heart className="h-4 w-4 fill-red-500 text-red-500" /> {trip.total_favorites || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">saves</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {(!topSaved || topSaved.length === 0) && (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-muted/30 px-6 py-14 text-center">
                <Heart className="h-10 w-10 text-destructive/40 mb-3" />
                <h3 className="font-display text-lg font-semibold mb-1">No saved trips yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">Save trips you love and they'll appear here.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="creators">
          <div className="space-y-3">
            {topCreators?.map((creator: any, i: number) => (
              <Link key={creator.id} to={creator.username ? `/profile/${creator.username}` : "#"} className="block">
                <Card className="transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-[1.02] hover:border-l-4 hover:border-l-accent">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 font-display text-lg font-bold text-accent">
                      {i + 1}
                    </div>
                    <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center font-medium shrink-0">
                      {creator.display_name?.[0] || "C"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">{creator.display_name}</h3>
                      {creator.username && <p className="text-xs text-muted-foreground">@{creator.username}</p>}
                      {creator.bio && <p className="text-sm text-muted-foreground truncate">{creator.bio}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold flex items-center gap-1 justify-end">
                        <TrendingUp className="h-4 w-4 text-accent" /> ${(creator.total_earnings || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">earned</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {(!topCreators || topCreators.length === 0) && (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-muted/30 px-6 py-14 text-center">
                <TrendingUp className="h-10 w-10 text-accent/40 mb-3" />
                <h3 className="font-display text-lg font-semibold mb-1">No creators yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">Enable Creator Mode and publish a trip to join the leaderboard.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
