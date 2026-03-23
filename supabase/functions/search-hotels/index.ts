const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface HotelSearchRequest {
  destination_code: string;
  check_in: string;
  check_out: string;
  adults: number;
  rooms?: number;
  keyword?: string;
}

async function generateSignature(apiKey: string, secret: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const raw = apiKey + secret + timestamp;
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function resolveDestinationCode(input: string): string {
  // If it already looks like a Hotelbeds code (2-4 uppercase letters), use it directly
  if (/^[A-Z]{2,4}$/.test(input.trim())) return input.trim();

  // Normalize input for matching
  const normalized = input.toLowerCase().split(",")[0].trim();

  // Comprehensive Hotelbeds destination code mapping
  const codeMap: Record<string, string> = {
    // Asia Pacific
    "tokyo": "TKY", "osaka": "OSA", "kyoto": "UKY", "hiroshima": "HIJ",
    "sapporo": "CTS", "fukuoka": "FUK", "naha": "OKA", "nagoya": "NGO",
    "bangkok": "BKK", "phuket": "HKT", "chiang mai": "CNX", "pattaya": "PYX",
    "bali": "DPS", "jakarta": "JKT", "lombok": "LOP", "yogyakarta": "JOG",
    "singapore": "SIN", "kuala lumpur": "KUL", "penang": "PEN", "langkawi": "LGK",
    "hong kong": "HKG", "macau": "MFM", "taipei": "TPE", "seoul": "SEL",
    "busan": "PUS", "jeju": "CJU", "beijing": "BJS", "shanghai": "SHA",
    "guangzhou": "CAN", "shenzhen": "SZX", "chengdu": "CTU", "xian": "XIY",
    "mumbai": "BOM", "delhi": "DEL", "goa": "GOI", "jaipur": "JAI",
    "agra": "AGR", "chennai": "MAA", "bangalore": "BLR", "hyderabad": "HYD",
    "colombo": "CMB", "maldives": "MLE", "male": "MLE", "kathmandu": "KTM",
    "dhaka": "DAC", "karachi": "KHI", "lahore": "LHE", "islamabad": "ISB",
    "sydney": "SYD", "melbourne": "MEL", "brisbane": "BNE", "perth": "PER",
    "adelaide": "ADL", "cairns": "CNS", "gold coast": "OOL", "darwin": "DRW",
    "auckland": "AKL", "queenstown": "ZQN", "christchurch": "CHC", "wellington": "WLG",
    "manila": "MNL", "cebu": "CEB", "boracay": "MPH", "palawan": "PPS",
    "ho chi minh": "SGN", "hanoi": "HAN", "da nang": "DAD", "hoi an": "DAD",
    "phnom penh": "PNH", "siem reap": "REP", "vientiane": "VTE", "luang prabang": "LPQ",
    "yangon": "RGN", "mandalay": "MDL", "naypyidaw": "NYT",
    // Middle East
    "dubai": "DXB", "abu dhabi": "AUH", "sharjah": "SHJ", "ras al khaimah": "RKT",
    "doha": "DOH", "riyadh": "RUH", "jeddah": "JED", "mecca": "MCC",
    "muscat": "MCT", "kuwait city": "KWI", "manama": "BAH", "amman": "AMM",
    "beirut": "BEY", "tel aviv": "TLV", "jerusalem": "JRS", "eilat": "ETH",
    "istanbul": "IST", "ankara": "ANK", "antalya": "AYT", "bodrum": "BJV",
    "cappadocia": "GZM", "izmir": "IZM", "trabzon": "TZX",
    // Europe
    "london": "LON", "manchester": "MAN", "edinburgh": "EDI", "glasgow": "GLA",
    "birmingham": "BHX", "liverpool": "LPL", "bristol": "BRS", "bath": "BAT",
    "paris": "PAR", "nice": "NCE", "marseille": "MRS", "lyon": "LYS",
    "bordeaux": "BOD", "toulouse": "TLS", "strasbourg": "SXB", "lille": "LIL",
    "amsterdam": "AMS", "rotterdam": "RTM", "the hague": "HAG", "utrecht": "UTC",
    "berlin": "BER", "munich": "MUC", "hamburg": "HAM", "frankfurt": "FRA",
    "cologne": "CGN", "dusseldorf": "DUS", "stuttgart": "STR", "dresden": "DRS",
    "rome": "ROM", "milan": "MIL", "venice": "VCE", "florence": "FLR",
    "naples": "NAP", "amalfi": "NAP", "amalfi coast": "NAP", "positano": "NAP",
    "sicily": "PMO", "palermo": "PMO", "catania": "CTA", "sardinia": "CAG",
    "madrid": "MAD", "barcelona": "BCN", "seville": "SVQ", "valencia": "VLC",
    "malaga": "AGP", "bilbao": "BIO", "granada": "GRX", "ibiza": "IBZ",
    "mallorca": "PMI", "tenerife": "TFN", "gran canaria": "LPA",
    "lisbon": "LIS", "porto": "OPO", "algarve": "FAO", "funchal": "FNC",
    "athens": "ATH", "thessaloniki": "SKG", "santorini": "JTR", "mykonos": "JMK",
    "crete": "HER", "heraklion": "HER", "rhodes": "RHO", "corfu": "CFU",
    "vienna": "VIE", "salzburg": "SZG", "innsbruck": "INN", "graz": "GRZ",
    "zurich": "ZRH", "geneva": "GVA", "basel": "BSL", "bern": "BRN",
    "brussels": "BRU", "bruges": "BGY", "ghent": "GNT", "antwerp": "ANR",
    "copenhagen": "CPH", "aarhus": "AAR", "oslo": "OSL", "bergen": "BGO",
    "stockholm": "STO", "gothenburg": "GOT", "malmo": "MMA",
    "helsinki": "HEL", "tampere": "TMP", "turku": "TKU",
    "reykjavik": "REK", "warsaw": "WAW", "krakow": "KRK", "gdansk": "GDN",
    "prague": "PRG", "brno": "BRQ", "bratislava": "BTS",
    "budapest": "BUD", "debrecen": "DEB", "bucharest": "BUH", "cluj": "CLJ",
    "sofia": "SOF", "plovdiv": "PDV", "zagreb": "ZAG", "split": "SPU",
    "dubrovnik": "DBV", "sarajevo": "SJJ", "belgrade": "BEG", "podgorica": "TGD",
    "tirana": "TIA", "skopje": "SKP", "valletta": "MLA", "nicosia": "NIC",
    "riga": "RIX", "tallinn": "TLL", "vilnius": "VNO",
    "moscow": "MOW", "saint petersburg": "LED", "st petersburg": "LED",
    "kiev": "IEV", "lviv": "LWO", "odessa": "ODS",
    // Africa
    "cairo": "CAI", "alexandria": "ALY", "luxor": "LXR", "aswan": "ASW",
    "hurghada": "HRG", "sharm el sheikh": "SSH", "marrakech": "RAK",
    "casablanca": "CAS", "fez": "FEZ", "agadir": "AGA", "tangier": "TNG",
    "tunis": "TUN", "sousse": "SUS", "djerba": "DJE",
    "algiers": "ALG", "oran": "ORN", "nairobi": "NBI", "mombasa": "MBA",
    "dar es salaam": "DAR", "zanzibar": "ZNZ", "arusha": "ARK",
    "kampala": "EBB", "kigali": "KGL", "addis ababa": "ADD",
    "cape town": "CPT", "johannesburg": "JNB", "durban": "DUR",
    "pretoria": "PRY", "port elizabeth": "PLZ", "kruger": "HDS",
    "victoria falls": "VFA", "windhoek": "WDH", "gaborone": "GBE",
    "lusaka": "LUN", "harare": "HRE", "maputo": "MPM", "antananarivo": "TNR",
    "mauritius": "MRU", "reunion": "RUN", "seychelles": "SEZ", "mahe": "SEZ",
    "dakar": "DKR", "abidjan": "ABJ", "accra": "ACC", "lagos": "LOS",
    "abuja": "ABV", "douala": "DLA", "libreville": "LBV",
    // Americas
    "new york": "NYC", "manhattan": "NYC", "brooklyn": "NYC",
    "los angeles": "LAX", "san francisco": "SFO", "las vegas": "LAS",
    "miami": "MIA", "orlando": "ORL", "chicago": "CHI", "boston": "BOS",
    "washington": "WAS", "seattle": "SEA", "portland": "POR",
    "denver": "DEN", "dallas": "DAL", "houston": "HOU", "atlanta": "ATL",
    "new orleans": "MSY", "nashville": "BNA", "austin": "AUS",
    "san diego": "SAN", "phoenix": "PHX", "minneapolis": "MSP",
    "detroit": "DET", "cleveland": "CLE", "pittsburgh": "PIT",
    "toronto": "TOR", "montreal": "MON", "vancouver": "VAN",
    "calgary": "YYC", "ottawa": "YOW", "quebec city": "YQB",
    "mexico city": "MEX", "cancun": "CUN", "playa del carmen": "CUN",
    "tulum": "CUN", "cabo san lucas": "SJD", "los cabos": "SJD",
    "puerto vallarta": "PVR", "guadalajara": "GDL", "monterrey": "MTY",
    "oaxaca": "OAX", "merida": "MID", "san jose": "SJO",
    "panama city": "PTY", "havana": "HAV", "santo domingo": "SDQ",
    "san juan": "SJU", "kingston": "KIN", "bridgetown": "BGI",
    "nassau": "NAS", "bogota": "BOG", "medellin": "MDE", "cartagena": "CTG",
    "lima": "LIM", "cusco": "CUZ", "quito": "UIO", "guayaquil": "GYE",
    "caracas": "CCS", "buenos aires": "BUE", "mendoza": "MDZ",
    "santiago": "SCL", "valparaiso": "VAP", "montevideo": "MVD",
    "sao paulo": "SAO", "rio de janeiro": "RIO", "brasilia": "BSB",
    "salvador": "SSA", "recife": "REC", "fortaleza": "FOR",
    "la paz": "LPB", "santa cruz": "VVI", "asuncion": "ASU",
    "paramaribo": "PBM", "georgetown": "GEO",
    // Caribbean
    "punta cana": "PUJ", "puerto plata": "POP", "la romana": "LRM",
    "montego bay": "MBJ", "negril": "NEG", "aruba": "AUA",
    "curacao": "CUR", "st maarten": "SXM", "st lucia": "SLU",
    "barbados": "BGI", "trinidad": "POS", "tobago": "TAB",
    "antigua": "ANU", "st kitts": "SKB", "turks and caicos": "PLS",
  };

  // Try exact match first, then partial match
  if (codeMap[normalized]) return codeMap[normalized];

  // Try partial match
  const partialKey = Object.keys(codeMap).find(k => normalized.includes(k) || k.includes(normalized));
  if (partialKey) return codeMap[partialKey];

  // Return input unchanged as last resort
  return input.trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const HOTELBEDS_API_KEY = Deno.env.get("HOTELBEDS_API_KEY");
    const HOTELBEDS_SECRET = Deno.env.get("HOTELBEDS_SECRET");
    if (!HOTELBEDS_API_KEY || !HOTELBEDS_SECRET) {
      throw new Error("HOTELBEDS_API_KEY or HOTELBEDS_SECRET not configured");
    }

    const body: HotelSearchRequest = await req.json();
    const { destination_code: raw_destination_code, check_in, check_out, adults, rooms = 1, keyword } = body;
    const destination_code = resolveDestinationCode(raw_destination_code);

    if (!destination_code) return new Response(JSON.stringify({ error: "missing_param", message: "What city are you looking for hotels in?" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!check_in || !check_out) return new Response(JSON.stringify({ error: "missing_param", message: "What are your check-in and check-out dates?" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!adults) return new Response(JSON.stringify({ error: "missing_param", message: "How many guests?" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const signature = await generateSignature(HOTELBEDS_API_KEY, HOTELBEDS_SECRET);

    // Build occupancies array — one entry per room, each with the same number of adults
    const occupancies = Array.from({ length: rooms }, () => ({
      rooms: 1,
      adults,
      children: 0,
    }));

    const searchRes = await fetch("https://api.test.hotelbeds.com/hotel-api/1.0/hotels", {
      method: "POST",
      headers: {
        "Api-key": HOTELBEDS_API_KEY,
        "X-Signature": signature,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stay: {
          checkIn: check_in,
          checkOut: check_out,
        },
        occupancies,
        destination: {
          code: destination_code,
        },
      }),
    });

    if (!searchRes.ok) {
      const errorBody = await searchRes.text();
      console.error("Hotelbeds API error:", searchRes.status, errorBody);
      return new Response(
        JSON.stringify({ error: "no_results", message: "No hotels found. Try different dates or a nearby city.", hotels: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const searchData = await searchRes.json();
    const hotelResults = searchData.hotels?.hotels ?? [];

    // Fetch images from Content API for all hotel codes (batched, max 100 per request)
    const hotelCodes = hotelResults.map((h: any) => h.code);
    const imageMap: Record<string, string> = {};

    // Process in batches of 100
    for (let i = 0; i < hotelCodes.length; i += 100) {
      const batch = hotelCodes.slice(i, i + 100);
      const contentSignature = await generateSignature(HOTELBEDS_API_KEY, HOTELBEDS_SECRET);
      const codesParam = batch.join(",");
      const contentRes = await fetch(
        `https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels?codes=${codesParam}&fields=images&language=ENG&from=1&to=${batch.length}`,
        {
          method: "GET",
          headers: {
            "Api-key": HOTELBEDS_API_KEY,
            "X-Signature": contentSignature,
            "Accept": "application/json",
          },
        },
      );

      if (contentRes.ok) {
        const contentData = await contentRes.json();
        for (const h of contentData.hotels ?? []) {
          // Prefer room images, then hotel images; pick the first available
          const img = h.images?.find((i: any) => i.type?.code === "GEN") ?? h.images?.[0];
          if (img?.path) {
            // Sanitize: strip query params from path to avoid double ? in URL
            const cleanPath = img.path.split("?")[0];
            imageMap[String(h.code)] = `https://photos.hotelbeds.com/giata/bigger/${cleanPath}`;
          }
        }
      } else {
        console.error("Content API error:", contentRes.status, await contentRes.text());
      }
    }

    // Calculate number of nights
    const checkIn = new Date(check_in);
    const checkOut = new Date(check_out);
    const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

    const hotels = hotelResults.map((hotel: any) => {
      // Get the cheapest room/rate combination
      const cheapestRoom = hotel.rooms
        ?.flatMap((room: any) => room.rates?.map((rate: any) => ({ ...rate, roomName: room.name })) ?? [])
        ?.sort((a: any, b: any) => parseFloat(a.net) - parseFloat(b.net))?.[0];

      const totalPrice = cheapestRoom ? parseFloat(cheapestRoom.net) : 0;
      const totalPriceCents = Math.round(totalPrice * 100);
      const pricePerNightCents = Math.round(totalPriceCents / nights);
      const currency = hotel.currency ?? searchData.hotels?.currency ?? "USD";

      // Build cancellation policy summary
      let cancellationPolicy = "non-refundable";
      if (cheapestRoom?.cancellationPolicies?.length) {
        const firstPolicy = cheapestRoom.cancellationPolicies[0];
        if (firstPolicy.from) {
          const cancelDate = new Date(firstPolicy.from);
          if (cancelDate > new Date()) {
            cancellationPolicy = `Free cancellation until ${firstPolicy.from.split("T")[0]}`;
          }
        }
      }

      const hotelCode = String(hotel.code);

      return {
        id: hotelCode,
        name: hotel.name ?? "Unknown Hotel",
        stars: hotel.categoryCode ? parseInt(hotel.categoryCode) || null : null,
        address: [hotel.zoneName, hotel.destinationName].filter(Boolean).join(", "),
        image_url: imageMap[hotelCode] ?? null,
        price_per_night_cents: pricePerNightCents,
        total_price_cents: totalPriceCents,
        currency,
        cancellation_policy: cancellationPolicy,
        booking_token: cheapestRoom?.rateKey ?? null,
      };
    });

    // Filter by keyword (hotel name) if provided
    let filtered = hotels;
    let keywordNotFound = false;
    if (keyword) {
      const kw = keyword.toLowerCase();
      const matches = hotels.filter((h: any) => h.name.toLowerCase().includes(kw));
      if (matches.length > 0) {
        filtered = matches;
      } else {
        // Infer tier from keyword and show similar alternatives
        keywordNotFound = true;
        const luxuryKeywords = /ritz|four seasons|mandarin|peninsula|st\.\s*regis|waldorf|rosewood|aman|bulgari|shangri|dorchester|claridge|savoy|langham|connaught/i;
        const midKeywords = /hilton|marriott|hyatt|sheraton|westin|radisson|intercontinental|crowne|doubletree|novotel/i;
        const isLuxury = luxuryKeywords.test(keyword);
        const isMid = midKeywords.test(keyword);

        if (isLuxury) {
          // Show 4-5 star hotels sorted by price descending
          filtered = hotels
            .filter((h: any) => (h.stars ?? 0) >= 4)
            .sort((a: any, b: any) => b.price_per_night_cents - a.price_per_night_cents);
        } else if (isMid) {
          // Show 3-4 star hotels
          filtered = hotels
            .filter((h: any) => (h.stars ?? 0) >= 3 && (h.stars ?? 0) <= 4)
            .sort((a: any, b: any) => a.price_per_night_cents - b.price_per_night_cents);
        }
        // If no tier match or too few results, keep all
        if (filtered.length < 3) filtered = hotels;
      }
    }

    return new Response(JSON.stringify({
      hotels: filtered,
      keyword_not_found: keywordNotFound ? keyword : undefined,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-hotels error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
