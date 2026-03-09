import { useState } from "react";
import { motion } from "framer-motion";
import { Plane, Hotel, Utensils, Activity, Music, Bus, Star, MapPin, Clock, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const typeIcons: Record<string, React.ElementType> = {
  flight: Plane, hotel: Hotel, restaurant: Utensils,
  activity: Activity, event: Music, transport: Bus,
};

export interface ComparisonOption {
  name: string;
  type: string;
  price: string;
  rating?: number;
  location?: string;
  duration?: string;
  highlights?: string[];
  recommended?: boolean;
  image_hint?: string;
}

export interface ComparisonData {
  category: string;
  destination?: string;
  dates?: string;
  options: ComparisonOption[];
}

interface ComparisonCardProps {
  data: ComparisonData;
  onSelect?: (option: ComparisonOption) => void;
}

export function ComparisonCard({ data, onSelect }: ComparisonCardProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const Icon = typeIcons[data.category?.toLowerCase()] || Activity;

  const categoryLabel: Record<string, string> = {
    hotel: "🏨 Hotels", flight: "✈️ Flights", restaurant: "🍽️ Dining",
    activity: "🎯 Activities", event: "🎵 Events", transport: "🚌 Transport",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-xl border bg-card overflow-hidden my-3"
    >
      {/* Header */}
      <div className="px-3 sm:px-4 py-2.5 bg-muted/50 border-b flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold">
            {categoryLabel[data.category?.toLowerCase()] || `Compare ${data.category}`}
          </span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          {data.destination && (
            <Badge variant="outline" className="text-[10px]">
              <MapPin className="h-2.5 w-2.5 mr-0.5" />
              {data.destination}
            </Badge>
          )}
          {data.dates && (
            <Badge variant="outline" className="text-[10px]">
              <Clock className="h-2.5 w-2.5 mr-0.5" />
              {data.dates}
            </Badge>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="divide-y">
        {data.options.map((opt, i) => {
          const isExpanded = expandedIdx === i;
          return (
            <div key={i}>
              <button
                className="w-full text-left px-3 sm:px-4 py-3 hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedIdx(isExpanded ? null : i)}
              >
                {/* Row 1: Name + recommended badge */}
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium truncate flex-1">{opt.name}</p>
                  {opt.recommended && (
                    <Badge className="bg-accent text-accent-foreground text-[10px] px-1.5 py-0 shrink-0 leading-tight">
                      ⭐ Pick
                    </Badge>
                  )}
                </div>

                {/* Row 2: Meta + Price */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground flex-wrap min-w-0">
                    {opt.rating && (
                      <span className="flex items-center gap-0.5 shrink-0">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {opt.rating}
                      </span>
                    )}
                    {opt.location && (
                      <span className="flex items-center gap-0.5 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{opt.location}</span>
                      </span>
                    )}
                    {opt.duration && (
                      <span className="flex items-center gap-0.5 shrink-0">
                        <Clock className="h-3 w-3" />
                        {opt.duration}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-sm font-bold text-accent">{opt.price}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-3 sm:px-4 pb-3 overflow-hidden"
                >
                  {opt.highlights && opt.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {opt.highlights.map((h, j) => (
                        <span key={j} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                          <Check className="h-2.5 w-2.5 text-accent" />
                          {h}
                        </span>
                      ))}
                    </div>
                  )}
                  <Button
                    size="sm"
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect?.(opt);
                    }}
                  >
                    Select this option
                  </Button>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// Parses a message content string and extracts comparison JSON blocks
// Format: ```traviso-compare\n{...JSON...}\n```
export function parseComparisonBlocks(content: string): {
  textParts: string[];
  comparisons: (ComparisonData | null)[];
} {
  const regex = /```traviso-compare\s*\n([\s\S]*?)```/g;
  const textParts: string[] = [];
  const comparisons: (ComparisonData | null)[] = [];

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    textParts.push(content.slice(lastIndex, match.index));
    try {
      comparisons.push(JSON.parse(match[1].trim()) as ComparisonData);
    } catch {
      comparisons.push(null);
    }
    lastIndex = match.index + match[0].length;
  }

  textParts.push(content.slice(lastIndex));
  return { textParts, comparisons };
}
