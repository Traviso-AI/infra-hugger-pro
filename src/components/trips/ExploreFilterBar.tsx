import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { X, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

export interface ExploreFilters {
  minDuration: number;
  maxDuration: number;
  sortBy: string;
  selectedTags: string[];
  travelerTypes: string[];
}

const defaultFilters: ExploreFilters = {
  minDuration: 1,
  maxDuration: 30,
  sortBy: "popular",
  selectedTags: [],
  travelerTypes: [],
};

const POPULAR_TAGS = [
  "Adventure", "Beach", "City", "Culture", "Food",
  "Luxury", "Nightlife", "Nature", "Romantic", "Budget",
];

const TRAVELER_TYPES = [
  { value: "solo", label: "Solo", emoji: "🧳" },
  { value: "couple", label: "Couples", emoji: "💑" },
  { value: "friends", label: "Friends", emoji: "👯" },
  { value: "family", label: "Family", emoji: "👨‍👩‍👧‍👦" },
  { value: "group", label: "Large Group", emoji: "🎉" },
];

interface ExploreFilterBarProps {
  filters: ExploreFilters;
  onChange: (filters: ExploreFilters) => void;
}

export function ExploreFilterBar({ filters, onChange }: ExploreFilterBarProps) {
  const [expanded, setExpanded] = useState(false);

  const activeCount = [
    filters.minDuration > 1 || filters.maxDuration < 30,
    filters.selectedTags.length > 0,
    filters.travelerTypes.length > 0,
  ].filter(Boolean).length;

  const toggleTag = (tag: string) => {
    const tags = filters.selectedTags.includes(tag)
      ? filters.selectedTags.filter((t) => t !== tag)
      : [...filters.selectedTags, tag];
    onChange({ ...filters, selectedTags: tags });
  };

  const toggleTravelerType = (type: string) => {
    const types = filters.travelerTypes.includes(type)
      ? filters.travelerTypes.filter((t) => t !== type)
      : [...filters.travelerTypes, type];
    onChange({ ...filters, travelerTypes: types });
  };

  const clearFilters = () => onChange({ ...defaultFilters, sortBy: filters.sortBy });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant={expanded ? "default" : "outline"}
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className={expanded ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}
        >
          <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
              {activeCount}
            </Badge>
          )}
        </Button>

        <Select
          value={filters.sortBy}
          onValueChange={(v) => onChange({ ...filters, sortBy: v })}
          onOpenChange={(open) => { if (open) setExpanded(false); }}
        >
          <SelectTrigger className="w-[170px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="duration-short">Shortest Trips</SelectItem>
            <SelectItem value="duration-long">Longest Trips</SelectItem>
          </SelectContent>
        </Select>

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground text-xs">
            <X className="mr-1 h-3 w-3" /> Clear filters
          </Button>
        )}
      </div>

      {expanded && (
        <div className="rounded-xl border bg-card p-4 space-y-5 animate-in slide-in-from-top-2 duration-200">
          {/* Traveler Type */}
          <div>
            <label className="text-sm font-medium mb-2 block">Who's traveling?</label>
            <div className="flex flex-wrap gap-2">
              {TRAVELER_TYPES.map((type) => (
                <Badge
                  key={type.value}
                  variant={filters.travelerTypes.includes(type.value) ? "default" : "outline"}
                  className={`cursor-pointer transition-colors text-sm px-3 py-1.5 ${
                    filters.travelerTypes.includes(type.value)
                      ? "bg-accent text-accent-foreground hover:bg-accent/90"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => toggleTravelerType(type.value)}
                >
                  {type.emoji} {type.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Duration: {filters.minDuration} – {filters.maxDuration >= 30 ? "30+" : filters.maxDuration} days
            </label>
            <Slider
              min={1}
              max={30}
              step={1}
              value={[filters.minDuration, filters.maxDuration]}
              onValueChange={([min, max]) => onChange({ ...filters, minDuration: min, maxDuration: max })}
              className="w-full"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium mb-2 block">Vibe</label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={filters.selectedTags.includes(tag) ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    filters.selectedTags.includes(tag)
                      ? "bg-accent text-accent-foreground hover:bg-accent/90"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { defaultFilters };
