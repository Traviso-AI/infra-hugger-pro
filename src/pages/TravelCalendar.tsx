import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, MapPin, Calendar as CalIcon, Plane, Users } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, isToday, getDay } from "date-fns";
import { usePageSEO } from "@/hooks/usePageSEO";

interface CalendarEvent {
  id: string;
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  type: "booking" | "group" | "created";
  tripId: string;
  coverImage?: string | null;
}

export default function TravelCalendar() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  usePageSEO({
    title: "Travel Calendar | Traviso AI",
    description: "View all your upcoming trips, bookings, and group plans in one calendar.",
  });

  // Fetch bookings
  const { data: bookings } = useQuery({
    queryKey: ["calendar-bookings", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id, check_in, check_out, status, trip_id, trips(title, destination, cover_image_url, duration_days)")
        .eq("user_id", user!.id)
        .eq("status", "confirmed");
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch group collaborations (trips user is part of)
  const { data: groupTrips } = useQuery({
    queryKey: ["calendar-groups", user?.id],
    queryFn: async () => {
      const { data: collabs } = await supabase
        .from("trip_collaborators")
        .select("trip_id, trips(title, destination, cover_image_url, duration_days, created_at)")
        .eq("user_id", user!.id)
        .not("accepted_at", "is", null);
      return collabs || [];
    },
    enabled: !!user,
  });

  // Fetch user's own trips
  const { data: myTrips } = useQuery({
    queryKey: ["calendar-my-trips", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("trips")
        .select("id, title, destination, cover_image_url, duration_days, created_at")
        .eq("creator_id", user!.id)
        .eq("is_published", true);
      return data || [];
    },
    enabled: !!user,
  });

  // Build calendar events
  const events: CalendarEvent[] = useMemo(() => {
    const result: CalendarEvent[] = [];

    // Bookings (have actual dates)
    (bookings || []).forEach((b: any) => {
      if (!b.check_in || !b.trips) return;
      result.push({
        id: b.id,
        title: b.trips.title,
        destination: b.trips.destination,
        startDate: new Date(b.check_in),
        endDate: b.check_out ? new Date(b.check_out) : new Date(b.check_in),
        type: "booking",
        tripId: b.trip_id,
        coverImage: b.trips.cover_image_url,
      });
    });

    // Group trips (use created_at as approximate date)
    (groupTrips || []).forEach((g: any) => {
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
  }, [bookings, groupTrips]);

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart); // 0=Sun

  const getEventsForDay = (day: Date) =>
    events.filter((e) => day >= e.startDate && day <= e.endDate);

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  const eventColors: Record<string, string> = {
    booking: "bg-accent text-accent-foreground",
    group: "bg-blue-500 text-white",
    created: "bg-amber-500 text-white",
  };

  const eventDotColors: Record<string, string> = {
    booking: "bg-accent",
    group: "bg-blue-500",
    created: "bg-amber-500",
  };

  return (
    <div className="container px-4 py-6 md:py-12 max-w-5xl">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
          <CalIcon className="h-7 w-7 text-accent" /> Travel Calendar
        </h1>
        <p className="text-muted-foreground text-sm">Your trips, bookings, and group plans at a glance.</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-1.5 text-xs">
          <div className="h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="text-muted-foreground">Booked Trips</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Group Plans</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Calendar Grid */}
        <Card>
          <CardContent className="p-4 md:p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="font-display text-lg font-bold">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="grid grid-cols-7 gap-1">
              {/* Blank cells for offset */}
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`blank-${i}`} className="aspect-square" />
              ))}

              {daysInMonth.map((day) => {
                const dayEvents = getEventsForDay(day);
                const hasEvents = dayEvents.length > 0;
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const today = isToday(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`
                      aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all text-sm
                      ${today ? "ring-2 ring-accent ring-offset-1 ring-offset-background" : ""}
                      ${isSelected ? "bg-accent text-accent-foreground font-bold" : hasEvents ? "bg-muted/50 hover:bg-muted font-medium" : "hover:bg-muted/30"}
                    `}
                  >
                    <span>{format(day, "d")}</span>
                    {hasEvents && !isSelected && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayEvents.slice(0, 3).map((e, i) => (
                          <div key={i} className={`h-1.5 w-1.5 rounded-full ${eventDotColors[e.type]}`} />
                        ))}
                      </div>
                    )}
                    {isSelected && hasEvents && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayEvents.slice(0, 3).map((_, i) => (
                          <div key={i} className="h-1.5 w-1.5 rounded-full bg-accent-foreground/60" />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar - Selected Day / Upcoming */}
        <div className="space-y-4">
          {selectedDay ? (
            <div>
              <h3 className="font-display font-bold text-lg mb-3">
                {format(selectedDay, "EEEE, MMM d")}
              </h3>
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
                          <Badge className={`text-[10px] mb-1 ${eventColors[event.type]}`}>
                            {event.type === "booking" ? "Booked" : event.type === "group" ? "Group Plan" : "My Trip"}
                          </Badge>
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" /> {event.destination}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {format(event.startDate, "MMM d")} – {format(event.endDate, "MMM d")}
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
    </div>
  );
}
