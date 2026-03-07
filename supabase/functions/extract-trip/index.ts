import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();
    const conversation = messages.map((m: any) => `${m.role}: ${m.content}`).join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "Extract trip details from the conversation. Return structured data.",
          },
          { role: "user", content: conversation },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_trip",
              description: "Create a structured trip from conversation",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  destination: { type: "string" },
                  description: { type: "string" },
                  duration_days: { type: "number" },
                  price_estimate: { type: "number" },
                  tags: { type: "array", items: { type: "string" } },
                  days: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day_number: { type: "number" },
                        title: { type: "string" },
                        activities: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              type: { type: "string", enum: ["flight", "hotel", "restaurant", "activity", "event", "transport"] },
                              title: { type: "string" },
                              description: { type: "string" },
                              location: { type: "string" },
                              price_estimate: { type: "number" },
                            },
                            required: ["type", "title"],
                          },
                        },
                      },
                      required: ["day_number", "title"],
                    },
                  },
                },
                required: ["title", "destination", "duration_days"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_trip" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("Extract error:", response.status, t);
      throw new Error("AI extraction failed");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call returned");

    const tripData = JSON.parse(toolCall.function.arguments);

    // Title case helper
    const minor = new Set(["a","an","the","and","but","or","for","nor","on","at","to","by","in","of","up","as","is","it"]);
    function toTitleCase(str: string): string {
      return str.replace(/\w\S*/g, (word: string, index: number) => {
        if (index !== 0 && minor.has(word.toLowerCase())) return word.toLowerCase();
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      });
    }

    // Assign cover image based on destination
    const destLower = tripData.destination.toLowerCase();
    const unsplashMap: Record<string, string> = {
      tokyo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
      seoul: 'https://images.unsplash.com/photo-1601621915196-2621bfb0cd6e?w=800&q=80',
      bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
      paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
      miami: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
      barcelona: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=80',
      'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
      nyc: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
      maldives: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80',
      cabo: 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=800&q=80',
      'los angeles': 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800&q=80',
      la: 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800&q=80',
    };
    const coverImageUrl = Object.entries(unsplashMap).find(([key]) => destLower.includes(key))?.[1]
      || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80';

    // Create trip in DB
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .insert({
        creator_id: user.id,
        title: toTitleCase(tripData.title),
        destination: tripData.destination,
        description: tripData.description || null,
        duration_days: tripData.duration_days || 1,
        price_estimate: tripData.price_estimate || null,
        tags: tripData.tags || [],
        is_published: false,
        cover_image_url: coverImageUrl,
      })
      .select()
      .single();

    if (tripError) throw tripError;

    // Create days and activities
    if (tripData.days) {
      for (const day of tripData.days) {
        const { data: tripDay, error: dayError } = await supabase
          .from("trip_days")
          .insert({
            trip_id: trip.id,
            day_number: day.day_number,
            title: day.title,
          })
          .select()
          .single();

        if (dayError) continue;

        if (day.activities) {
          const activities = day.activities.map((a: any, idx: number) => ({
            trip_day_id: tripDay.id,
            type: a.type || "activity",
            title: a.title,
            description: a.description || null,
            location: a.location || null,
            price_estimate: a.price_estimate || null,
            sort_order: idx,
          }));
          await supabase.from("trip_activities").insert(activities);
        }
      }
    }

    return new Response(JSON.stringify({ trip_id: trip.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-trip error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
