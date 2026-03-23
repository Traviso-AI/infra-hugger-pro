import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/EmptyState";
import { TripCard } from "@/components/trips/TripCard";
import {
  Plus, MapPin, Heart, Send, Pencil, FolderOpen, Calendar as CalIcon,
  ChevronLeft, ChevronRight, Plane, Users, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { usePageSEO } from "@/hooks/usePageSEO";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, addMonths, subMonths, isToday, getDay,
} from "date-fns";

interface CalendarEvent {
  id: string;
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  type: "booking" | "group";
  tripId: string;
  coverImage?: string | null;
}

export default function MyTrips() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  usePageSEO({
    title: "My Trips | Traviso AI",
    description: "View your trips, bookings, saved itineraries, and travel calendar.",
  });

  // --- Data fetching ---
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
      const { data } = await (supabase as any)
        .from("trip_sessions")
        .select("*, booking_items(*)")
        .eq("user_id", user!.id)
        .in("status", ["completed", "confirmed", "processing"])
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

  const { data: groupCollabs } = useQuery({
    queryKey: ["calendar-groups", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("trip_collaborators")
        .select("trip_id, trips(title, destination, cover_image_url, duration_days, created_at)")
        .eq("user_id", user!.id)
        .not("accepted_at", "is", null);
      return data || [];
    },
    enabled: !!user,
  });

  // --- Calendar events ---
  const events: CalendarEvent[] = useMemo(() => {
    const result: CalendarEvent[] = [];
    (myBookings || []).forEach((b: any) => {
      const hotels = b.selected_hotels ?? [];
      const destination = (b.traveler_info as any)?.destination ?? "Trip";
      const checkIn = hotels[0]?.check_in_date;
      if (!checkIn) return;
      const checkOut = hotels[0]?.check_out_date;
      result.push({
        id: b.id,
        title: `Trip to ${destination}`,
        destination,
        startDate: new Date(checkIn),
        endDate: checkOut ? new Date(checkOut) : new Date(checkIn),
        type: "booking",
        tripId: b.id,
        coverImage: hotels[0]?.image_url ?? null,
      });
    });
    (groupCollabs || []).forEach((g: any) => {
      if (!g.trips) return;
      const start = new Date(g.trips.created_at);
      const end = new Date(start);
      end.setDate(end.getDate() + (g.trips.duration_days || 1) - 1);
      result.push({
        id: `group-${g.trip_id}`,
        title: g.trips.title,
        destination: g.trips.destination,
        startDate: start,
        endDate: end,
        type: "group",
        tripId: g.trip_id,
        coverImage: g.trips.cover_image_url,
      });
    });
    return result;
  }, [myBookings, groupCollabs]);

  // --- Calendar grid ---
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);
  const getEventsForDay = (day: Date) => events.filter((e) => day >= e.startDate && day <= e.endDate);
  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  const handlePublish = async (tripId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { error } = await supabase.from("trips").update({ is_published: true }).eq("id", tripId);
    if (error) toast.error("Failed to publish trip");
    else { toast.success("Trip published!"); queryClient.invalidateQueries({ queryKey: ["my-trips"] }); }
  };

  return (
    <div className="container px-4 py-6 md:py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">My Trips</h1>
          <p className="text-muted-foreground text-sm">Your travels, bookings, and saved itineraries</p>
        </div>
        <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 w-full sm:w-auto">
          <Link to="/create-trip"><Plus className="mr-2 h-4 w-4" /> Create Trip</Link>
        </Button>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="calendar"><CalIcon className="h-4 w-4 mr-1.5 hidden sm:inline" />Calendar</TabsTrigger>
          <TabsTrigger value="trips"><MapPin className="h-4 w-4 mr-1.5 hidden sm:inline" />My Trips</TabsTrigger>
          <TabsTrigger value="bookings"><Eye className="h-4 w-4 mr-1.5 hidden sm:inline" />Bookings</TabsTrigger>
          <TabsTrigger value="saved"><Heart className="h-4 w-4 mr-1.5 hidden sm:inline" />Saved</TabsTrigger>
        </TabsList>

        {/* CALENDAR TAB */}
        <TabsContent value="calendar">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="h-2.5 w-2.5 rounded-full bg-accent" />
              <span className="text-muted-foreground">Booked Trips</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Group Plans</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_300px] gap-6">
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-6">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <h2 className="font-display text-lg font-bold">{format(currentMonth, "MMMM yyyy")}</h2>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: startDay }).map((_, i) => <div key={`b-${i}`} className="aspect-square" />)}
                  {daysInMonth.map((day) => {
                    const dayEvents = getEventsForDay(day);
                    const hasEvents = dayEvents.length > 0;
                    const isSelected = selectedDay && isSameDay(day, selectedDay);
                    const today = isToday(day);
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDay(isSelected ? null : day)}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all text-sm
                          ${today ? "ring-2 ring-accent ring-offset-1 ring-offset-background" : ""}
                          ${isSelected ? "bg-accent text-accent-foreground font-bold" : hasEvents ? "bg-muted/50 hover:bg-muted font-medium" : "hover:bg-muted/30"}
                        `}
                      >
                        <span>{format(day, "d")}</span>
                        {hasEvents && (
                          <div className="flex gap-0.5 mt-0.5">
                            {dayEvents.slice(0, 3).map((e, i) => (
                              <div key={i} className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-accent-foreground/60" : e.type === "booking" ? "bg-accent" : "bg-blue-500"}`} />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {selectedDay ? (
                <div>
                  <h3 className="font-display font-bold text-lg mb-3">{format(selectedDay, "EEEE, MMM d")}</h3>
                  {selectedEvents.length > 0 ? (
                    <div className="space-y-3">
                      {selectedEvents.map((event) => (
                        <Link key={event.id} to={`/trip/${event.tripId}`}>
                          <Card className="overflow-hidden hover:shadow-md transition-shadow">
                            {event.coverImage && (
                              <div className="h-24 overflow-hidden">
                                <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <CardContent className="p-3">
                              <Badge className={`text-[10px] mb-1 ${event.type === "booking" ? "bg-accent text-accent-foreground" : "bg-blue-500 text-white"}`}>
                                {event.type === "booking" ? "Booked" : "Group Plan"}
                              </Badge>
                              <h4 className="font-medium text-sm">{event.title}</h4>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3" /> {event.destination}
                              </p>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No trips on this day.</p>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="font-display font-bold text-lg mb-3">Upcoming Trips</h3>
                  {events.filter((e) => e.startDate >= new Date()).length > 0 ? (
                    <div className="space-y-3">
                      {events
                        .filter((e) => e.startDate >= new Date())
                        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
                        .slice(0, 5)
                        .map((event) => (
                          <Link key={event.id} to={`/trip/${event.tripId}`}>
                            <Card className="hover:shadow-md transition-shadow">
                              <CardContent className="p-3 flex items-center gap-3">
                                <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
                                  {event.coverImage ? (
                                    <img src={event.coverImage} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center">
                                      <Plane className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-medium text-sm truncate">{event.title}</h4>
                                  <p className="text-xs text-muted-foreground">
                                    {format(event.startDate, "MMM d")} · {event.destination}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Plane className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">No upcoming trips</p>
                      <Button asChild variant="outline" size="sm" className="mt-3">
                        <Link to="/explore">Explore Trips</Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* MY TRIPS TAB */}
        <TabsContent value="trips">
          {myTrips && myTrips.length > 0 ? (
            <div className="space-y-3">
              {myTrips.map((trip) => (
                <Link key={trip.id} to={`/trip/${trip.id}`}>
                  <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.01] hover:border-l-4 hover:border-l-accent">
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
                        {trip.price_estimate && <span className="text-sm font-medium">${trip.price_estimate}</span>}
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
              description="Create your first trip itinerary and share it with the world."
              actionLabel="Create Your First Trip"
              actionHref="/create-trip"
            />
          )}
        </TabsContent>

        {/* BOOKINGS TAB */}
        <TabsContent value="bookings">
          {myBookings && myBookings.length > 0 ? (
            <div className="space-y-3">
              {myBookings.map((session: any) => {
                const destination = (session.traveler_info as any)?.destination ?? "Trip";
                const flights = session.selected_flights ?? [];
                const hotels = session.selected_hotels ?? [];
                const activities = session.selected_activities ?? [];
                const totalDollars = ((session.total_amount_cents ?? 0) / 100).toFixed(2);
                const flightRef = (session.booking_items ?? []).find((b: any) => b.type === "flight" && b.status === "booked")?.provider_reference;
                const hotelRef = (session.booking_items ?? []).find((b: any) => b.type === "hotel" && b.status === "booked")?.provider_reference;
                const statusColor = session.status === "completed" ? "default" : session.status === "confirmed" ? "default" : "secondary";

                return (
                  <Card
                    key={session.id}
                    className="transition-all duration-200 hover:shadow-lg hover:scale-[1.01] hover:border-l-4 hover:border-l-accent cursor-pointer"
                    onClick={() => navigate(`/booking/confirmation?trip_session_id=${session.id}`)}
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Trip to {destination}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusColor}>{session.status}</Badge>
                          <span className="text-sm font-medium">${totalDollars}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {flights.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Plane className="h-3 w-3" />
                            {flights[0].airline_name}{flightRef ? ` · ${flightRef}` : ""}
                          </span>
                        )}
                        {hotels.length > 0 && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {hotels[0].name}{hotelRef ? ` · ${hotelRef}` : ""}
                          </span>
                        )}
                        {activities.length > 0 && (
                          <span>{activities.length} activit{activities.length === 1 ? "y" : "ies"}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={MapPin}
              title="No bookings yet"
              description="Plan a trip with Nala and book your next adventure."
              actionLabel="Plan a Trip"
              actionHref="/ai-planner"
            />
          )}
        </TabsContent>

        {/* SAVED TAB */}
        <TabsContent value="saved">
          {myFavorites && myFavorites.length > 0 ? (
            <>
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
              <Card className="bg-accent/5 border-accent/20 mt-6">
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
            </>
          ) : (
            <EmptyState
              icon={Heart}
              title="No saved trips"
              description="Heart trips you love while browsing to save them here for later."
              actionLabel="Explore Trips"
              actionHref="/explore"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
