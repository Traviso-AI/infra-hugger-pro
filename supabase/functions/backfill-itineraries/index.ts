import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { trip_id } = await req.json();
    if (!trip_id) throw new Error("trip_id required");

    const { data: trip, error: tripErr } = await supabase
      .from("trips")
      .select("id, title, destination, duration_days")
      .eq("id", trip_id)
      .single();
    if (tripErr || !trip) throw new Error("Trip not found");

    // Check if already has days
    const { data: existingDays } = await supabase
      .from("trip_days")
      .select("id")
      .eq("trip_id", trip_id)
      .limit(1);
    if (existingDays && existingDays.length > 0) {
      return new Response(JSON.stringify({ message: "Trip already has days", skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Create a detailed ${trip.duration_days}-day travel itinerary for ${trip.destination}. Return ONLY valid JSON (no markdown). Format: {"days":[{"title":"Day title","description":"Day description","activities":[{"type":"activity|restaurant|hotel|flight|experience|transport","title":"Activity title","description":"What to do","location":"Where"}]}]}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a travel planning expert. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) throw new Error(`AI gateway error: ${response.status}`);
    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(content);

    const VALID_TYPES = ["activity", "restaurant", "hotel", "flight", "experience", "transport"];
    let daysInserted = 0;

    for (let i = 0; i < (parsed.days || []).length; i++) {
      const day = parsed.days[i];
      const { data: tripDay, error: dayErr } = await supabase
        .from("trip_days")
        .insert({
          trip_id: trip.id,
          day_number: i + 1,
          title: day.title || `Day ${i + 1}`,
          description: day.description || null,
        })
        .select()
        .single();

      if (dayErr) throw dayErr;

      const activities = (day.activities || [])
        .filter((a: any) => a.title)
        .map((a: any, idx: number) => ({
          trip_day_id: tripDay.id,
          type: VALID_TYPES.includes(a.type?.toLowerCase()) ? a.type.toLowerCase() : "activity",
          title: a.title,
          description: a.description || null,
          location: a.location || null,
          sort_order: idx,
        }));

      if (activities.length > 0) {
        const { error: actErr } = await supabase.from("trip_activities").insert(activities);
        if (actErr) throw actErr;
      }
      daysInserted++;
    }

    return new Response(JSON.stringify({ success: true, trip: trip.title, daysInserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
