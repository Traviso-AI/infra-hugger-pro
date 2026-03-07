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

    // Find trips with no days
    const { data: trips, error: tripsErr } = await supabase
      .from("trips")
      .select("id, title, destination, duration_days")
      .not("id", "in", `(SELECT DISTINCT trip_id FROM trip_days)`);

    if (tripsErr) {
      // Fallback: use left join approach
      const { data: allTrips } = await supabase.from("trips").select("id, title, destination, duration_days");
      const { data: allDays } = await supabase.from("trip_days").select("trip_id");
      const tripsWithDays = new Set((allDays || []).map((d: any) => d.trip_id));
      const emptyTrips = (allTrips || []).filter((t: any) => !tripsWithDays.has(t.id));
      
      if (emptyTrips.length === 0) {
        return new Response(JSON.stringify({ message: "No trips need backfilling" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const results = [];
      for (const trip of emptyTrips) {
        try {
          const result = await backfillTrip(supabase, LOVABLE_API_KEY, trip);
          results.push({ id: trip.id, title: trip.title, status: "ok", days: result });
        } catch (e: any) {
          results.push({ id: trip.id, title: trip.title, status: "error", error: e.message });
        }
      }

      return new Response(JSON.stringify({ backfilled: results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!trips || trips.length === 0) {
      return new Response(JSON.stringify({ message: "No trips need backfilling" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];
    for (const trip of trips) {
      try {
        const result = await backfillTrip(supabase, LOVABLE_API_KEY, trip);
        results.push({ id: trip.id, title: trip.title, status: "ok", days: result });
      } catch (e: any) {
        results.push({ id: trip.id, title: trip.title, status: "error", error: e.message });
      }
    }

    return new Response(JSON.stringify({ backfilled: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function backfillTrip(supabase: any, apiKey: string, trip: any) {
  const prompt = `Create a detailed ${trip.duration_days}-day travel itinerary for ${trip.destination}. Return ONLY valid JSON (no markdown, no code fences). Format: {"days":[{"title":"Day title","description":"Day description","activities":[{"type":"activity|restaurant|hotel|flight|experience|transport","title":"Activity title","description":"What to do","location":"Where"}]}]}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
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

  return daysInserted;
}
