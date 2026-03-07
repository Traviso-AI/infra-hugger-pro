import { Check, X, MapPin, Clock } from "lucide-react";
import { getDestinationCover } from "@/lib/destination-covers";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TripBasicsData } from "./StepTripBasics";
import { DayForm } from "./StepBuildItinerary";
import { Activity, Plane, Hotel, Utensils, Bus, Music } from "lucide-react";

const typeIcons: Record<string, any> = {
  flight: Plane, hotel: Hotel, restaurant: Utensils,
  activity: Activity, event: Music, transport: Bus,
};

interface StepPreviewPublishProps {
  basics: TripBasicsData;
  days: DayForm[];
}

function ChecklistItem({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <div className="h-5 w-5 rounded-full bg-accent/15 flex items-center justify-center">
          <Check className="h-3 w-3 text-accent" />
        </div>
      ) : (
        <div className="h-5 w-5 rounded-full bg-destructive/15 flex items-center justify-center">
          <X className="h-3 w-3 text-destructive" />
        </div>
      )}
      <span className={ok ? "text-foreground" : "text-destructive"}>{label}</span>
    </div>
  );
}

export function validatePublishReady(basics: TripBasicsData, days: DayForm[]) {
  const duration = parseInt(basics.durationDays) || 0;
  const checks = {
    title: basics.title.trim().length >= 3,
    destination: basics.destination.trim().length > 0,
    description: basics.description.trim().length >= 20,
    duration: duration >= 1 && duration <= 30,
    tags: basics.tags.length >= 1,
    itinerary: days.some((d) => d.activities.some((a) => a.title.trim())),
    activitiesValid: days.every((d) =>
      d.activities.filter((a) => a.title.trim()).every((a) => a.type)
    ),
  };
  return {
    checks,
    ready: Object.values(checks).every(Boolean),
  };
}

export function StepPreviewPublish({ basics, days }: StepPreviewPublishProps) {
  const { checks } = validatePublishReady(basics, days);
  const durationDays = parseInt(basics.durationDays) || days.length;
  const price = parseFloat(basics.priceEstimate) || null;

  return (
    <div className="space-y-6">
      {/* Checklist */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-display text-sm font-semibold mb-3">Publish Checklist</h3>
          <div className="space-y-2">
            <ChecklistItem label="Title (min 3 characters)" ok={checks.title} />
            <ChecklistItem label="Destination selected" ok={checks.destination} />
            <ChecklistItem label="Description (min 20 characters)" ok={checks.description} />
            <ChecklistItem label="Duration (1–30 days)" ok={checks.duration} />
            <ChecklistItem label="At least 1 tag selected" ok={checks.tags} />
            <ChecklistItem label="At least 1 day with activities" ok={checks.itinerary} />
            <ChecklistItem label="All activities have title & type" ok={checks.activitiesValid} />
          </div>
        </CardContent>
      </Card>

      {/* Trip Card Preview */}
      <div>
        <h3 className="font-display text-sm font-semibold mb-3">Card Preview</h3>
        <div className="max-w-sm mx-auto">
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="aspect-[4/3] overflow-hidden bg-muted">
              {basics.coverImageUrl ? (
                <img src={basics.coverImageUrl} alt={basics.title} className="h-full w-full object-cover" />
              ) : (
                <img
                  src={getDestinationCover(basics.destination || "travel")}
                  alt={basics.destination || "Destination"}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-3.5 w-3.5 text-accent" />
                <span className="text-xs font-medium text-muted-foreground">{basics.destination || "Destination"}</span>
              </div>
              <h3 className="font-display text-lg font-semibold leading-tight mb-2">{basics.title || "Trip Title"}</h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {durationDays} day{durationDays > 1 ? "s" : ""}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">New</Badge>
              </div>
              {basics.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {basics.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              )}
              <span className="text-sm font-semibold">
                {price ? `$${price.toLocaleString()}` : "Price TBD"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Itinerary Preview */}
      {days.some((d) => d.title || d.activities.some((a) => a.title)) && (
        <div>
          <h3 className="font-display text-sm font-semibold mb-3">Itinerary Preview</h3>
          <div className="space-y-4">
            {days.map((day, idx) => (
              <Card key={idx}>
                <CardContent className="p-4">
                  <h4 className="font-display text-base font-semibold mb-1">
                    Day {idx + 1}{day.title ? `: ${day.title}` : ""}
                  </h4>
                  {day.description && <p className="text-xs text-muted-foreground mb-2">{day.description}</p>}
                  {day.activities.filter((a) => a.title).length > 0 && (
                    <div className="space-y-2">
                      {day.activities.filter((a) => a.title).map((act, actIdx) => {
                        const Icon = typeIcons[act.type] || Activity;
                        return (
                          <div key={actIdx} className="flex gap-2 rounded-lg border p-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/10">
                              <Icon className="h-3.5 w-3.5 text-accent" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-xs">{act.title}</span>
                                <Badge variant="outline" className="text-[10px]">{act.type}</Badge>
                              </div>
                              {act.description && <p className="text-[11px] text-muted-foreground">{act.description}</p>}
                              <div className="flex gap-2 mt-0.5 text-[11px] text-muted-foreground">
                                {act.location && <span>{act.location}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
