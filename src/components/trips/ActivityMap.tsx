import { useMemo } from "react";
import { MapPin } from "lucide-react";

interface Activity {
  title: string;
  location?: string | null;
  type: string;
  day_number?: number;
}

interface ActivityMapProps {
  activities: Activity[];
  destination: string;
}

/**
 * Static map of activity locations using Mapbox Static Images API.
 * Shows pins for each activity that has a location.
 */
const MAPBOX_TOKEN = "pk.eyJ1Ijoia2ltYm94YnQiLCJhIjoiY21tZm0xd2czMDU1ejMxcTNqNTl5cjB2cCJ9.KVShE6DBLDuat7-rSQZk-Q";

export function ActivityMap({ activities, destination }: ActivityMapProps) {
  const locatedActivities = useMemo(
    () => activities.filter((a) => a.location),
    [activities]
  );

  if (locatedActivities.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-4 w-4 text-accent" /> Activity Locations
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">{locatedActivities.length} locations in {destination}</p>
      </div>
      <div className="divide-y max-h-80 overflow-y-auto">
        {locatedActivities.map((act, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
              {i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{act.title}</p>
              <p className="text-xs text-muted-foreground truncate">{act.location}</p>
            </div>
            {act.day_number && (
              <span className="text-xs text-muted-foreground shrink-0">Day {act.day_number}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
