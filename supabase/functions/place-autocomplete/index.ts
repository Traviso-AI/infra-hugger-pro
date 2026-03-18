const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!GOOGLE_PLACES_API_KEY) throw new Error("GOOGLE_PLACES_API_KEY not configured");

    const url = new URL(req.url);
    const query = url.searchParams.get("q") ?? "";

    if (!query || query.length < 2) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
      },
      body: JSON.stringify({
        input: query,
        includedPrimaryTypes: ["(cities)"],
        languageCode: "en",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Places Autocomplete error:", res.status, err);
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const suggestions = (data.suggestions ?? []).map((s: any) => {
      const place = s.placePrediction;
      if (!place) return null;
      const mainText = place.structuredFormat?.mainText?.text ?? "";
      const secondaryText = place.structuredFormat?.secondaryText?.text ?? "";
      return {
        place_id: place.placeId ?? "",
        description: place.text?.text ?? `${mainText}, ${secondaryText}`,
        city: mainText,
        country: secondaryText,
      };
    }).filter(Boolean).slice(0, 5);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("place-autocomplete error:", e);
    return new Response(JSON.stringify({ suggestions: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
