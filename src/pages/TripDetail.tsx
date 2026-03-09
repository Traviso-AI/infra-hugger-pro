import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Star, Users, Calendar, Plane, Hotel, Utensils, Activity, Bus, Music } from "lucide-react";
import { getDestinationCover, getDestinationCoverFallback, isGenericPlaceholder } from "@/lib/destination-covers";
import { toast } from "sonner";
import { ShareTripModal } from "@/components/sharing/ShareTripModal";
import { ViralSignupBanner } from "@/components/sharing/ViralSignupBanner";
import { useEffect } from "react";

const typeIcons: Record<string, any> = {
  flight: Plane, hotel: Hotel, restaurant: Utensils,
  activity: Activity, event: Music, transport: Bus,
};

export default function TripDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: trip, isLoading } = useQuery({
    queryKey: ["trip", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("trips")
        .select("*, profiles!trips_creator_id_profiles_fkey(display_name, avatar_url, username, bio)")
        .eq("id", id)
        .single();
      return data;
    },
    enabled: !!id,
  });

  const { data: days } = useQuery({
    queryKey: ["trip-days", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("trip_days")
        .select("*, trip_activities(*)")
        .eq("trip_id", id!)
        .order("day_number");
      return data || [];
    },
    enabled: !!id,
  });

  const { data: reviews } = useQuery({
    queryKey: ["trip-reviews", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*, profiles!reviews_user_id_profiles_fkey(display_name, avatar_url)")
        .eq("trip_id", id!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
    </div>
  );

  if (!trip) return (
    <div className="container py-16 text-center">
      <h1 className="font-display text-2xl font-bold">Trip not found</h1>
    </div>
  );

  const handleBook = () => {
    if (!user) {
      toast.error("Please sign in to book this trip");
      navigate("/login");
      return;
    }
    navigate(`/booking/${trip.id}`);
  };

  const creator = trip.profiles as any;

  return (
    <div>
      {/* Hero */}
      <div className="relative h-64 md:h-96 bg-muted">
        <img
          src={(!trip.cover_image_url || isGenericPlaceholder(trip.cover_image_url)) ? getDestinationCover(trip.destination, 1200, 600, trip.id) : trip.cover_image_url}
          alt={trip.title}
          className="h-full w-full object-cover"
          onError={(e) => { e.currentTarget.src = getDestinationCoverFallback(trip.destination); }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      <div className="container -mt-16 relative pb-16">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Booking sidebar — shown first on mobile, right column on desktop */}
          <div className="space-y-6 order-first lg:order-last">
            <Card className="lg:sticky lg:top-24">
              <CardContent className="p-6">
                {trip.price_estimate && (
                  <div className="mb-4">
                    <span className="text-3xl font-bold">${trip.price_estimate.toLocaleString()}</span>
                    <span className="text-muted-foreground"> / person</span>
                  </div>
                )}
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg" onClick={handleBook}>
                  Check Availability →
                </Button>

                {creator && (
                  <div className="mt-6 border-t pt-4">
                    <p className="text-xs text-muted-foreground mb-2">Created by</p>
                    <Link
                      to={creator.username ? `/profile/${creator.username}` : "#"}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center font-medium">
                        {creator.display_name?.[0] || "C"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{creator.display_name}</p>
                        {creator.username && <p className="text-xs text-muted-foreground">@{creator.username}</p>}
                      </div>
                    </Link>
                    {creator.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{creator.bio}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="lg:col-span-2 space-y-8 order-last lg:order-first">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {trip.tags?.map((tag: string) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
              <h1 className="font-display text-3xl font-bold md:text-4xl">{trip.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-accent" /> {trip.destination}</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {trip.duration_days} days</span>
                {trip.avg_rating && trip.avg_rating > 0 && (
                  <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-sunset text-sunset" /> {trip.avg_rating}</span>
                )}
                {trip.total_bookings != null && trip.total_bookings > 0 ? (
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {trip.total_bookings} booked</span>
                ) : (
                  <Badge variant="secondary" className="text-xs">New</Badge>
                )}
              </div>
              {trip.description && <p className="mt-4 text-muted-foreground leading-relaxed">{trip.description}</p>}
            </div>

            {/* Itinerary */}
            {days && days.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-bold mb-4">Itinerary</h2>
                <div className="space-y-6">
                  {days.map((day: any) => (
                    <Card key={day.id}>
                      <CardContent className="p-5">
                        <h3 className="font-display text-lg font-semibold mb-1">
                          Day {day.day_number}{day.title ? `: ${day.title.replace(/^Day\s*\d+\s*:\s*/i, "")}` : ""}
                        </h3>
                        {day.description && <p className="text-sm text-muted-foreground mb-3">{day.description}</p>}
                        {day.trip_activities && day.trip_activities.length > 0 ? (
                          <div className="space-y-3">
                            {[...day.trip_activities]
                              .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
                              .map((act: any) => {
                                const Icon = typeIcons[act.type] || Activity;
                                return (
                                  <div key={act.id} className="flex gap-3 rounded-lg border p-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                                      <Icon className="h-4 w-4 text-accent" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">{act.title}</span>
                                        <Badge variant="outline" className="text-xs">{act.type}</Badge>
                                      </div>
                                      {act.description && <p className="text-xs text-muted-foreground mt-0.5">{act.description}</p>}
                                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                                        {act.location && <span>{act.location}</span>}
                                        {act.start_time && <span>{act.start_time}</span>}
                                        {act.price_estimate && <span className="font-medium text-foreground">${act.price_estimate}</span>}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No activities planned yet</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews && reviews.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-bold mb-4">Reviews</h2>
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium">
                            {review.profiles?.display_name?.[0] || "U"}
                          </div>
                          <span className="text-sm font-medium">{review.profiles?.display_name || "User"}</span>
                          <div className="flex">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} className="h-3.5 w-3.5 fill-sunset text-sunset" />
                            ))}
                          </div>
                        </div>
                        {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
