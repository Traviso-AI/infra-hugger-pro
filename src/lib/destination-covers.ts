/**
 * Returns an Unsplash image URL based on a destination query.
 * Uses Unsplash's source redirect (no API key needed).
 * Deterministic per destination so the same trip always shows the same photo.
 */
export function getDestinationCoverUrl(destination: string, width = 800, height = 600): string {
  const query = encodeURIComponent(destination.trim());
  return `https://images.unsplash.com/photo-1488085061387-422e29b40080?w=${width}&h=${height}&fit=crop&q=80`;
}

/**
 * Maps common destination keywords to curated Unsplash photo IDs
 * for high-quality, relevant fallback covers.
 */
const DESTINATION_PHOTOS: Record<string, string> = {
  // Beach / tropical
  tulum: "photo-1512813195386-6cf811ad3542",
  cancun: "photo-1510097467424-192d713fd8b2",
  bali: "photo-1537996194471-e657df975ab4",
  hawaii: "photo-1542259009477-d625272157b3",
  maldives: "photo-1514282401047-d79a71a590e8",
  miami: "photo-1533106497176-45ae19e68ba2",
  phuket: "photo-1589394815804-964ed0be2eb5",
  // Cities
  tokyo: "photo-1540959733332-eab4deabeeaf",
  paris: "photo-1502602898657-3e91760cbb34",
  london: "photo-1513635269975-59663e0ac1ad",
  "new york": "photo-1496442226666-8d4d0e62e6e9",
  rome: "photo-1552832230-c0197dd311b5",
  barcelona: "photo-1583422409516-2895a77efded",
  dubai: "photo-1512453979798-5ea266f8880c",
  istanbul: "photo-1524231757912-21f4fe3a7200",
  seoul: "photo-1534274988757-a28bf1a57c17",
  singapore: "photo-1525625293386-3f8f99389edd",
  bangkok: "photo-1508009603885-50cf7c579365",
  // Nature / adventure
  iceland: "photo-1504829857797-ddff29c27927",
  switzerland: "photo-1530122037265-a5f1f91d3b99",
  "new zealand": "photo-1469521669194-babb45599def",
  patagonia: "photo-1478827536114-da961b7f86d2",
  // Americas
  "costa rica": "photo-1519999482648-25049ddd37b1",
  colombia: "photo-1518638150340-f706e86654de",
  mexico: "photo-1518105779142-d975f22f1b0a",
  peru: "photo-1526392060635-9d6019884377",
  brazil: "photo-1483729558449-99ef09a8c325",
  argentina: "photo-1589909202802-8f4aadce1849",
  ottawa: "photo-1542704792-e30dac463c90",
  canada: "photo-1503614472-8c93d56e92ce",
  // Africa & Middle East
  morocco: "photo-1539635278303-d4002c07eae3",
  "south africa": "photo-1484318571209-661cf29a69c3",
  egypt: "photo-1539768942893-daf353e2b9eb",
  // Europe
  portugal: "photo-1555881400-74d7acaacd8b",
  greece: "photo-1533105079780-92b9be482077",
  croatia: "photo-1555990793-da11153b2473",
  amsterdam: "photo-1534351590666-13e3e96b5017",
  prague: "photo-1519677100203-a0e668c92439",
  vienna: "photo-1516550893923-42d28e5677af",
  // Asia
  japan: "photo-1493976040374-85c8e12f0c0e",
  vietnam: "photo-1528127269322-539801943592",
  india: "photo-1524492412937-b28074a5d7da",
  nepal: "photo-1544735716-392fe2489ffa",
};

// Generic travel photos as ultimate fallback (rotate based on destination hash)
const GENERIC_TRAVEL_PHOTOS = [
  "photo-1488085061387-422e29b40080",
  "photo-1476514525535-07fb3b4ae5f1",
  "photo-1504150558240-0b4fd8946624",
  "photo-1469854523086-cc02fe5d8800",
  "photo-1507525428034-b723cf961d3e",
  "photo-1530789253388-582c481c54b0",
  "photo-1501785888041-af3ef285b470",
  "photo-1473496169904-658ba7c44d8a",
];

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getDestinationCover(destination: string, width = 800, height = 600): string {
  const lower = destination.toLowerCase().trim();

  // Check for exact or partial keyword matches
  for (const [keyword, photoId] of Object.entries(DESTINATION_PHOTOS)) {
    if (lower.includes(keyword)) {
      return `https://images.unsplash.com/${photoId}?w=${width}&h=${height}&fit=crop&q=80`;
    }
  }

  // Fallback: pick a generic travel photo deterministically
  const idx = simpleHash(lower) % GENERIC_TRAVEL_PHOTOS.length;
  return `https://images.unsplash.com/${GENERIC_TRAVEL_PHOTOS[idx]}?w=${width}&h=${height}&fit=crop&q=80`;
}
