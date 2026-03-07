/**
 * Destination cover image system with 3-tier fallback:
 * 1. Curated photo array per destination (rotated by trip title hash)
 * 2. Dynamic Unsplash search using smart keywords from title + destination
 * 3. Static generic travel photo as ultimate onError fallback
 */

/**
 * Multiple curated photos per destination so duplicate destinations
 * get different cover images (selected deterministically by trip title).
 */
const DESTINATION_PHOTOS: Record<string, string[]> = {
  // Beach / tropical
  tulum: [
    "photo-1512813195386-6cf811ad3542",
    "photo-1570737543098-a2ac1a5e57e5",
    "photo-1682553064835-0forked",
    "photo-1504019347908-b45f9b0b8e8c",
  ],
  cancun: [
    "photo-1510097467424-192d713fd8b2",
    "photo-1552074284-5e88ef1aef18",
  ],
  bali: [
    "photo-1537996194471-e657df975ab4",
    "photo-1573790387438-4da905039392",
    "photo-1555400038-63f5ba517a47",
  ],
  hawaii: [
    "photo-1542259009477-d625272157b3",
    "photo-1507876466758-bc54f384809c",
  ],
  maldives: [
    "photo-1514282401047-d79a71a590e8",
    "photo-1573843981267-be1999ff37cd",
    "photo-1540202404-a2f29016b523",
  ],
  miami: [
    "photo-1533106497176-45ae19e68ba2",
    "photo-1514214246283-d427a95c5d2f",
    "photo-1535498730771-e735b998cd64",
    "photo-1506966953602-c20cc11f75e3",
  ],
  phuket: [
    "photo-1589394815804-964ed0be2eb5",
    "photo-1537956965359-7573183d1f57",
  ],
  // Cities
  tokyo: [
    "photo-1540959733332-eab4deabeeaf",
    "photo-1503899036084-c55cdd92da26",
    "photo-1536098561742-ca998e48cbcc",
    "photo-1549693578-d683be217e58",
  ],
  paris: [
    "photo-1502602898657-3e91760cbb34",
    "photo-1499856871958-5b9627545d1a",
    "photo-1431274172761-fca41d930114",
    "photo-1522093007474-d86e9bf7ba6f",
  ],
  london: [
    "photo-1513635269975-59663e0ac1ad",
    "photo-1486299267070-83823f5448dd",
    "photo-1505761671935-60b3a7427bad",
  ],
  "new york": [
    "photo-1496442226666-8d4d0e62e6e9",
    "photo-1534430480872-3498386e7856",
    "photo-1522083165195-3424ed14428d",
    "photo-1485871981521-5b1fd3805eee",
  ],
  rome: [
    "photo-1552832230-c0197dd311b5",
    "photo-1529260830199-42c24126f198",
    "photo-1531572753322-ad063cecc140",
  ],
  barcelona: [
    "photo-1583422409516-2895a77efded",
    "photo-1539037116277-4db20889f2d4",
    "photo-1523531294919-4bcd7c65e216",
  ],
  dubai: [
    "photo-1512453979798-5ea266f8880c",
    "photo-1518684079-3c830dcef090",
    "photo-1580674684081-7617fbf3d745",
  ],
  istanbul: [
    "photo-1524231757912-21f4fe3a7200",
    "photo-1541432901042-2d8bd64b4a9b",
  ],
  seoul: [
    "photo-1534274988757-a28bf1a57c17",
    "photo-1517154421773-0529f29ea451",
    "photo-1546874177-9e664107314e",
  ],
  singapore: [
    "photo-1525625293386-3f8f99389edd",
    "photo-1496939376851-89342e90adcd",
  ],
  bangkok: [
    "photo-1508009603885-50cf7c579365",
    "photo-1563492065599-3520f775eeed",
  ],
  // Nature / adventure
  iceland: [
    "photo-1504829857797-ddff29c27927",
    "photo-1520769669658-f07657e5b307",
  ],
  switzerland: [
    "photo-1530122037265-a5f1f91d3b99",
    "photo-1527668752968-14dc70a27c95",
  ],
  "new zealand": [
    "photo-1469521669194-babb45599def",
    "photo-1507699622108-4be3abd695ad",
  ],
  patagonia: [
    "photo-1478827536114-da961b7f86d2",
  ],
  // Americas
  "costa rica": [
    "photo-1519999482648-25049ddd37b1",
  ],
  colombia: [
    "photo-1518638150340-f706e86654de",
  ],
  mexico: [
    "photo-1518105779142-d975f22f1b0a",
    "photo-1547995886-6dc09384c6e6",
  ],
  cabo: [
    "photo-1510097467424-192d713fd8b2",
    "photo-1519046904884-53103b34b206",
    "photo-1507525428034-b723cf961d3e",
  ],
  peru: [
    "photo-1526392060635-9d6019884377",
    "photo-1531065208531-4036c0dba3ca",
  ],
  brazil: [
    "photo-1483729558449-99ef09a8c325",
    "photo-1516306580123-e6e52b1b7b5f",
  ],
  argentina: [
    "photo-1589909202802-8f4aadce1849",
  ],
  ottawa: [
    "photo-1542704792-e30dac463c90",
    "photo-1503614472-8c93d56e92ce",
  ],
  toronto: [
    "photo-1517090504332-eac35b2cc8c6",
    "photo-1507992781348-310259076fe0",
  ],
  canada: [
    "photo-1503614472-8c93d56e92ce",
  ],
  "los angeles": [
    "photo-1534190760961-74e8c1c5c3da",
    "photo-1580655653885-65763b2597d0",
    "photo-1515896769750-31548aa180ed",
  ],
  seattle: [
    "photo-1502175353174-a7a70e73b4c3",
    "photo-1438401171849-74ac270044ee",
  ],
  // Africa & Middle East
  morocco: [
    "photo-1539635278303-d4002c07eae3",
    "photo-1489749798305-4fea3ae63d43",
  ],
  "south africa": [
    "photo-1484318571209-661cf29a69c3",
  ],
  egypt: [
    "photo-1539768942893-daf353e2b9eb",
  ],
  // Europe
  portugal: [
    "photo-1555881400-74d7acaacd8b",
    "photo-1513735492284-ecb16127219f",
  ],
  greece: [
    "photo-1533105079780-92b9be482077",
    "photo-1601581875309-fafbf2d3ed3a",
    "photo-1570077188670-e3a8d69ac5ff",
  ],
  mykonos: [
    "photo-1601581875309-fafbf2d3ed3a",
    "photo-1570077188670-e3a8d69ac5ff",
  ],
  croatia: [
    "photo-1555990793-da11153b2473",
  ],
  amsterdam: [
    "photo-1534351590666-13e3e96b5017",
    "photo-1459679749680-18eb1eb37418",
  ],
  prague: [
    "photo-1519677100203-a0e668c92439",
  ],
  vienna: [
    "photo-1516550893923-42d28e5677af",
  ],
  naples: [
    "photo-1516483638261-f4dbaf036963",
    "photo-1534308983496-4fabb1a015ee",
  ],
  italy: [
    "photo-1516483638261-f4dbaf036963",
    "photo-1534308983496-4fabb1a015ee",
    "photo-1523906834658-6e24ef2386f9",
  ],
  // Asia
  japan: [
    "photo-1493976040374-85c8e12f0c0e",
    "photo-1528360983277-13d401cdc186",
    "photo-1492571350019-22de08371fd3",
  ],
  vietnam: [
    "photo-1528127269322-539801943592",
  ],
  india: [
    "photo-1524492412937-b28074a5d7da",
  ],
  nepal: [
    "photo-1544735716-392fe2489ffa",
  ],
};

/**
 * Keywords from trip titles that map to specific photo themes.
 * Used to find more relevant photos based on context.
 */
const THEME_PHOTOS: Record<string, string[]> = {
  "cherry blossom": [
    "photo-1522383225653-ed111181a951",
    "photo-1490806843957-31f4c9a91c65",
    "photo-1492571350019-22de08371fd3",
  ],
  sakura: [
    "photo-1522383225653-ed111181a951",
    "photo-1490806843957-31f4c9a91c65",
    "photo-1492571350019-22de08371fd3",
  ],
  "spring break": [
    "photo-1507525428034-b723cf961d3e",
    "photo-1519046904884-53103b34b206",
  ],
  wellness: [
    "photo-1540555700478-4be289fbec6f",
    "photo-1544161515-4ab6ce6db874",
  ],
  "art basel": [
    "photo-1514214246283-d427a95c5d2f",
  ],
  fashion: [
    "photo-1469334031218-e382a71b716b",
    "photo-1558618666-fcd25c85f82e",
  ],
  nightlife: [
    "photo-1514525253161-7a46d19cd819",
    "photo-1470229722913-7c0e2dbbafd3",
  ],
  f1: [
    "photo-1504817343863-5092a923803e",
  ],
  conference: [
    "photo-1540575467063-178a50e2fd87",
  ],
  "food": [
    "photo-1504674900247-0877df9cc836",
  ],
  romance: [
    "photo-1499856871958-5b9627545d1a",
    "photo-1431274172761-fca41d930114",
  ],
  luxury: [
    "photo-1566073771259-6a8506099945",
  ],
  beach: [
    "photo-1507525428034-b723cf961d3e",
    "photo-1519046904884-53103b34b206",
    "photo-1506929562872-bb421503ef21",
  ],
  shopping: [
    "photo-1441986300917-64674bd600d8",
  ],
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

// Old generic placeholder URLs that should be replaced with destination-specific covers
const STALE_PLACEHOLDER_IDS = [
  "photo-1488085061387-422e29b40080",
  "photo-1488646953014-85cb44e25828",
];

/**
 * Returns true if the given URL is a known generic placeholder
 * that should be replaced with a destination-specific cover.
 */
export function isGenericPlaceholder(url: string | null | undefined): boolean {
  if (!url) return true;
  return STALE_PLACEHOLDER_IDS.some((id) => url.includes(id));
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Builds a smart Unsplash search URL from destination + title keywords.
 */
function buildSmartUnsplashQuery(destination: string, title?: string): string {
  // Extract the city/country name (first part before comma)
  const cityName = destination.split(",")[0].trim();
  
  // If we have a title, extract meaningful keywords
  if (title) {
    const lowerTitle = title.toLowerCase();
    // Check for theme keywords in the title
    for (const [theme, photos] of Object.entries(THEME_PHOTOS)) {
      if (lowerTitle.includes(theme)) {
        // Combine city + theme for better results
        return encodeURIComponent(`${cityName} ${theme}`);
      }
    }
  }
  
  return encodeURIComponent(`${cityName} travel landmark`);
}

/**
 * Returns the best cover image URL for a destination + trip title:
 * 1. Theme-based photo if title contains specific keywords (cherry blossom, etc.)
 * 2. Curated photo if destination matches a known keyword (rotated by title hash)
 * 3. Dynamic Unsplash source redirect with smart query
 *
 * @param destination - The trip destination (e.g., "Tokyo, Japan")
 * @param width - Image width
 * @param height - Image height
 * @param title - Optional trip title for smarter image selection
 */
export function getDestinationCover(
  destination: string,
  width = 800,
  height = 600,
  title?: string
): string {
  const lower = destination.toLowerCase().trim();
  const lowerTitle = (title || "").toLowerCase();
  const hashSource = (title || destination).toLowerCase().trim();
  const hash = simpleHash(hashSource);

  // 1. Check for theme keywords in the title first
  if (title) {
    for (const [theme, photos] of Object.entries(THEME_PHOTOS)) {
      if (lowerTitle.includes(theme)) {
        const idx = hash % photos.length;
        return `https://images.unsplash.com/${photos[idx]}?w=${width}&h=${height}&fit=crop&q=80`;
      }
    }
  }

  // 2. Curated destination match — pick from array using title hash
  for (const [keyword, photos] of Object.entries(DESTINATION_PHOTOS)) {
    if (lower.includes(keyword)) {
      const idx = hash % photos.length;
      return `https://images.unsplash.com/${photos[idx]}?w=${width}&h=${height}&fit=crop&q=80`;
    }
  }

  // 3. Dynamic Unsplash source — smart query from destination + title
  const query = buildSmartUnsplashQuery(destination, title);
  return `https://source.unsplash.com/${width}x${height}/?${query}`;
}

/**
 * Returns a static fallback URL (no network dependency).
 * Use as an onError fallback when the dynamic Unsplash URL fails.
 */
export function getDestinationCoverFallback(destination: string, width = 800, height = 600): string {
  const idx = simpleHash(destination.toLowerCase().trim()) % GENERIC_TRAVEL_PHOTOS.length;
  return `https://images.unsplash.com/${GENERIC_TRAVEL_PHOTOS[idx]}?w=${width}&h=${height}&fit=crop&q=80`;
}
