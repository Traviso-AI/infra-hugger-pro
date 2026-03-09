/**
 * Destination cover image system using LoremFlickr for keyword-based photos.
 * 
 * Uses `loremflickr.com/g/` (group search) with destination keywords and
 * a `lock` parameter derived from the trip UUID to ensure:
 * - Photos always match the destination (keyword-based)
 * - Different trips to the same destination get different photos (lock varies)
 * - Results are deterministic (same trip always gets same photo)
 */

/** Search keywords optimized per destination for best photo results */
const DESTINATION_KEYWORDS: Record<string, string> = {
  tulum: "tulum,ruins,beach",
  cancun: "cancun,beach,resort",
  bali: "bali,temple,rice-terrace",
  hawaii: "hawaii,beach,tropical",
  maldives: "maldives,overwater,bungalow",
  miami: "miami,skyline,beach",
  phuket: "phuket,beach,thailand",
  tokyo: "tokyo,shibuya,skyline",
  paris: "paris,eiffel-tower",
  london: "london,big-ben,tower-bridge",
  "new york": "manhattan,skyline,new-york",
  rome: "rome,colosseum",
  barcelona: "barcelona,sagrada-familia",
  dubai: "dubai,burj-khalifa,skyline",
  istanbul: "istanbul,mosque,bosphorus",
  seoul: "seoul,korea,palace",
  singapore: "singapore,marina-bay",
  bangkok: "bangkok,temple,thailand",
  iceland: "iceland,waterfall,landscape",
  switzerland: "switzerland,alps,mountain",
  "new zealand": "new-zealand,landscape,mountain",
  patagonia: "patagonia,mountain,glacier",
  "costa rica": "costa-rica,rainforest,beach",
  colombia: "colombia,cartagena,colorful",
  mexico: "mexico,culture,architecture",
  cabo: "cabo-san-lucas,beach,resort",
  peru: "peru,machu-picchu",
  brazil: "rio-de-janeiro,brazil,beach",
  argentina: "buenos-aires,argentina",
  ottawa: "ottawa,parliament,canada",
  toronto: "toronto,cn-tower,skyline",
  canada: "canada,landscape,nature",
  "los angeles": "los-angeles,hollywood,skyline",
  seattle: "seattle,space-needle,skyline",
  morocco: "morocco,marrakech,medina",
  "south africa": "cape-town,south-africa",
  egypt: "egypt,pyramids,cairo",
  portugal: "lisbon,portugal,tram",
  greece: "greece,santorini,blue-dome",
  mykonos: "mykonos,greece,windmill",
  croatia: "dubrovnik,croatia,old-town",
  amsterdam: "amsterdam,canal,netherlands",
  prague: "prague,castle,bridge",
  vienna: "vienna,palace,austria",
  naples: "naples,italy,coast",
  italy: "italy,coast,architecture",
  japan: "japan,temple,cherry-blossom",
  vietnam: "vietnam,ha-long-bay",
  india: "india,taj-mahal",
  nepal: "nepal,himalayas,temple",
};

const STALE_PLACEHOLDER_IDS = [
  "photo-1488085061387-422e29b40080",
  "photo-1488646953014-85cb44e25828",
];

export function isGenericPlaceholder(url: string | null | undefined): boolean {
  if (!url) return true;
  return STALE_PLACEHOLDER_IDS.some((id) => url.includes(id));
}

function simpleHash(str: string): number {
  const hexChars = str.replace(/[^0-9a-f]/gi, "");
  if (hexChars.length >= 8) {
    return parseInt(hexChars.substring(0, 8), 16);
  }
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Returns the best cover image URL for a destination.
 * Uses LoremFlickr with keyword search + lock for deterministic variety.
 */
export function getDestinationCover(
  destination: string,
  width = 800,
  height = 600,
  tripId?: string
): string {
  const lower = destination.toLowerCase().trim();
  const lock = simpleHash((tripId || destination).toLowerCase().trim());

  // Find best keyword match
  let keywords = "";
  for (const [key, kw] of Object.entries(DESTINATION_KEYWORDS)) {
    if (lower.includes(key)) {
      keywords = kw;
      break;
    }
  }

  // If no curated keywords, use the city name + "travel"
  if (!keywords) {
    const cityName = destination.split(",")[0].trim();
    keywords = encodeURIComponent(`${cityName},travel,landmark`);
  }

  return `https://loremflickr.com/g/${width}/${height}/${keywords}?lock=${lock}`;
}

/**
 * Returns a static fallback URL for when the primary image fails.
 */
export function getDestinationCoverFallback(
  destination: string,
  width = 800,
  height = 600
): string {
  const cityName = destination.split(",")[0].trim();
  const lock = simpleHash(destination.toLowerCase().trim());
  return `https://loremflickr.com/g/${width}/${height}/${encodeURIComponent(cityName)},city,travel?lock=${lock}`;
}
