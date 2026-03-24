import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlightCard, type FlightData } from "./FlightCard";
import { HotelCard, type HotelData } from "./HotelCard";
import { ActivityCard, type ActivityData } from "./ActivityCard";
import { RestaurantCard, type RestaurantData } from "./RestaurantCard";
import { Button } from "@/components/ui/button";
import { ChevronDown, ArrowUpDown, Plane, Hotel, Compass, UtensilsCrossed } from "lucide-react";

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
  hasFlightSelected?: boolean;
  onSelectActivity?: (a: ActivityData) => void;
  onSelectRestaurant?: (r: RestaurantData) => void;
}

const PAGE_SIZE = 5;
const MAX_RESULTS = 20;

// ---------------------------------------------------------------------------
// Sort option type and pill button
// ---------------------------------------------------------------------------
interface SortOption {
  label: string;
  key: string;
}

function SortPills({
  options,
  active,
  onChange,
}: {
  options: SortOption[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
      <ArrowUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
            active === opt.key
              ? "bg-accent text-accent-foreground border-accent"
              : "bg-transparent text-muted-foreground border-muted hover:border-foreground/20"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Paginated + sortable list
// ---------------------------------------------------------------------------
const categoryHeaders: Record<string, { label: string; icon: React.ElementType }> = {
  flights: { label: "Flights", icon: Plane },
  hotels: { label: "Hotels", icon: Hotel },
  activities: { label: "Activities", icon: Compass },
  restaurants: { label: "Restaurants", icon: UtensilsCrossed },
};

function PaginatedList<T extends { id: string }>({
  items,
  renderItem,
  label,
  sortOptions,
  sortFn,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  label: string;
  sortOptions: SortOption[];
  sortFn: (items: T[], sortKey: string) => T[];
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [sortKey, setSortKey] = useState(sortOptions[0]?.key ?? "");

  const sorted = useMemo(() => sortFn(items, sortKey), [items, sortKey, sortFn]);
  const visible = sorted.slice(0, visibleCount);
  const remaining = sorted.length - visibleCount;
  const allShown = visibleCount >= sorted.length;
  const atMax = sorted.length >= MAX_RESULTS && allShown;

  const header = categoryHeaders[label];

  return (
    <div className="w-full space-y-1.5">
      {/* Category header */}
      {header && (
        <div className="flex items-center gap-2 pt-1 pb-0.5">
          <header.icon className="h-4 w-4 text-accent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {header.label}
          </span>
          <span className="text-[10px] text-muted-foreground/60">{items.length} found</span>
        </div>
      )}

      <SortPills options={sortOptions} active={sortKey} onChange={setSortKey} />

      <AnimatePresence initial={false}>
        {visible.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx < PAGE_SIZE ? idx * 0.06 : 0 }}
          >
            {renderItem(item)}
          </motion.div>
        ))}
      </AnimatePresence>

      {!allShown && remaining > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          >
            <ChevronDown className="h-3.5 w-3.5 mr-1" />
            Show {Math.min(remaining, PAGE_SIZE)} more {label}
          </Button>
        </motion.div>
      )}

      {atMax && (
        <p className="text-center text-[11px] text-muted-foreground py-2">
          Showing top {MAX_RESULTS} results. Adjust your dates or filters to see different options.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sort functions per category
// ---------------------------------------------------------------------------
const FLIGHT_SORTS: SortOption[] = [
  { label: "Price", key: "price" },
  { label: "Duration", key: "duration" },
  { label: "Stops", key: "stops" },
];

function sortFlights(items: FlightData[], key: string): FlightData[] {
  const copy = [...items];
  if (key === "price") return copy.sort((a, b) => a.price_cents - b.price_cents);
  if (key === "duration") return copy.sort((a, b) => a.duration_minutes - b.duration_minutes);
  if (key === "stops") return copy.sort((a, b) => a.stops - b.stops);
  return copy;
}

const HOTEL_SORTS: SortOption[] = [
  { label: "Price", key: "price" },
  { label: "Stars", key: "stars" },
];

function sortHotels(items: HotelData[], key: string): HotelData[] {
  const copy = [...items];
  if (key === "price") return copy.sort((a, b) => a.price_per_night_cents - b.price_per_night_cents);
  if (key === "stars") return copy.sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0));
  return copy;
}

const ACTIVITY_SORTS: SortOption[] = [
  { label: "Price", key: "price" },
  { label: "Rating", key: "rating" },
  { label: "Duration", key: "duration" },
];

function sortActivities(items: ActivityData[], key: string): ActivityData[] {
  const copy = [...items];
  if (key === "price") return copy.sort((a, b) => a.price_cents - b.price_cents);
  if (key === "rating") return copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  if (key === "duration") return copy.sort((a, b) => (a.duration_minutes ?? 9999) - (b.duration_minutes ?? 9999));
  return copy;
}

const RESTAURANT_SORTS: SortOption[] = [
  { label: "Rating", key: "rating" },
  { label: "Price", key: "price" },
];

const priceRank: Record<string, number> = { Free: 0, $: 1, $$: 2, $$$: 3, $$$$: 4 };

function sortRestaurants(items: RestaurantData[], key: string): RestaurantData[] {
  const copy = [...items];
  if (key === "rating") return copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  if (key === "price") return copy.sort((a, b) => (priceRank[a.price_range ?? ""] ?? 5) - (priceRank[b.price_range ?? ""] ?? 5));
  return copy;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function SearchResultsBlock({
  data,
  onSelectFlight,
  onSelectHotel,
  hasFlightSelected,
  onSelectActivity,
  onSelectRestaurant,
}: SearchResultsBlockProps) {
  if (data.type === "flights" && data.flights?.length) {
    return (
      <PaginatedList
        items={data.flights}
        label="flights"
        sortOptions={FLIGHT_SORTS}
        sortFn={sortFlights}
        renderItem={(f) => <FlightCard flight={f} onSelect={onSelectFlight} />}
      />
    );
  }

  if (data.type === "hotels" && data.hotels?.length) {
    return (
      <PaginatedList
        items={data.hotels}
        label="hotels"
        sortOptions={HOTEL_SORTS}
        sortFn={sortHotels}
        renderItem={(h) => <HotelCard hotel={h} onSelect={onSelectHotel} hasFlightSelected={hasFlightSelected} />}
      />
    );
  }

  if (data.type === "activities" && data.activities?.length) {
    return (
      <PaginatedList
        items={data.activities}
        label="activities"
        sortOptions={ACTIVITY_SORTS}
        sortFn={sortActivities}
        renderItem={(a) => <ActivityCard activity={a} onSelect={onSelectActivity} />}
      />
    );
  }

  if (data.type === "restaurants" && data.restaurants?.length) {
    return (
      <PaginatedList
        items={data.restaurants}
        label="restaurants"
        sortOptions={RESTAURANT_SORTS}
        sortFn={sortRestaurants}
        renderItem={(r) => <RestaurantCard restaurant={r} onSelect={onSelectRestaurant} />}
      />
    );
  }

  return null;
}

/**
 * Parses ```traviso-results blocks from message content.
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
