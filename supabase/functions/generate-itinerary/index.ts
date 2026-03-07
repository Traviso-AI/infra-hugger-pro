import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { destination, durationDays } = await req.json();
    if (!destination) throw new Error("Missing destination");

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const numDays = parseInt(durationDays) || 3;

    const prompt = `Create a ${numDays} day itinerary for ${destination}. Return ONLY valid JSON in this exact format, no other text:
{
  "days": [
    {
      "title": "Day title",
      "description": "Day description",
      "activities": [
        {
          "type": "Activity",
          "title": "Activity name",
          "location": "Location name",
          "description": "Brief description"
        }
      ]
    }
  ]
}

Valid types: Activity, Restaurant, Hotel, Flight, Experience, Transport. Include 3-5 activities per day.`;

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
        }),
      }
    );

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Gemini error:", resp.status, errText);
      throw new Error(`Gemini API error ${resp.status}`);
    }

    const data = await resp.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Clean and parse JSON
    const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const parsed = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-itinerary error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
