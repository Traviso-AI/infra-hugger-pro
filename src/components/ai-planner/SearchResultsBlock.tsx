import { useState } from "react";
import { FlightCard, type FlightData } from "./FlightCard";
import { HotelCard, type HotelData } from "./HotelCard";
import { ActivityCard, type ActivityData } from "./ActivityCard";
import { RestaurantCard, type RestaurantData } from "./RestaurantCard";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

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

const INITIAL_COUNT = 3;

function ExpandableList<T extends { id: string }>({
  items,
  renderItem,
  label,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  label: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, INITIAL_COUNT);
  const remaining = items.length - INITIAL_COUNT;

  return (
    <div className="space-y-1">
      {visible.map((item) => (
        <div key={item.id}>{renderItem(item)}</div>
      ))}
      {!expanded && remaining > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded(true)}
        >
          <ChevronDown className="h-3.5 w-3.5 mr-1" />
          Show {remaining} more {label}
        </Button>
      )}
    </div>
  );
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
      <ExpandableList
        items={data.flights}
        label="flights"
        renderItem={(f) => <FlightCard flight={f} onSelect={onSelectFlight} />}
      />
    );
  }

  if (data.type === "hotels" && data.hotels?.length) {
    return (
      <ExpandableList
        items={data.hotels}
        label="hotels"
        renderItem={(h) => <HotelCard hotel={h} onSelect={onSelectHotel} />}
      />
    );
  }

  if (data.type === "activities" && data.activities?.length) {
    return (
      <ExpandableList
        items={data.activities}
        label="activities"
        renderItem={(a) => <ActivityCard activity={a} onSelect={onSelectActivity} />}
      />
    );
  }

  if (data.type === "restaurants" && data.restaurants?.length) {
    return (
      <ExpandableList
        items={data.restaurants}
        label="restaurants"
        renderItem={(r) => <RestaurantCard restaurant={r} onSelect={onSelectRestaurant} />}
      />
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
