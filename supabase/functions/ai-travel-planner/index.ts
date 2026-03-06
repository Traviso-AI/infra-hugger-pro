import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Traviso AI, an expert travel planning assistant. You help users plan complete, detailed travel itineraries.

When a user describes a trip idea (or shares a group chat screenshot or conversation), you should:
1. Extract: destination, approximate dates, budget level, group size, interests
2. Generate a structured daily itinerary including:
   - Flight suggestions (airlines, approximate times)
   - Hotel recommendations (with price ranges)
   - Daily activities and experiences
   - Restaurant recommendations for each meal
   - Local events happening during travel dates
   - Transportation tips between locations
   - Estimated costs

If the user shares a screenshot or text of a group chat conversation, read it carefully to identify where the group wants to go, what activities they're interested in, their budget hints, and any dates mentioned.

Format your response with clear markdown:
- Use ## for day headers (e.g., "## Day 1: Arrival in Tokyo")
- Use ### for sections (Hotels, Activities, etc.)
- Use bullet points for items
- Include estimated prices where possible
- Add emoji for visual appeal (🏨 🍣 🎌 ✈️ etc.)

When users ask to modify the trip, adjust the itinerary accordingly.
Keep responses detailed but scannable. Be enthusiastic and knowledgeable about travel.`;

type TextContent = { type: "text"; text: string };
type ImageContent = { type: "image_url"; image_url: { url: string } };
type MessageContent = string | Array<TextContent | ImageContent>;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: MessageContent;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, imageUrl } = await req.json() as {
      messages: ChatMessage[];
      imageUrl?: string;
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // If an image URL was supplied, convert the last user message to vision format
    let processedMessages: ChatMessage[] = messages.map((m) => ({ ...m }));
    if (imageUrl) {
      const lastUserIdx = [...processedMessages]
        .map((m, i) => ({ m, i }))
        .filter(({ m }) => m.role === "user")
        .at(-1)?.i;

      if (lastUserIdx !== undefined) {
        const original = processedMessages[lastUserIdx];
        const textPart: TextContent = {
          type: "text",
          text: typeof original.content === "string" ? original.content : "",
        };
        const imagePart: ImageContent = {
          type: "image_url",
          image_url: { url: imageUrl },
        };
        processedMessages[lastUserIdx] = {
          role: "user",
          content: [textPart, imagePart],
        };
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...processedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-travel-planner error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
