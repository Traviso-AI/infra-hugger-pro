import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Eye, DollarSign, BookOpen, Heart } from "lucide-react";
import { TripCard } from "@/components/trips/TripCard";

export default function Dashboard() {
  const { user, profile } = useAuth();

  const { data: myTrips } = useQuery({
    queryKey: ["my-trips", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("trips")
        .select("*")
        .eq("creator_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: myBookings } = useQuery({
    queryKey: ["my-bookings", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*, trips(title, destination)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: myFavorites } = useQuery({
    queryKey: ["my-favorites", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("*, trips(*, profiles!trips_creator_id_profiles_fkey(display_name, avatar_url))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const publishedCount = myTrips?.filter((t) => t.is_published).length || 0;
  const totalBookings = myTrips?.reduce((sum, t) => sum + (t.total_bookings || 0), 0) || 0;
  const totalRevenue = myTrips?.reduce((sum, t) => sum + (t.total_revenue || 0), 0) || 0;

  return (
    <div className="container py-8 md:py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.display_name || "Traveler"}</p>
        </div>
        <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link to="/create-trip"><Plus className="mr-2 h-4 w-4" /> Create Trip</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        {[
          { label: "Published Trips", value: publishedCount, icon: MapPin },
          { label: "Total Bookings", value: totalBookings, icon: BookOpen },
          { label: "Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign },
          { label: "My Bookings", value: myBookings?.length || 0, icon: Eye },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Icon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* My Trips */}
      <div className="mb-8">
        <h2 className="font-display text-xl font-bold mb-4">My Trips</h2>
        {myTrips && myTrips.length > 0 ? (
          <div className="space-y-3">
            {myTrips.map((trip) => (
              <Link key={trip.id} to={`/trip/${trip.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <h3 className="font-medium">{trip.title}</h3>
                      <p className="text-sm text-muted-foreground">{trip.destination} · {trip.duration_days} days</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={trip.is_published ? "default" : "secondary"}>
                        {trip.is_published ? "Published" : "Draft"}
                      </Badge>
                      {trip.price_estimate && (
                        <span className="text-sm font-medium">${trip.price_estimate}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">You haven't created any trips yet</p>
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/create-trip">Create Your First Trip</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* My Bookings */}
      <div>
        <h2 className="font-display text-xl font-bold mb-4">My Bookings</h2>
        {myBookings && myBookings.length > 0 ? (
          <div className="space-y-3">
            {myBookings.map((booking: any) => (
              <Card key={booking.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-medium">{booking.trips?.title || "Trip"}</h3>
                    <p className="text-sm text-muted-foreground">
                      {booking.check_in} → {booking.check_out} · {booking.guests} guest(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                      {booking.status}
                    </Badge>
                    {booking.total_price && (
                      <span className="text-sm font-medium">${booking.total_price}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No bookings yet. Explore trips to get started!
            </CardContent>
          </Card>
        )}
      </div>

      {/* Saved Trips */}
      <div>
        <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" /> Saved Trips
        </h2>
        {myFavorites && myFavorites.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {myFavorites.map((fav: any) => {
              const trip = fav.trips;
              if (!trip) return null;
              return (
                <TripCard
                  key={fav.id}
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
                  tags={trip.tags}
                />
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No saved trips yet. Browse the marketplace and save trips you love!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
