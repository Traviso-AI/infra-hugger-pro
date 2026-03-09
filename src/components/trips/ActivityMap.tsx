import { useEffect, useRef, useMemo, useState } from "react";
import { MapPin, Map as MapIcon, List } from "lucide-react";
import { cn } from "@/lib/utils";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = "pk.eyJ1Ijoia2ltYm94YnQiLCJhIjoiY21tZm0xd2czMDU1ejMxcTNqNTl5cjB2cCJ9.KVShE6DBLDuat7-rSQZk-Q";

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

interface GeocodedPin {
  title: string;
  location: string;
  day_number?: number;
  lng: number;
  lat: number;
}

export function ActivityMap({ activities, destination }: ActivityMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [pins, setPins] = useState<GeocodedPin[]>([]);
  const [view, setView] = useState<"map" | "list">("map");
  const [mapLoaded, setMapLoaded] = useState(false);

  const locatedActivities = useMemo(
    () => activities.filter((a) => a.location),
    [activities]
  );

  // Geocode activity locations
  useEffect(() => {
    if (locatedActivities.length === 0) return;

    const geocode = async () => {
      const results: GeocodedPin[] = [];
      // Batch geocode with a small delay to avoid rate limits
      for (const act of locatedActivities) {
        try {
          const q = `${act.location}, ${destination}`;
          const resp = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?limit=1&access_token=${MAPBOX_TOKEN}`
          );
          const data = await resp.json();
          if (data.features?.length > 0) {
            const [lng, lat] = data.features[0].center;
            results.push({
              title: act.title,
              location: act.location!,
              day_number: act.day_number,
              lng,
              lat,
            });
          }
        } catch {
          // Skip failed geocodes
        }
      }
      setPins(results);
    };

    geocode();
  }, [locatedActivities, destination]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current || view !== "map") return;

    const initMap = async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/light-v11",
        center: [0, 20],
        zoom: 1.5,
      });

      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      mapRef.current = map;

      map.on("load", () => setMapLoaded(true));
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapLoaded(false);
      }
    };
  }, [view]);

  // Add markers when pins are ready
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || pins.length === 0) return;

    const addMarkers = async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      const map = mapRef.current;

      // Clear existing markers
      const existingMarkers = document.querySelectorAll(".activity-marker");
      existingMarkers.forEach((m) => m.remove());

      const bounds = new mapboxgl.LngLatBounds();

      pins.forEach((pin, i) => {
        const el = document.createElement("div");
        el.className = "activity-marker";
        el.style.cssText = `
          width: 28px; height: 28px; border-radius: 50%;
          background: hsl(var(--accent)); color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; cursor: pointer;
          border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        el.textContent = String(i + 1);

        const popup = new mapboxgl.Popup({ offset: 20 }).setHTML(`
          <div style="padding:4px 0">
            <strong style="font-size:13px">${pin.title}</strong>
            <div style="font-size:11px;color:#666;margin-top:2px">${pin.location}</div>
            ${pin.day_number ? `<div style="font-size:11px;color:#999;margin-top:2px">Day ${pin.day_number}</div>` : ""}
          </div>
        `);

        new mapboxgl.Marker(el)
          .setLngLat([pin.lng, pin.lat])
          .setPopup(popup)
          .addTo(map);

        bounds.extend([pin.lng, pin.lat]);
      });

      map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    };

    addMarkers();
  }, [pins, mapLoaded]);

  if (locatedActivities.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-accent" /> Activity Locations
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{locatedActivities.length} locations in {destination}</p>
        </div>
        <div className="flex rounded-lg border overflow-hidden">
          <button
            onClick={() => setView("map")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors",
              view === "map" ? "bg-accent text-white" : "hover:bg-muted"
            )}
          >
            <MapIcon className="h-3 w-3" /> Map
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors",
              view === "list" ? "bg-accent text-white" : "hover:bg-muted"
            )}
          >
            <List className="h-3 w-3" /> List
          </button>
        </div>
      </div>

      {view === "map" ? (
        <div ref={mapContainer} className="h-80 w-full" />
      ) : (
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
      )}
    </div>
  );
}