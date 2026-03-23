import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function hashFromUuid(uuid: string): number {
  const hex = uuid.replace(/[^0-9a-f]/gi, "");
  const h1 = hex.length >= 8 ? parseInt(hex.substring(0, 8), 16) : 0;
  return Math.abs(h1);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { trip_id, destination } = await req.json();
    if (!trip_id || !destination) {
      return new Response(JSON.stringify({ error: "missing trip_id or destination" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

    let coverUrl: string | null = null;

    // Layer 1 — Unsplash search by full destination
    if (UNSPLASH_ACCESS_KEY) {
      try {
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(destination)}&per_page=30&orientation=landscape`,
          { headers: { "Authorization": `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
        );
        if (res.ok) {
          const data = await res.json();
          const photos = data.results ?? [];
          if (photos.length > 0) {
            const hash = hashFromUuid(trip_id);
            const photo = photos[hash % photos.length];
            coverUrl = `${photo.urls.raw}&w=800&q=80&fit=crop&auto=format`;
            console.log(`[assign-cover-image] Layer 1 success: ${destination}`);
          }
        }
      } catch (e) {
        console.error("[assign-cover-image] Layer 1 failed:", e);
      }
    }

    // Layer 2 — DALL-E 3 generates unique destination photo stored permanently in Supabase Storage
    if (!coverUrl && OPENAI_API_KEY) {
      try {
        const dalleRes = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: `A stunning professional travel photography image of ${destination}. Landscape orientation, golden hour lighting, vibrant colors, no people, no text, no watermarks. Shot on high-end camera, editorial quality.`,
            n: 1,
            size: "1792x1024",
            quality: "standard",
          }),
        });

        if (dalleRes.ok) {
          const dalleData = await dalleRes.json();
          const tempUrl = dalleData.data?.[0]?.url;
          if (tempUrl) {
            const imgRes = await fetch(tempUrl);
            if (imgRes.ok) {
              const imgBuffer = await imgRes.arrayBuffer();
              const fileName = `covers/ai-${trip_id}.png`;
              const { error: uploadError } = await supabase.storage
                .from("trip-images")
                .upload(fileName, imgBuffer, {
                  contentType: "image/png",
                  upsert: true,
                });
              if (!uploadError) {
                coverUrl = `${SUPABASE_URL}/storage/v1/object/public/trip-images/${fileName}`;
                console.log(`[assign-cover-image] Layer 2 DALL-E success: ${destination}`);
              }
            }
          }
        }
      } catch (e) {
        console.error("[assign-cover-image] Layer 2 failed:", e);
      }
    }

    // Layer 3 — Branded Traviso fallback, never runs out
    if (!coverUrl) {
      coverUrl = "/images/traviso-cover-fallback.jpg";
      console.log(`[assign-cover-image] Layer 3 branded fallback used for ${destination}`);
    }

    // Store permanently on the trip row — never called again for this trip
    const { error } = await supabase
      .from("trips")
      .update({ cover_image_url: coverUrl, updated_at: new Date().toISOString() })
      .eq("id", trip_id);

    if (error) throw error;

    return new Response(JSON.stringify({ cover_url: coverUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[assign-cover-image]", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
