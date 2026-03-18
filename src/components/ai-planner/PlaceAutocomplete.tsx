import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";

interface Suggestion {
  place_id: string;
  description: string;
  city: string;
  country: string;
}

interface PlaceAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function PlaceAutocomplete({ value, onChange, placeholder, className, autoFocus }: PlaceAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/place-autocomplete?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
      setOpen(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (text: string) => {
    onChange(text);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchSuggestions(text), 300);
  };

  const handleSelect = (s: Suggestion) => {
    onChange(s.city);
    setSuggestions([]);
    setOpen(false);
  };

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
        placeholder={placeholder}
        className={className}
        autoFocus={autoFocus}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s.place_id}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors flex items-baseline gap-1.5"
              onClick={() => handleSelect(s)}
            >
              <span className="font-medium">{s.city}</span>
              {s.country && <span className="text-xs text-muted-foreground">{s.country}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
