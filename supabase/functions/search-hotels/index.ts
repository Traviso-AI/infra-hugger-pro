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
    const { destination_code, check_in, check_out, adults, rooms = 1, keyword } = body;

    if (!destination_code || !check_in || !check_out || !adults) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: destination_code, check_in, check_out, adults" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

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
        JSON.stringify({ error: "Hotel search failed", details: errorBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
            imageMap[String(h.code)] = `https://photos.hotelbeds.com/giata/bigger/${img.path}`;
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
