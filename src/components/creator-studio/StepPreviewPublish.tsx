import { Check, X, MapPin, Clock, Star, Users } from "lucide-react";
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
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}

export function StepPreviewPublish({ basics, days }: StepPreviewPublishProps) {
  const hasImage = !!basics.coverImageUrl;
  const hasTitle = !!basics.title.trim();
  const hasPrice = !!basics.priceEstimate;
  const hasItinerary = days.some((d) => d.activities.some((a) => a.title.trim()));
  const durationDays = parseInt(basics.durationDays) || days.length;
  const price = parseFloat(basics.priceEstimate) || null;

  return (
    <div className="space-y-6">
      {/* Checklist */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-display text-sm font-semibold mb-3">Publish Checklist</h3>
          <div className="space-y-2">
            <ChecklistItem label="Cover image" ok={hasImage} />
            <ChecklistItem label="Title" ok={hasTitle} />
            <ChecklistItem label="Price" ok={hasPrice} />
            <ChecklistItem label="At least 1 day of itinerary" ok={hasItinerary} />
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
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-accent/20 to-accent/5">
                  <MapPin className="h-12 w-12 text-accent/40" />
                </div>
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
              {price && <span className="text-sm font-semibold">${price.toLocaleString()}</span>}
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
                                {act.priceEstimate && <span className="font-medium text-foreground">${act.priceEstimate}</span>}
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
