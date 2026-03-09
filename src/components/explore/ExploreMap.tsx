import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = "pk.eyJ1Ijoia2ltYm94YnQiLCJhIjoiY21tZm0xd2czMDU1ejMxcTNqNTl5cjB2cCJ9.KVShE6DBLDuat7-rSQZk-Q";

interface MapTrip {
  id: string;
  title: string;
  destination: string;
  cover_image_url?: string | null;
  price_estimate?: number | null;
  avg_rating?: number | null;
}

interface ExploreMapProps {
  trips: MapTrip[];
}

interface GeoTrip extends MapTrip {
  lng: number;
  lat: number;
}

export function ExploreMap({ trips }: ExploreMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const navigate = useNavigate();
  const [geoTrips, setGeoTrips] = useState<GeoTrip[]>([]);

  // Geocode unique destinations
  useEffect(() => {
    if (trips.length === 0) return;

    const geocode = async () => {
      const destMap = new Map<string, { lng: number; lat: number }>();
      const uniqueDests = [...new Set(trips.map((t) => t.destination))];

      for (const dest of uniqueDests.slice(0, 20)) {
        try {
          const resp = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(dest)}.json?limit=1&types=place,region,country&access_token=${MAPBOX_TOKEN}`
          );
          const data = await resp.json();
          if (data.features?.length > 0) {
            const [lng, lat] = data.features[0].center;
            destMap.set(dest, { lng, lat });
          }
        } catch { /* skip */ }
      }

      const results: GeoTrip[] = [];
      trips.forEach((t) => {
        const coords = destMap.get(t.destination);
        if (coords) {
          // Add small jitter to avoid overlapping pins
          results.push({
            ...t,
            lng: coords.lng + (Math.random() - 0.5) * 0.01,
            lat: coords.lat + (Math.random() - 0.5) * 0.01,
          });
        }
      });
      setGeoTrips(results);
    };

    geocode();
  }, [trips]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const initMap = async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/light-v11",
        center: [10, 25],
        zoom: 1.8,
      });

      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      mapRef.current = map;
    };

    initMap();
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Add markers
  useEffect(() => {
    if (!mapRef.current || geoTrips.length === 0) return;

    const addMarkers = async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      const map = mapRef.current;

      // Wait for map to load
      if (!map.loaded()) {
        await new Promise<void>((resolve) => map.on("load", resolve));
      }

      // Clear existing
      document.querySelectorAll(".explore-marker").forEach((m) => m.remove());

      const bounds = new mapboxgl.LngLatBounds();

      geoTrips.forEach((trip) => {
        const el = document.createElement("div");
        el.className = "explore-marker";
        el.style.cssText = `
          width: 32px; height: 32px; border-radius: 50%;
          background: hsl(var(--accent)); cursor: pointer;
          border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.15s;
        `;
        el.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
        el.onmouseenter = () => { el.style.transform = "scale(1.2)"; };
        el.onmouseleave = () => { el.style.transform = "scale(1)"; };

        const price = trip.price_estimate ? `$${trip.price_estimate}` : "Get Price";
        const rating = trip.avg_rating ? `⭐ ${trip.avg_rating}` : "";

        const popup = new mapboxgl.Popup({ offset: 20, maxWidth: "240px" }).setHTML(`
          <div style="cursor:pointer" class="explore-popup" data-trip-id="${trip.id}">
            ${trip.cover_image_url ? `<img src="${trip.cover_image_url}" style="width:100%;height:100px;object-fit:cover;border-radius:6px 6px 0 0;margin:-10px -10px 8px" />` : ""}
            <strong style="font-size:13px;display:block">${trip.title}</strong>
            <div style="font-size:11px;color:#666;margin-top:2px">${trip.destination}</div>
            <div style="font-size:12px;margin-top:4px;display:flex;justify-content:space-between">
              <span style="font-weight:600;color:hsl(var(--accent))">${price}</span>
              <span>${rating}</span>
            </div>
          </div>
        `);

        popup.on("open", () => {
          setTimeout(() => {
            const popupEl = document.querySelector(`.explore-popup[data-trip-id="${trip.id}"]`);
            popupEl?.addEventListener("click", () => navigate(`/trip/${trip.id}`));
          }, 50);
        });

        new mapboxgl.Marker(el)
          .setLngLat([trip.lng, trip.lat])
          .setPopup(popup)
          .addTo(map);

        bounds.extend([trip.lng, trip.lat]);
      });

      if (geoTrips.length > 1) {
        map.fitBounds(bounds, { padding: 50, maxZoom: 12 });
      } else {
        map.flyTo({ center: [geoTrips[0].lng, geoTrips[0].lat], zoom: 10 });
      }
    };

    addMarkers();
  }, [geoTrips, navigate]);

  return (
    <div ref={mapContainer} className="h-[400px] w-full rounded-xl border overflow-hidden" />
  );
}