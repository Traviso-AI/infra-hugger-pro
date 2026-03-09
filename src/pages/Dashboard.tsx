import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Eye, DollarSign, BookOpen, Heart, Send, Pencil, FolderOpen } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { TripCard } from "@/components/trips/TripCard";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { CreatorAnalytics } from "@/components/dashboard/CreatorAnalytics";
import { MyGroups } from "@/components/dashboard/MyGroups";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  const handlePublish = async (tripId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { error } = await supabase
      .from("trips")
      .update({ is_published: true })
      .eq("id", tripId);
    if (error) {
      toast.error("Failed to publish trip");
    } else {
      toast.success("Trip published!");
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
    }
  };
  return (
    <div className="container px-4 py-6 md:py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back, {profile?.display_name || "Traveler"}</p>
        </div>
        <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 w-full sm:w-auto">
          <Link to="/create-trip"><Plus className="mr-2 h-4 w-4" /> Create Trip</Link>
        </Button>
      </div>

      <OnboardingChecklist />

      {/* Creator Analytics */}
      <div className="mb-6 md:mb-8">
        <CreatorAnalytics />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6 md:mb-8">
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
                <Card className="transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-[1.02] hover:border-l-4 hover:border-l-accent">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <h3 className="font-medium">{trip.title}</h3>
                      <p className="text-sm text-muted-foreground">{trip.destination} · {trip.duration_days} days</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={trip.is_published ? "default" : "secondary"}>
                        {trip.is_published ? "Published" : "Draft"}
                      </Badge>
                      {!trip.is_published && (
                        <Button size="sm" variant="outline" onClick={(e) => handlePublish(trip.id, e)}>
                          <Send className="mr-1 h-3 w-3" /> Publish
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/edit-trip/${trip.id}`); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
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
          <EmptyState
            icon={Plus}
            title="No trips yet"
            description="Create your first trip itinerary and share it with the world. Start earning when others book your recommendations."
            actionLabel="Create Your First Trip"
            actionHref="/create-trip"
          />
        )}
      </div>

      {/* My Bookings */}
      <div className="mb-8">
        <h2 className="font-display text-xl font-bold mb-4">My Bookings</h2>
        {myBookings && myBookings.length > 0 ? (
          <div className="space-y-3">
            {myBookings.map((booking: any) => (
              <Card key={booking.id} className="transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-[1.02] hover:border-l-4 hover:border-l-accent">
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
          <EmptyState
            icon={MapPin}
            title="No bookings yet"
            description="Browse curated trips from top creators and book your next adventure."
            actionLabel="Explore Trips"
            actionHref="/explore"
          />
        )}
      </div>

      {/* Saved Trips */}
      <div className="mb-8">
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
          <EmptyState
            icon={Heart}
            title="No saved trips"
            description="Heart trips you love while browsing to save them here for later."
            actionLabel="Explore Trips"
            actionHref="/explore"
          />
        )}
      </div>

      {/* Collections CTA */}
      <div className="mb-8">
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-8 w-8 text-accent" />
              <div>
                <h3 className="font-medium">Organize your saved trips</h3>
                <p className="text-sm text-muted-foreground">Create collections like "Summer 2026" or "Honeymoon Ideas"</p>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link to="/collections">View Collections</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
