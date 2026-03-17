const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ActivitySearchRequest {
  destination: string;
  start_date?: string;
  end_date?: string;
  currency?: string;
}

const VIATOR_BASE_URL = "https://api.viator.com/partner";

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
    const VIATOR_API_KEY = Deno.env.get("VIATOR_API_KEY");
    if (!VIATOR_API_KEY) throw new Error("VIATOR_API_KEY not configured");

    const body: ActivitySearchRequest = await req.json();
    const { destination, start_date, end_date, currency = "USD" } = body;

    if (!destination) {
      return new Response(
        JSON.stringify({ error: "Missing required field: destination" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Use freetext search to find products by destination name
    const searchBody: Record<string, any> = {
      searchTerm: destination,
      searchTypes: [
        {
          searchType: "PRODUCTS",
          pagination: {
            start: 1,
            count: 30,
          },
        },
      ],
      currency,
      filtering: {},
    };

    if (start_date) {
      searchBody.filtering.startDate = start_date;
    }
    if (end_date) {
      searchBody.filtering.endDate = end_date;
    }

    const searchRes = await fetch(`${VIATOR_BASE_URL}/search/freetext`, {
      method: "POST",
      headers: {
        "exp-api-key": VIATOR_API_KEY,
        "Accept-Language": "en-US",
        "Accept": "application/json;version=2.0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(searchBody),
    });

    if (!searchRes.ok) {
      const errBody = await searchRes.text();
      console.error("Viator search error:", searchRes.status, errBody);
      return new Response(
        JSON.stringify({ error: "Activity search failed", details: errBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const searchData = await searchRes.json();
    const products = searchData.products?.results ?? [];

    const activities = products.map((product: any) => {
      const pricing = product.pricing ?? {};
      const summary = pricing.summary ?? {};
      const fromPrice = summary.fromPrice ?? pricing.fromPrice ?? 0;
      const priceCents = Math.round(parseFloat(String(fromPrice)) * 100);

      // Parse duration
      let durationMinutes: number | null = null;
      const duration = product.duration ?? product.itinerary?.duration;
      if (duration) {
        if (typeof duration === "string") {
          // ISO 8601 duration like PT2H30M
          const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
          if (match) {
            durationMinutes = (parseInt(match[1] || "0") * 60) + parseInt(match[2] || "0");
          }
        } else if (duration.fixedDurationInMinutes) {
          durationMinutes = duration.fixedDurationInMinutes;
        } else if (duration.variableDurationFromMinutes) {
          durationMinutes = duration.variableDurationFromMinutes;
        }
      }

      // Get the best image — prefer 720x480, fall back to 480x320 or largest
      const images = product.images ?? [];
      const coverImage = images.find((i: any) => i.isCover) ?? images[0];
      const variants = coverImage?.variants ?? [];
      const imageUrl =
        variants.find((v: any) => v.width === 720)?.url ??
        variants.find((v: any) => v.width === 480)?.url ??
        variants[variants.length - 1]?.url ??
        null;

      // Reviews
      const reviews = product.reviews ?? {};
      const rating = reviews.combinedAverageRating ?? product.rating ?? null;
      const reviewCount = reviews.totalReviews ?? product.reviewCount ?? 0;

      return {
        id: product.productCode ?? product.code,
        title: product.title ?? product.name ?? "Unknown Activity",
        description: product.description ?? product.shortDescription ?? null,
        image_url: imageUrl,
        price_cents: priceCents,
        currency: pricing.currency ?? currency,
        duration_minutes: durationMinutes,
        rating,
        review_count: reviewCount,
        category: product.productCategory ?? null,
        booking_url: product.productUrl ?? null,
        booking_token: product.productCode ?? product.code,
      };
    });

    return new Response(JSON.stringify({ activities }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-activities error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
