/**
 * Destination cover image system — all photos hosted locally.
 * No external dependencies. Every photo is verified and downloaded.
 */

/** Local photos per destination */
const DESTINATION_PHOTOS: Record<string, string[]> = {
  tulum: [
    "/images/destinations/tulum-1.jpg",
    "/images/destinations/tulum-2.jpg",
    "/images/destinations/tulum-3.jpg",
    "/images/destinations/tulum-4.jpg",
  ],
  cancun: ["/images/destinations/cancun-1.jpg"],
  bali: [
    "/images/destinations/bali-1.jpg",
    "/images/destinations/bali-2.jpg",
  ],
  maldives: [
    "/images/destinations/maldives-1.jpg",
    "/images/destinations/maldives-2.jpg",
  ],
  miami: [
    "/images/destinations/miami-1.jpg",
    "/images/destinations/miami-2.jpg",
  ],
  tokyo: [
    "/images/destinations/tokyo-1.jpg",
    "/images/destinations/tokyo-2.jpg",
    "/images/destinations/tokyo-3.jpg",
  ],
  paris: [
    "/images/destinations/paris-1.jpg",
    "/images/destinations/paris-2.jpg",
  ],
  "new york": [
    "/images/destinations/newyork-1.jpg",
    "/images/destinations/newyork-2.jpg",
  ],
  rome: ["/images/destinations/rome-1.jpg"],
  barcelona: [
    "/images/destinations/barcelona-1.jpg",
    "/images/destinations/barcelona-2.jpg",
  ],
  dubai: [
    "/images/destinations/dubai-1.jpg",
    "/images/destinations/dubai-2.jpg",
  ],
  istanbul: ["/images/destinations/istanbul-1.jpg"],
  seoul: [
    "/images/destinations/seoul-1.jpg",
    "/images/destinations/seoul-2.jpg",
  ],
  singapore: [
    "/images/destinations/singapore-1.jpg",
    "/images/destinations/singapore-2.jpg",
  ],
  "los angeles": [
    "/images/destinations/losangeles-1.jpg",
    "/images/destinations/losangeles-2.jpg",
  ],
  cabo: [
    "/images/destinations/cabo-1.jpg",
    "/images/destinations/cabo-2.jpg",
  ],
  mykonos: [
    "/images/destinations/mykonos-1.jpg",
    "/images/destinations/mykonos-2.jpg",
  ],
  greece: [
    "/images/destinations/mykonos-1.jpg",
    "/images/destinations/mykonos-2.jpg",
  ],
  mexico: [
    "/images/destinations/tulum-1.jpg",
    "/images/destinations/cabo-1.jpg",
  ],
  japan: [
    "/images/destinations/tokyo-1.jpg",
    "/images/destinations/tokyo-2.jpg",
    "/images/destinations/tokyo-3.jpg",
  ],
};

/** Generic fallback — a travel-themed local image */
const GENERIC_FALLBACK = "/images/destinations/tulum-1.jpg";

const STALE_PLACEHOLDER_IDS = [
  "photo-1488085061387-422e29b40080",
  "photo-1488646953014-85cb44e25828",
];

export function isGenericPlaceholder(url: string | null | undefined): boolean {
  if (!url) return true;
  return STALE_PLACEHOLDER_IDS.some((id) => url.includes(id));
}

/**
 * Simple hash from UUID to pick a photo index.
 */
function hashFromUuid(uuid: string): number {
  const hex = uuid.replace(/[^0-9a-f]/gi, "");
  const h1 = hex.length >= 8 ? parseInt(hex.substring(0, 8), 16) : 0;
  return Math.abs(h1);
}

/**
 * Returns the best cover image URL for a destination.
 * All images are locally hosted — no external network calls.
 */
export function getDestinationCover(
  destination: string,
  _width = 800,
  _height = 600,
  tripId?: string
): string {
  const lower = destination.toLowerCase().trim();
  const hash = hashFromUuid(tripId || destination);

  // Try curated destination match
  for (const [keyword, photos] of Object.entries(DESTINATION_PHOTOS)) {
    if (lower.includes(keyword)) {
      const idx = hash % photos.length;
      return photos[idx];
    }
  }

  // Fallback
  return GENERIC_FALLBACK;
}

/**
 * Returns a static fallback URL.
 */
export function getDestinationCoverFallback(
  destination: string,
  _width = 800,
  _height = 600
): string {
  const lower = destination.toLowerCase().trim();

  // Try to find a destination-specific fallback
  for (const [keyword, photos] of Object.entries(DESTINATION_PHOTOS)) {
    if (lower.includes(keyword)) {
      return photos[0];
    }
  }

  return GENERIC_FALLBACK;
}
