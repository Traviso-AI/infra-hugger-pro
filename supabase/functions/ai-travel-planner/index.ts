import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Nala, a friendly AI travel planning assistant named after a mini golden doodle 🐾. You're warm, knowledgeable, and concise.

## RESPONSE STYLE RULES (CRITICAL — follow these every time)

1. **Be concise.** 1-2 sentence intro max. No preambles. Don't repeat what the user said.
2. **Use proper markdown hierarchy.** H2 (##) for major sections, H3 (###) for subsections. ALWAYS use bullet points (- ) for list items, never plain sentences in a row.
3. **Add horizontal rules (---) between major sections** like between days or between the itinerary and tips.
4. **Limit emoji.** One emoji per heading max. Never multiple emoji in a sentence.
5. **End with one short question** about what to do next.

## ITINERARY MODE

When creating itineraries, use this EXACT markdown structure:

---

## 📍 Day 1: [Day Title]

### Morning
- **[Activity Name]** — [Location]. [1-line description]. ~$XX/person.

### Afternoon
- **[Activity Name]** — [Location]. [1-line description]. ~$XX/person.

### Evening
- **🍽️ Dinner at [Restaurant]** — [Cuisine type]. ~$XX/person.
- **🍸 [Nightlife/Activity]** — [Venue]. ~$XX entry.

---

## 📍 Day 2: [Day Title]

[...same pattern...]

---

### 💡 Quick Tips
- **Transport:** [One sentence]
- **Budget:** [One sentence]
- **Pro tip:** [One sentence]

---

RULES for itineraries:
- ALWAYS use ## for day headers with the 📍 emoji
- ALWAYS use ### for Morning / Afternoon / Evening
- ALWAYS use bullet points with bold activity names
- Each bullet = one line. Activity name bold, then dash, then details.
- Include estimated price on EVERY bullet item
- Keep to 2-4 bullets per time-of-day section (Morning, Afternoon, Evening)
- Add --- horizontal rules between every day
- End with a ### 💡 Quick Tips section (max 3 bullets)
- Never write paragraphs of plain text — everything is a bullet or heading

## COMPARISON MODE

When a user asks to find, compare, or search for hotels, flights, restaurants, or activities:

1. If dates/destination are missing, ask for them first (one short sentence).
2. Write a 1-sentence intro, then output the comparison block, then optionally 1 short tips section.
3. Use this EXACT format — a fenced code block with language tag "traviso-compare":

\`\`\`traviso-compare
{
  "category": "hotel",
  "destination": "Tulum",
  "dates": "Mar 15-20",
  "options": [
    {
      "name": "Hotel Name",
      "type": "hotel",
      "price": "$X/night",
      "rating": 4.5,
      "location": "Area or neighborhood",
      "duration": "5 nights",
      "highlights": ["Pool", "Beach access", "Free breakfast"],
      "recommended": false
    }
  ]
}
\`\`\`

RULES for comparison blocks:
- category: hotel | flight | restaurant | activity | event | transport
- Always exactly 3 options with varied price points
- Mark ONE as "recommended": true (best value)
- Use plausible real-sounding names for the destination
- Pricing formats: hotels "$X/night", flights "$X roundtrip", restaurants "$X-Y/person", activities "$X/person"
- NEVER nest comparison blocks inside other markdown
- Keep any tips section AFTER the block to max 3-4 bullets under a ### heading

Trigger comparison mode for: "find me hotels", "compare flights", "show restaurants", "what activities", "I need a hotel", or any shopping/comparing intent.`;


type MessageContent = string;

interface ChatMessage {
  role: "user" | "assistant";
  content: MessageContent;
}

// ---------------------------------------------------------------------------
// Gemini direct API — used when an image is attached.
// Fetches the image URL, converts it to base64, and calls generateContent
// using the inlineData format that the Gemini API actually requires.
// Wraps the response into OpenAI SSE format so the frontend parser is unchanged.
// ---------------------------------------------------------------------------
async function callGeminiWithVision(
  messages: ChatMessage[],
  imageUrl: string,
): Promise<Response> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

  // --- Step 1: Fetch the image and convert to base64 ---
  console.log("[ai-travel-planner] Fetching image from storage URL...");
  const imgResp = await fetch(imageUrl);
  if (!imgResp.ok) {
    throw new Error(`Failed to fetch image: ${imgResp.status} ${imgResp.statusText}`);
  }
  const mimeType = imgResp.headers.get("content-type") ?? "image/jpeg";
  const imageBuffer = await imgResp.arrayBuffer();
  const bytes = new Uint8Array(imageBuffer);
  const CHUNK = 8192;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  const base64Data = btoa(binary);
  console.log(`[ai-travel-planner] Image fetched: ${mimeType}, ${imageBuffer.byteLength} bytes`);

  // --- Step 2: Find the last user message ---
  let userMessage = "";
  let lastUserIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      userMessage = messages[i].content;
      lastUserIdx = i;
      break;
    }
  }

  // --- Step 3: Build Gemini contents array with conversation history ---
  // "assistant" → "model" per Gemini API spec
  const contents = [];
  for (let i = 0; i < messages.length; i++) {
    if (i === lastUserIdx) continue; // added below with image
    const msg = messages[i];
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }

  // Last user message with inlineData image
  contents.push({
    role: "user",
    parts: [
      { inlineData: { mimeType, data: base64Data } },
      { text: userMessage },
    ],
  });

  console.log(`[ai-travel-planner] Calling Gemini 1.5 Flash, ${contents.length} turns`);

  // --- Step 4: Call Gemini generateContent ---
  const geminiResp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
      }),
    },
  );

  if (!geminiResp.ok) {
    const errText = await geminiResp.text();
    console.error("[ai-travel-planner] Gemini API error:", geminiResp.status, errText);
    if (geminiResp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    throw new Error(`Gemini API error ${geminiResp.status}: ${errText}`);
  }

  const data = await geminiResp.json();
  const responseText: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  console.log(`[ai-travel-planner] Gemini vision response: ${responseText.length} chars`);

  // --- Step 5: Return as OpenAI SSE format so the frontend parser is unchanged ---
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ choices: [{ delta: { content: responseText } }] })}\n\n`,
        ),
      );
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

// ---------------------------------------------------------------------------
// AI gateway — used for text-only messages
// ---------------------------------------------------------------------------
async function callAIGateway(messages: ChatMessage[]): Promise<Response> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
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
    console.error("[ai-travel-planner] AI gateway error:", response.status, t);
    throw new Error("AI gateway request failed");
  }

  return new Response(response.body, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, imageUrl } = await req.json() as {
      messages: ChatMessage[];
      imageUrl?: string;
    };

    if (imageUrl) {
      console.log("[ai-travel-planner] Image attached → Gemini 1.5 Flash (direct API)");
      return await callGeminiWithVision(messages, imageUrl);
    }

    console.log("[ai-travel-planner] Text-only → AI gateway");
    return await callAIGateway(messages);
  } catch (e) {
    console.error("[ai-travel-planner] Unhandled error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
