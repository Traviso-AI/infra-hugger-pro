import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Hotel, Utensils, Activity, Bus, Music } from "lucide-react";
import { ActivityVoteButtons } from "@/components/trips/GroupPlanning";

const typeIcons: Record<string, any> = {
  flight: Plane, hotel: Hotel, restaurant: Utensils,
  activity: Activity, event: Music, transport: Bus,
};

interface TripItineraryProps {
  days: any[];
  canVote: boolean;
}

export function TripItinerary({ days, canVote }: TripItineraryProps) {
  if (!days || days.length === 0) return null;

  return (
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
                              {canVote && (
                                <div className="ml-auto shrink-0">
                                  <ActivityVoteButtons activityId={act.id} />
                                </div>
                              )}
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
  );
}
