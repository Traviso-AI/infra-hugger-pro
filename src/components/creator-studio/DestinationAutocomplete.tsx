import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const MAPBOX_TOKEN = "pk.eyJ1Ijoia2ltYm94YnQiLCJhIjoiY21tZm0xd2czMDU1ejMxcTNqNTl5cjB2cCJ9.KVShE6DBLDuat7-rSQZk-Q";

interface Place {
  id: string;
  place_name: string;
}

interface DestinationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
}

export function DestinationAutocomplete({ value, onChange }: DestinationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const search = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const resp = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?types=place,region,country&limit=5&access_token=${MAPBOX_TOKEN}`
        );
        const data = await resp.json();
        setResults(data.features?.map((f: any) => ({ id: f.id, place_name: f.place_name })) || []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
    search(v);
  };

  const handleSelect = (place: Place) => {
    setQuery(place.place_name);
    onChange(place.place_name);
    setOpen(false);
    setResults([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        placeholder="Seoul, South Korea"
        value={query}
        onChange={handleInputChange}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg overflow-hidden">
          {results.map((place) => (
            <button
              key={place.id}
              type="button"
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-accent/10 transition-colors"
              onClick={() => handleSelect(place)}
            >
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{place.place_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
