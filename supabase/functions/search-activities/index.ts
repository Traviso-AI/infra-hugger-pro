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
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const API_TIMEOUT_MS = 8000; // 8 second hard timeout

// Simple in-memory cache keyed by destination+dates
const cache = new Map<string, { data: any; timestamp: number }>();

function getCacheKey(destination: string, start_date?: string, end_date?: string): string {
  return `${destination.toLowerCase()}|${start_date ?? ""}|${end_date ?? ""}`;
}

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
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

    // Check cache
    const cacheKey = getCacheKey(destination, start_date, end_date);
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log(`[search-activities] Cache hit for ${cacheKey}`);
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build search request
    const searchBody: Record<string, any> = {
      searchTerm: destination,
      searchTypes: [
        {
          searchType: "PRODUCTS",
          pagination: { start: 1, count: 20 },
        },
      ],
      currency,
      filtering: {},
    };

    if (start_date) searchBody.filtering.startDate = start_date;
    if (end_date) searchBody.filtering.endDate = end_date;

    const searchRes = await fetchWithTimeout(
      `${VIATOR_BASE_URL}/search/freetext`,
      {
        method: "POST",
        headers: {
          "exp-api-key": VIATOR_API_KEY,
          "Accept-Language": "en-US",
          "Accept": "application/json;version=2.0",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchBody),
      },
      API_TIMEOUT_MS,
    );

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

      let durationMinutes: number | null = null;
      const duration = product.duration ?? product.itinerary?.duration;
      if (duration) {
        if (typeof duration === "string") {
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

      const images = product.images ?? [];
      const coverImage = images.find((i: any) => i.isCover) ?? images[0];
      const variants = coverImage?.variants ?? [];
      const imageUrl =
        variants.find((v: any) => v.width === 720)?.url ??
        variants.find((v: any) => v.width === 480)?.url ??
        variants[variants.length - 1]?.url ??
        null;

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

    // Deduplicate by product code and normalized title
    const seenIds = new Set<string>();
    const seenTitles = new Set<string>();
    const irrelevantPatterns = /luggage\s*storage|bag\s*storage|locker/i;

    const deduped = activities.filter((a: any) => {
      if (seenIds.has(a.id)) return false;
      const normalizedTitle = a.title.toLowerCase().trim();
      if (seenTitles.has(normalizedTitle)) return false;
      if (irrelevantPatterns.test(a.title)) return false;
      seenIds.add(a.id);
      seenTitles.add(normalizedTitle);
      return true;
    });

    const result = { activities: deduped };

    // Store in cache
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    // Evict old entries (keep cache bounded)
    if (cache.size > 50) {
      const oldest = [...cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      if (oldest) cache.delete(oldest[0]);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      console.error("[search-activities] Request timed out after 8s");
      return new Response(
        JSON.stringify({ error: "Search timed out. Please try again.", activities: [] }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    console.error("search-activities error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
