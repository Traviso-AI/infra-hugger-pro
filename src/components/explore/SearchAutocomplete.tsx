import { useState, useEffect, useRef, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDestinationCover } from "@/lib/destination-covers";

const MAPBOX_TOKEN = "pk.eyJ1Ijoia2ltYm94YnQiLCJhIjoiY21tZm0xd2czMDU1ejMxcTNqNTl5cjB2cCJ9.KVShE6DBLDuat7-rSQZk-Q";

const TRENDING_DESTINATIONS = [
  "Tulum, Mexico",
  "Bali, Indonesia",
  "Tokyo, Japan",
  "Paris, France",
  "Dubai, UAE",
  "Barcelona, Spain",
  "Miami, USA",
  "Seoul, South Korea",
];

interface Place {
  id: string;
  place_name: string;
  center?: [number, number];
}

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SearchAutocomplete({ value, onChange, className }: SearchAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const search = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const resp = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?types=place,region,country&limit=5&access_token=${MAPBOX_TOKEN}`
        );
        const data = await resp.json();
        setResults(
          data.features?.map((f: any) => ({
            id: f.id,
            place_name: f.place_name,
            center: f.center,
          })) || []
        );
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
    search(v);
    setOpen(true);
  };

  const handleSelect = (name: string) => {
    setQuery(name);
    onChange(name);
    setOpen(false);
    setResults([]);
  };

  const showTrending = focused && query.length < 2 && results.length === 0;
  const showResults = open && results.length > 0;
  const showDropdown = showTrending || showResults;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search destinations or trips..."
        className="pl-10 pr-10"
        value={query}
        onChange={handleInputChange}
        onFocus={() => { setFocused(true); setOpen(true); }}
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
      )}

      {showDropdown && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border bg-popover shadow-xl overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-150">
          {showTrending && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3" /> Trending Destinations
              </div>
              {TRENDING_DESTINATIONS.map((dest) => (
                <button
                  key={dest}
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-accent/10 transition-colors"
                  onClick={() => handleSelect(dest)}
                >
                  <div className="h-8 w-8 rounded-md overflow-hidden shrink-0 bg-muted">
                    <img
                      src={getDestinationCover(dest, 64, 64)}
                      alt={dest}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="truncate">{dest}</span>
                </button>
              ))}
            </>
          )}

          {showResults && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3 w-3" /> Destinations
              </div>
              {results.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-accent/10 transition-colors"
                  onClick={() => handleSelect(place.place_name)}
                >
                  <div className="h-8 w-8 rounded-md overflow-hidden shrink-0 bg-muted">
                    <img
                      src={getDestinationCover(place.place_name, 64, 64)}
                      alt={place.place_name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="truncate">{place.place_name}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
