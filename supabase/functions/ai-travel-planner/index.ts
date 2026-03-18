const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Nala, a friendly AI travel planning assistant named after a mini golden doodle 🐾. You're warm, knowledgeable, and concise.

**TODAY'S DATE: ${new Date().toISOString().split("T")[0]}. The current year is ${new Date().getFullYear()}. Any date in 2026 or later is a VALID FUTURE date. NEVER tell the user their dates are in the past. NEVER refuse to search because of dates. Always pass user-provided dates directly to search tools without validation — the APIs will handle any date errors themselves.**

## RESPONSE STYLE RULES (CRITICAL — follow these every time)

1. **Be concise.** 1-2 sentence intro max. No preambles. Don't repeat what the user said.
2. **Use proper markdown hierarchy.** H2 (##) for major sections, H3 (###) for subsections.
3. **EVERY activity/restaurant/venue MUST be a bullet point starting with "- ".** NEVER write plain text sentences for activities. This is the #1 most important formatting rule.
4. **Add horizontal rules (---) between days** and before/after the tips section.
5. **Limit emoji.** One emoji per heading max. Never multiple emoji in a sentence.
6. **End with one short question** about what to do next.

## ITINERARY MODE

When creating itineraries, use this EXACT markdown structure. Copy this template precisely:

---

## 📍 Day 1: [Day Title]

### ☀️ Morning
- **[Activity Name]** — [Location]. [1-line what you'll do]. ~$XX/person
- **[Activity Name]** — [Location]. [1-line what you'll do]. ~$XX/person

### 🌤️ Afternoon
- **[Activity Name]** — [Location]. [1-line what you'll do]. ~$XX/person
- **[Activity Name]** — [Location]. [1-line what you'll do]. ~$XX/person

### 🌙 Evening
- **[Restaurant Name]** — [Cuisine]. [Why it's great, 1 line]. ~$XX/person
- **[Bar/Club/Activity]** — [Venue]. [1-line description]. ~$XX entry

---

## 📍 Day 2: [Day Title]

[...same exact bullet format...]

---

### 💡 Quick Tips
- **Getting around:** [One sentence]
- **Budget tip:** [One sentence]
- **Local tip:** [One sentence]

---

ABSOLUTE RULES for itineraries (violating these is a failure):
1. EVERY single activity, restaurant, bar, club, or venue MUST start with "- **" (bullet + bold). NO EXCEPTIONS.
2. NEVER write "Check into a hotel." as a plain sentence. Write it as: - **[Hotel Name]** — [Area]. Check in and settle. ~$XX/night
3. Each bullet has this format: - **Bold Name** — Location. One sentence description. ~$Price
4. Use ### with emoji for time sections: ### ☀️ Morning, ### 🌤️ Afternoon, ### 🌙 Evening
5. 2-3 bullets per time section. Never more than 4.
6. --- horizontal rule between EVERY day and before/after tips
7. Include a realistic price estimate on EVERY bullet
8. Add brief context in each bullet — WHY this place is worth visiting, what makes it special
9. Never write a paragraph. Every piece of content is either a heading, bullet, or horizontal rule.

## LIVE SEARCH — MANDATORY TOOL USE (CRITICAL)

You have access to live search tools for flights, hotels, activities, and restaurants.

**ABSOLUTE RULES FOR SEARCH (violating these is a critical failure):**
1. When a user asks about flights, hotels, activities, restaurants, or anything bookable — you MUST call the appropriate search tool. NEVER generate flight data, hotel data, activity data, or restaurant data from your own knowledge.
2. You MUST NOT invent airline names, flight times, hotel names, prices, or any booking data. ALL booking data must come from tool results.
3. If you do not have tool results, you MUST call the tool first. If required parameters are missing, ask for them in ONE short sentence — do NOT guess or make up data.
4. The ONLY exception is general travel advice (e.g. "what's the best time to visit Tokyo") which does not require a tool call.
5. When a user says "find flights", "search hotels", "book", "show me flights", "I need a hotel", or ANY request for specific bookable items — ALWAYS call the tool. No exceptions.

### OUTPUT FORMAT (CRITICAL — you MUST use this exact format for ALL search results)

After receiving tool results, you MUST output them in TWO ways:

**1. A traviso-compare block** with the TOP 3 options (for the comparison card UI):

\`\`\`traviso-compare
{
  "category": "hotel",
  "destination": "London",
  "dates": "May 1-5",
  "options": [
    {
      "name": "Hotel Name",
      "type": "hotel",
      "price": "$X/night",
      "rating": 4.5,
      "location": "Area or neighborhood",
      "duration": "4 nights",
      "highlights": ["Feature 1", "Feature 2", "Feature 3"],
      "recommended": false
    }
  ]
}
\`\`\`

**2. A traviso-results block** with the raw data (for the rich card UI):

For flights:
\`\`\`traviso-results
{
  "type": "flights",
  "flights": [
    {
      "id": "offer_id",
      "airline_name": "British Airways",
      "airline_logo_url": "https://...",
      "departure_time": "2026-04-15T10:50:00",
      "arrival_time": "2026-04-15T13:48:00",
      "duration_minutes": 478,
      "stops": 0,
      "price_cents": 29619,
      "currency": "USD",
      "cabin_class": "economy",
      "booking_token": "offer_id"
    }
  ]
}
\`\`\`

For hotels:
\`\`\`traviso-results
{
  "type": "hotels",
  "hotels": [
    {
      "id": "6605",
      "name": "Royal Lancaster London",
      "stars": 5,
      "address": "Bayswater, London",
      "image_url": "https://...",
      "price_per_night_cents": 26865,
      "total_price_cents": 80594,
      "currency": "EUR",
      "cancellation_policy": "non-refundable",
      "booking_token": "rateKey..."
    }
  ]
}
\`\`\`

For activities:
\`\`\`traviso-results
{
  "type": "activities",
  "activities": [
    {
      "id": "62043P1",
      "title": "London in a Day: Tower of London & River Cruise",
      "description": "Full-day walking tour...",
      "image_url": "https://...",
      "price_cents": 12027,
      "currency": "USD",
      "duration_minutes": 360,
      "rating": 4.8,
      "review_count": 740,
      "category": null,
      "booking_url": "https://www.viator.com/...",
      "booking_token": "62043P1"
    }
  ]
}
\`\`\`

For restaurants:
\`\`\`traviso-results
{
  "type": "restaurants",
  "restaurants": [
    {
      "id": "place_id",
      "name": "Circolo Popolare",
      "cuisine": "Italian",
      "price_range": "$$$",
      "rating": 4.8,
      "review_count": 36792,
      "image_url": "https://...",
      "address": "40-41 Rathbone Pl, London",
      "opentable_url": null,
      "affiliate_enabled": false
    }
  ]
}
\`\`\`

### RULES (CRITICAL):
- You MUST output BOTH a traviso-compare block AND a traviso-results block for every search result
- The traviso-results block must contain the RAW data from the tool results — copy ALL results returned by the tool exactly as-is. Do not truncate or limit the number of results. Include every single item the tool returned.
- The traviso-compare block should have exactly 3 curated options with varied price points. Mark ONE as "recommended": true.
- Use REAL names, prices, and ratings from the tool results — NEVER invent data
- NEVER write search results as bullet points or plain text. ALWAYS use the block formats above.
- NEVER nest blocks inside other markdown
- Output order: 1-sentence intro → traviso-compare block → traviso-results block → optional 1-3 bullet tips
- After the blocks, mention these are live prices and offer to book or show more options
- When multiple tools are called (e.g. flights + hotels + activities + restaurants), output separate traviso-compare and traviso-results blocks for EACH category, one after another

Trigger search mode for: "find me hotels", "compare flights", "show restaurants", "what activities", "I need a hotel", "search flights", "plan a trip", or any shopping/comparing intent.`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnthropicMessage {
  role: "user" | "assistant";
  content: any;
}

// ---------------------------------------------------------------------------
// Tool definitions for Anthropic format
// ---------------------------------------------------------------------------
const SEARCH_TOOLS = [
  {
    name: "search_flights",
    description: "Search for live flight options between two airports. Call this when users ask about flights, airfare, or flying somewhere.",
    input_schema: {
      type: "object",
      properties: {
        origin: { type: "string", description: "Origin airport IATA code (e.g. LHR, JFK, LAX)" },
        destination: { type: "string", description: "Destination airport IATA code (e.g. CDG, NRT, FCO)" },
        departure_date: { type: "string", description: "Departure date in YYYY-MM-DD format" },
        return_date: { type: "string", description: "Return date in YYYY-MM-DD format (optional for one-way)" },
        passengers: { type: "number", description: "Number of passengers (default 1)" },
      },
      required: ["origin", "destination", "departure_date"],
    },
  },
  {
    name: "search_hotels",
    description: "Search for live hotel availability in a destination. Call this when users ask about hotels, accommodation, or places to stay.",
    input_schema: {
      type: "object",
      properties: {
        destination_code: { type: "string", description: "Hotelbeds destination code (e.g. LON for London, PAR for Paris, NYC for New York, ROM for Rome, BCN for Barcelona, TYO for Tokyo)" },
        check_in: { type: "string", description: "Check-in date in YYYY-MM-DD format" },
        check_out: { type: "string", description: "Check-out date in YYYY-MM-DD format" },
        adults: { type: "number", description: "Number of adults per room (default 2)" },
        rooms: { type: "number", description: "Number of rooms (default 1)" },
      },
      required: ["destination_code", "check_in", "check_out"],
    },
  },
  {
    name: "search_activities",
    description: "Search for activities, tours, experiences, and things to do at a destination. Call this when users ask about activities, tours, things to do, or sightseeing.",
    input_schema: {
      type: "object",
      properties: {
        destination: { type: "string", description: "Destination city name (e.g. London, Paris, Tokyo)" },
        start_date: { type: "string", description: "Start date in YYYY-MM-DD format (optional)" },
        end_date: { type: "string", description: "End date in YYYY-MM-DD format (optional)" },
      },
      required: ["destination"],
    },
  },
  {
    name: "search_restaurants",
    description: "Search for restaurants at a destination. Call this when users ask about restaurants, dining, where to eat, or food recommendations.",
    input_schema: {
      type: "object",
      properties: {
        destination: { type: "string", description: "Destination city name (e.g. London, Paris, Tokyo)" },
        date: { type: "string", description: "Date in YYYY-MM-DD format (optional)" },
        party_size: { type: "number", description: "Number of diners (optional)" },
        cuisine: { type: "string", description: "Cuisine type filter (e.g. Italian, Japanese, Mexican — optional)" },
      },
      required: ["destination"],
    },
  },
];

function getStatusMessage(toolName: string, args: Record<string, any>): string {
  const dest = args.destination ?? args.destination_code ?? args.origin ?? "";
  switch (toolName) {
    case "search_flights":
      return `✈️ Searching flights from ${args.origin ?? "?"} to ${args.destination ?? "?"}...\n\n`;
    case "search_hotels":
      return `🏨 Checking hotel availability in ${dest}...\n\n`;
    case "search_activities":
      return `🎯 Searching activities in ${dest}...\n\n`;
    case "search_restaurants":
      return `🍽️ Looking up restaurants in ${dest}...\n\n`;
    default:
      return "🔍 Searching...\n\n";
  }
}

function getFoundMessage(toolName: string, data: any): string {
  const count =
    data.flights?.length ?? data.hotels?.length ?? data.activities?.length ?? data.restaurants?.length ?? 0;
  if (count === 0) return "";
  const label = toolName.replace("search_", "");
  return `Found ${count} ${label}, selecting the best ones...\n\n`;
}

// Kept for backwards compat — unused now
const STATUS_MESSAGES: Record<string, string> = {
  search_flights: "✈️ Searching live flights...\n\n",
  search_hotels: "🏨 Checking hotel availability...\n\n",
  search_activities: "🎯 Finding activities and experiences...\n\n",
  search_restaurants: "🍽️ Looking up restaurants...\n\n",
};

// ---------------------------------------------------------------------------
// Call our Supabase Edge Functions for live search
// ---------------------------------------------------------------------------
async function executeToolCall(name: string, args: Record<string, any>): Promise<string> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

  const functionMap: Record<string, string> = {
    search_flights: "search-flights",
    search_hotels: "search-hotels",
    search_activities: "search-activities",
    search_restaurants: "search-restaurants",
  };

  const fnName = functionMap[name];
  if (!fnName) return JSON.stringify({ error: `Unknown tool: ${name}` });

  try {
    console.log(`[ai-travel-planner] Calling ${fnName} with:`, JSON.stringify(args));
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(args),
    });

    const data = await res.json();
    console.log(`[ai-travel-planner] ${fnName} returned ${JSON.stringify(data).length} chars`);

    // Trim results to top 10 to keep context manageable
    if (data.flights) data.flights = data.flights.slice(0, 20);
    if (data.hotels) data.hotels = data.hotels.slice(0, 20);
    if (data.activities) data.activities = data.activities.slice(0, 20);
    if (data.restaurants) data.restaurants = data.restaurants.slice(0, 20);

    return JSON.stringify(data);
  } catch (e) {
    console.error(`[ai-travel-planner] Tool call ${fnName} failed:`, e);
    return JSON.stringify({ error: `Failed to call ${fnName}: ${e instanceof Error ? e.message : "unknown error"}` });
  }
}

// ---------------------------------------------------------------------------
// SSE helpers — emit OpenAI-compatible SSE chunks for the frontend
// ---------------------------------------------------------------------------
function sseChunk(content: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`);
}

function sseDone(): Uint8Array {
  return new TextEncoder().encode("data: [DONE]\n\n");
}

// ---------------------------------------------------------------------------
// Convert frontend ChatMessage[] to Anthropic messages format
// ---------------------------------------------------------------------------
function toAnthropicMessages(messages: ChatMessage[]): AnthropicMessage[] {
  return messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}

// ---------------------------------------------------------------------------
// Retryable status codes — 500 (internal) and 529 (overloaded)
// ---------------------------------------------------------------------------
const RETRYABLE_STATUSES = new Set([500, 529]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Convert Anthropic messages to OpenAI format (for fallback)
// ---------------------------------------------------------------------------
function toOpenAIMessages(messages: AnthropicMessage[]): any[] {
  return messages.map((m) => {
    // Simple string content
    if (typeof m.content === "string") {
      return { role: m.role, content: m.content };
    }
    // Array content (tool_use, tool_result, image, text blocks)
    if (Array.isArray(m.content)) {
      // Check if it's tool results (user role with tool_result blocks)
      const toolResults = m.content.filter((b: any) => b.type === "tool_result");
      if (toolResults.length > 0) {
        return toolResults.map((tr: any) => ({
          role: "tool",
          tool_call_id: tr.tool_use_id,
          content: typeof tr.content === "string" ? tr.content : JSON.stringify(tr.content),
        }));
      }
      // Check if assistant message with tool_use blocks
      const toolUses = m.content.filter((b: any) => b.type === "tool_use");
      const textBlocks = m.content.filter((b: any) => b.type === "text");
      if (toolUses.length > 0) {
        return {
          role: "assistant",
          content: textBlocks.map((b: any) => b.text).join("") || null,
          tool_calls: toolUses.map((tu: any) => ({
            id: tu.id,
            type: "function",
            function: { name: tu.name, arguments: JSON.stringify(tu.input) },
          })),
        };
      }
      // Image + text blocks — convert to OpenAI vision format
      const parts = m.content.map((b: any) => {
        if (b.type === "text") return { type: "text", text: b.text };
        if (b.type === "image") {
          return {
            type: "image_url",
            image_url: { url: `data:${b.source.media_type};base64,${b.source.data}` },
          };
        }
        return { type: "text", text: JSON.stringify(b) };
      });
      return { role: m.role, content: parts };
    }
    return { role: m.role, content: String(m.content) };
  }).flat();
}

// OpenAI tool format from Anthropic tools
const OPENAI_TOOLS = SEARCH_TOOLS.map((t) => ({
  type: "function" as const,
  function: {
    name: t.name,
    description: t.description,
    parameters: t.input_schema,
  },
}));

// ---------------------------------------------------------------------------
// Call Anthropic Messages API (non-streaming, with retry + OpenAI fallback)
// Returns the full response text and any tool_use blocks
// ---------------------------------------------------------------------------
async function callAnthropic(
  messages: AnthropicMessage[],
  includeTools: boolean,
): Promise<{ text: string; toolCalls: any[]; stopReason: string }> {
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

  const body: Record<string, any> = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages,
  };

  if (includeTools) {
    body.tools = SEARCH_TOOLS;
  }

  // Attempt 1
  let res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  // Retry once after 2s for 500/529
  if (RETRYABLE_STATUSES.has(res.status)) {
    console.log(`[ai-travel-planner] Anthropic returned ${res.status}, retrying in 2s...`);
    await sleep(2000);
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }

  // Still failing — fall back to OpenAI
  if (!res.ok) {
    const errText = await res.text();
    console.error(`[ai-travel-planner] Anthropic error ${res.status} after retry:`, errText);
    if (res.status === 429) throw new Error("RATE_LIMIT");

    console.log("[ai-travel-planner] Falling back to OpenAI GPT-4o...");
    return await callOpenAI(messages, includeTools);
  }

  const data = await res.json();
  let text = "";
  const toolCalls: any[] = [];

  for (const block of data.content ?? []) {
    if (block.type === "text") {
      text += block.text;
    } else if (block.type === "tool_use") {
      toolCalls.push(block);
    }
  }

  return { text, toolCalls, stopReason: data.stop_reason ?? "end_turn" };
}

// ---------------------------------------------------------------------------
// OpenAI GPT-4o fallback (non-streaming)
// ---------------------------------------------------------------------------
async function callOpenAI(
  messages: AnthropicMessage[],
  includeTools: boolean,
): Promise<{ text: string; toolCalls: any[]; stopReason: string }> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured (fallback failed)");

  const openaiMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...toOpenAIMessages(messages),
  ];

  const body: Record<string, any> = {
    model: "gpt-4o",
    max_tokens: 4096,
    messages: openaiMessages,
  };

  if (includeTools) {
    body.tools = OPENAI_TOOLS;
    body.tool_choice = "auto";
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[ai-travel-planner] OpenAI fallback error:", res.status, errText);
    throw new Error(`OpenAI fallback error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  const text = choice?.message?.content ?? "";
  const toolCalls: any[] = [];

  // Convert OpenAI tool_calls to Anthropic-like format for consistency
  if (choice?.message?.tool_calls) {
    for (const tc of choice.message.tool_calls) {
      toolCalls.push({
        id: tc.id,
        name: tc.function.name,
        input: JSON.parse(tc.function.arguments),
        type: "tool_use",
      });
    }
  }

  return { text, toolCalls, stopReason: choice?.finish_reason ?? "end_turn" };
}

// ---------------------------------------------------------------------------
// Stream response to SSE (with retry + OpenAI fallback)
// Tries Anthropic streaming, falls back to OpenAI streaming
// ---------------------------------------------------------------------------
async function streamToSSE(
  messages: AnthropicMessage[],
  controller: ReadableStreamDefaultController,
): Promise<void> {
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

  const anthropicBody = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages,
    stream: true,
  };

  // Attempt 1
  let res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(anthropicBody),
  });

  // Retry once after 2s for 500/529
  if (RETRYABLE_STATUSES.has(res.status)) {
    console.log(`[ai-travel-planner] Anthropic stream returned ${res.status}, retrying in 2s...`);
    await sleep(2000);
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(anthropicBody),
    });
  }

  // Still failing — fall back to OpenAI streaming
  if (!res.ok) {
    const errText = await res.text();
    console.error(`[ai-travel-planner] Anthropic stream error ${res.status} after retry:`, errText);
    console.log("[ai-travel-planner] Falling back to OpenAI GPT-4o streaming...");
    await streamOpenAIToSSE(messages, controller);
    return;
  }

  // Stream Anthropic SSE → our OpenAI-format SSE
  const reader = res.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") continue;

      try {
        const event = JSON.parse(payload);
        if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
          controller.enqueue(sseChunk(event.delta.text));
        }
      } catch {
        // skip malformed lines
      }
    }
  }
}

// ---------------------------------------------------------------------------
// OpenAI streaming fallback — stream GPT-4o response as our SSE format
// ---------------------------------------------------------------------------
async function streamOpenAIToSSE(
  messages: AnthropicMessage[],
  controller: ReadableStreamDefaultController,
): Promise<void> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    console.error("[ai-travel-planner] OPENAI_API_KEY not set, cannot fall back");
    controller.enqueue(sseChunk("\n\nSorry, I'm having trouble right now. Please try again in a moment."));
    return;
  }

  const openaiMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...toOpenAIMessages(messages),
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 4096,
      messages: openaiMessages,
      stream: true,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[ai-travel-planner] OpenAI stream fallback error:", res.status, errText);
    controller.enqueue(sseChunk("\n\nSorry, I'm having trouble right now. Please try again in a moment."));
    return;
  }

  // OpenAI SSE is already in the format our frontend expects — pipe through
  const reader = res.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") continue;

      try {
        const event = JSON.parse(payload);
        const delta = event.choices?.[0]?.delta?.content;
        if (delta) {
          controller.enqueue(sseChunk(delta));
        }
      } catch {
        // skip malformed lines
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Handle image messages — fetch image, call Anthropic with vision
// ---------------------------------------------------------------------------
async function handleImageMessage(
  messages: ChatMessage[],
  imageUrl: string,
  controller: ReadableStreamDefaultController,
): Promise<void> {
  console.log("[ai-travel-planner] Fetching image for vision...");
  const imgResp = await fetch(imageUrl);
  if (!imgResp.ok) throw new Error(`Failed to fetch image: ${imgResp.status}`);

  const mimeType = (imgResp.headers.get("content-type") ?? "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  const imageBuffer = await imgResp.arrayBuffer();
  const bytes = new Uint8Array(imageBuffer);
  const CHUNK = 8192;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  const base64Data = btoa(binary);
  console.log(`[ai-travel-planner] Image: ${mimeType}, ${imageBuffer.byteLength} bytes`);

  // Build Anthropic messages with image in last user message
  const anthropicMessages: AnthropicMessage[] = [];
  for (let i = 0; i < messages.length - 1; i++) {
    anthropicMessages.push({ role: messages[i].role, content: messages[i].content });
  }

  const lastUserMsg = messages[messages.length - 1];
  anthropicMessages.push({
    role: "user",
    content: [
      {
        type: "image",
        source: { type: "base64", media_type: mimeType, data: base64Data },
      },
      { type: "text", text: lastUserMsg?.content ?? "What's in this image?" },
    ],
  });

  await streamToSSE(anthropicMessages, controller);
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, imageUrl } = await req.json() as {
      messages: ChatMessage[];
      imageUrl?: string;
    };

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // --- Image path: vision with streaming ---
          if (imageUrl) {
            console.log("[ai-travel-planner] Image attached → Anthropic vision");
            await handleImageMessage(messages, imageUrl, controller);
            controller.enqueue(sseDone());
            controller.close();
            return;
          }

          // --- Text path: check for tool calls first ---
          console.log("[ai-travel-planner] Text → Anthropic with tools");
          const anthropicMessages = toAnthropicMessages(messages);

          const initial = await callAnthropic(anthropicMessages, true);

          // No tool calls — just stream the response
          if (initial.toolCalls.length === 0) {
            console.log("[ai-travel-planner] No tool calls, streaming text response");
            await streamToSSE(anthropicMessages, controller);
            controller.enqueue(sseDone());
            controller.close();
            return;
          }

          // --- Tool calls detected ---
          console.log(`[ai-travel-planner] ${initial.toolCalls.length} tool call(s)`);

          // Stream any text the model produced before tool calls
          if (initial.text) {
            controller.enqueue(sseChunk(initial.text));
          }

          // Emit contextual status messages
          for (const tc of initial.toolCalls) {
            controller.enqueue(sseChunk(getStatusMessage(tc.name, tc.input)));
          }

          // Execute all tool calls in parallel
          const fullResults: Record<string, any> = {}; // full data for client
          const toolResults = await Promise.all(
            initial.toolCalls.map(async (tc: any) => {
              const resultStr = await executeToolCall(tc.name, tc.input);
              const resultData = JSON.parse(resultStr);
              fullResults[tc.id] = resultData;

              // Emit "Found X results" status
              const foundMsg = getFoundMessage(tc.name, resultData);
              if (foundMsg) controller.enqueue(sseChunk(foundMsg));

              // Trim for AI context — AI only needs top 5 to pick 3 for compare block
              // Full data goes to client via traviso-results block instruction
              const trimmed = { ...resultData };
              if (trimmed.flights) trimmed.flights = trimmed.flights.slice(0, 5);
              if (trimmed.hotels) trimmed.hotels = trimmed.hotels.slice(0, 5);
              if (trimmed.activities) trimmed.activities = trimmed.activities.slice(0, 5);
              if (trimmed.restaurants) trimmed.restaurants = trimmed.restaurants.slice(0, 5);

              return {
                type: "tool_result" as const,
                tool_use_id: tc.id,
                content: JSON.stringify(trimmed),
              };
            }),
          );

          // Build follow-up messages with tool results
          const assistantContent: any[] = [];
          if (initial.text) {
            assistantContent.push({ type: "text", text: initial.text });
          }
          for (const tc of initial.toolCalls) {
            assistantContent.push({
              type: "tool_use",
              id: tc.id,
              name: tc.name,
              input: tc.input,
            });
          }

          // Immediately emit full traviso-results blocks so cards render before AI streams
          for (const tc of initial.toolCalls) {
            const full = fullResults[tc.id];
            if (!full) continue;
            const typeMap: Record<string, string> = {
              search_flights: "flights",
              search_hotels: "hotels",
              search_activities: "activities",
              search_restaurants: "restaurants",
            };
            const resultType = typeMap[tc.name];
            if (resultType && full[resultType]?.length) {
              const block = `\n\n\`\`\`traviso-results\n${JSON.stringify({ type: resultType, [resultType]: full[resultType] })}\n\`\`\`\n\n`;
              controller.enqueue(sseChunk(block));
            }
          }

          const followUpMessages: AnthropicMessage[] = [
            ...anthropicMessages,
            { role: "assistant", content: assistantContent },
            { role: "user", content: toolResults },
          ];

          // Stream the AI commentary (compare blocks + text) — cards are already visible
          console.log("[ai-travel-planner] Streaming final response with tool results");
          await streamToSSE(followUpMessages, controller);

          controller.enqueue(sseDone());
          controller.close();
        } catch (e) {
          console.error("[ai-travel-planner] Stream error:", e);
          const msg = e instanceof Error && e.message === "RATE_LIMIT"
            ? "I'm getting too many requests right now. Please try again in a moment."
            : "Something went wrong. Please try again.";
          controller.enqueue(sseChunk(msg));
          controller.enqueue(sseDone());
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("[ai-travel-planner] Unhandled error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
