const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RestaurantSearchRequest {
  destination: string;
  date?: string;
  party_size?: number;
  cuisine?: string;
  keyword?: string;
}

const priceLevelLabels: Record<string, string> = {
  PRICE_LEVEL_FREE: "Free",
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
};

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
    const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!GOOGLE_PLACES_API_KEY) throw new Error("GOOGLE_PLACES_API_KEY not configured");

    const body: RestaurantSearchRequest = await req.json();
    const { destination, date, party_size, cuisine, keyword } = body;

    if (!destination) {
      return new Response(
        JSON.stringify({ error: "missing_param", message: "Which city are you looking for restaurants in?" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build search query — keyword takes priority for specific restaurant searches
    const textQuery = keyword
      ? `${keyword} restaurant in ${destination}`
      : cuisine
        ? `${cuisine} restaurants in ${destination}`
        : `best restaurants in ${destination}`;

    // Use Google Places API (New) — Text Search
    const searchRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.priceRange,places.photos,places.primaryType,places.primaryTypeDisplayName",
      },
      body: JSON.stringify({
        textQuery,
        includedType: "restaurant",
        pageSize: 20,
        languageCode: "en",
      }),
    });

    if (!searchRes.ok) {
      const errBody = await searchRes.text();
      console.error("Google Places error:", searchRes.status, errBody);
      return new Response(
        JSON.stringify({ error: "no_results", message: "Restaurants unavailable right now. Try again in a moment.", restaurants: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const searchData = await searchRes.json();
    const places = searchData.places ?? [];

    const restaurants = places.map((place: any) => {
      // Build photo URL from the photo resource name
      let imageUrl: string | null = null;
      const photoName = place.photos?.[0]?.name;
      if (photoName) {
        imageUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=720&key=${GOOGLE_PLACES_API_KEY}`;
      }

      // Resolve price: priceLevel enum → dollar signs, fallback to priceRange text
      let priceRange: string | null = priceLevelLabels[place.priceLevel] ?? null;
      if (!priceRange && place.priceRange) {
        // priceRange has startPrice/endPrice with units — infer tier from midpoint
        const start = place.priceRange.startPrice?.units ? Number(place.priceRange.startPrice.units) : null;
        const end = place.priceRange.endPrice?.units ? Number(place.priceRange.endPrice.units) : null;
        if (start != null || end != null) {
          const mid = (start ?? 0) + ((end ?? start ?? 0) - (start ?? 0)) / 2;
          if (mid <= 15) priceRange = "$";
          else if (mid <= 35) priceRange = "$$";
          else if (mid <= 70) priceRange = "$$$";
          else priceRange = "$$$$";
        }
      }

      return {
        id: place.id,
        name: place.displayName?.text ?? "Unknown Restaurant",
        cuisine: cuisine ?? place.primaryTypeDisplayName?.text ?? null,
        price_range: priceRange,
        rating: place.rating ?? null,
        review_count: place.userRatingCount ?? 0,
        image_url: imageUrl,
        address: place.formattedAddress ?? null,
        opentable_url: null,
        affiliate_enabled: false,
      };
    });

    return new Response(JSON.stringify({ restaurants }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-restaurants error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
