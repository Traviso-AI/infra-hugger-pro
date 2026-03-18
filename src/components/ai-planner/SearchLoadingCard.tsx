import { motion } from "framer-motion";
import { Plane, Hotel, Compass, UtensilsCrossed, Search } from "lucide-react";
import nalaAvatar from "@/assets/nala-avatar.png";

type SearchType = "flights" | "hotels" | "activities" | "restaurants" | "unknown";

interface SearchLoadingCardProps {
  searchType: SearchType;
  statusText: string;
}

const iconMap: Record<SearchType, React.ElementType> = {
  flights: Plane,
  hotels: Hotel,
  activities: Compass,
  restaurants: UtensilsCrossed,
  unknown: Search,
};

const labelMap: Record<SearchType, string> = {
  flights: "Flight Search",
  hotels: "Hotel Search",
  activities: "Activity Search",
  restaurants: "Restaurant Search",
  unknown: "Searching",
};

export function SearchLoadingCard({ searchType, statusText }: SearchLoadingCardProps) {
  const Icon = iconMap[searchType];
  const label = labelMap[searchType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full max-w-[85%]"
    >
      <div className="rounded-2xl border border-accent/15 bg-card/80 backdrop-blur-sm overflow-hidden shadow-lg shadow-accent/5">
        {/* Shimmer bar */}
        <div className="h-0.5 w-full bg-muted overflow-hidden">
          <motion.div
            className="h-full w-1/3 bg-gradient-to-r from-transparent via-accent to-transparent"
            animate={{ x: ["-100%", "400%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="px-4 py-3.5 flex items-center gap-3">
          {/* Pulsing avatar */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="relative shrink-0"
          >
            <div className="h-9 w-9 rounded-full bg-accent/10 border border-accent/20 overflow-hidden">
              <img src={nalaAvatar} alt="Nala" className="h-full w-full object-cover" />
            </div>
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-accent border-2 border-card"
            />
          </motion.div>

          {/* Search type icon + text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Icon className="h-3.5 w-3.5 text-accent" />
              </motion.div>
              <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-sm text-foreground/80 truncate">{statusText.replace(/(?:✈️|🏨|🎯|🍽️|🔍)\s*/g, "")}</p>
          </div>

          {/* Spinning indicator */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="shrink-0"
          >
            <svg className="h-5 w-5 text-accent/50" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.2" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Detect if streaming content contains an active search status.
 * Returns the search type and latest status text, or null if no search is active.
 */
export function detectSearchStatus(content: string): { searchType: SearchType; statusText: string } | null {
  // Check if results have already arrived (search is done)
  if (content.includes("```traviso-results") || content.includes("```traviso-compare")) {
    return null;
  }

  // Match status patterns from the backend
  const patterns: { regex: RegExp; type: SearchType }[] = [
    { regex: /✈️\s*Search(?:ing)?\s*flights?\s*(.*?)(?:\.\.\.|$)/i, type: "flights" },
    { regex: /🏨\s*Check(?:ing)?\s*hotel\s*(.*?)(?:\.\.\.|$)/i, type: "hotels" },
    { regex: /🎯\s*(?:Search(?:ing)?|Find(?:ing)?)\s*activit(?:y|ies)\s*(.*?)(?:\.\.\.|$)/i, type: "activities" },
    { regex: /🍽️\s*Look(?:ing)?\s*up\s*restaurant\s*(.*?)(?:\.\.\.|$)/i, type: "restaurants" },
  ];

  let lastMatch: { searchType: SearchType; statusText: string } | null = null;

  for (const { regex, type } of patterns) {
    const match = content.match(regex);
    if (match) {
      lastMatch = { searchType: type, statusText: match[0].trim() };
    }
  }

  // Check for "Found X results" message
  const foundMatch = content.match(/Found\s+(\d+)\s+(\w+),?\s*(.*?)(?:\.\.\.|$)/i);
  if (foundMatch && lastMatch) {
    lastMatch.statusText = foundMatch[0].trim();
  }

  return lastMatch;
}
