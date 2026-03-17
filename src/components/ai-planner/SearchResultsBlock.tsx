import { FlightCard, type FlightData } from "./FlightCard";
import { HotelCard, type HotelData } from "./HotelCard";
import { ActivityCard, type ActivityData } from "./ActivityCard";
import { RestaurantCard, type RestaurantData } from "./RestaurantCard";

export interface SearchResultsData {
  type: "flights" | "hotels" | "activities" | "restaurants";
  flights?: FlightData[];
  hotels?: HotelData[];
  activities?: ActivityData[];
  restaurants?: RestaurantData[];
}

interface SearchResultsBlockProps {
  data: SearchResultsData;
  onSelectFlight?: (f: FlightData) => void;
  onSelectHotel?: (h: HotelData) => void;
  onSelectActivity?: (a: ActivityData) => void;
  onSelectRestaurant?: (r: RestaurantData) => void;
}

export function SearchResultsBlock({
  data,
  onSelectFlight,
  onSelectHotel,
  onSelectActivity,
  onSelectRestaurant,
}: SearchResultsBlockProps) {
  if (data.type === "flights" && data.flights?.length) {
    return (
      <div className="space-y-1">
        {data.flights.map((f) => (
          <FlightCard key={f.id} flight={f} onSelect={onSelectFlight} />
        ))}
      </div>
    );
  }

  if (data.type === "hotels" && data.hotels?.length) {
    return (
      <div className="space-y-1">
        {data.hotels.map((h) => (
          <HotelCard key={h.id} hotel={h} onSelect={onSelectHotel} />
        ))}
      </div>
    );
  }

  if (data.type === "activities" && data.activities?.length) {
    return (
      <div className="space-y-1">
        {data.activities.map((a) => (
          <ActivityCard key={a.id} activity={a} onSelect={onSelectActivity} />
        ))}
      </div>
    );
  }

  if (data.type === "restaurants" && data.restaurants?.length) {
    return (
      <div className="space-y-1">
        {data.restaurants.map((r) => (
          <RestaurantCard key={r.id} restaurant={r} onSelect={onSelectRestaurant} />
        ))}
      </div>
    );
  }

  return null;
}

/**
 * Parses ```traviso-results blocks from message content.
 * Format:
 * ```traviso-results
 * { "type": "flights", "flights": [...] }
 * ```
 */
export function parseSearchResultsBlocks(content: string): {
  textParts: string[];
  results: (SearchResultsData | null)[];
} {
  const regex = /```traviso-results\s*\n([\s\S]*?)```/g;
  const textParts: string[] = [];
  const results: (SearchResultsData | null)[] = [];

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    textParts.push(content.slice(lastIndex, match.index));
    try {
      results.push(JSON.parse(match[1].trim()) as SearchResultsData);
    } catch {
      results.push(null);
    }
    lastIndex = match.index + match[0].length;
  }

  textParts.push(content.slice(lastIndex));
  return { textParts, results };
}
