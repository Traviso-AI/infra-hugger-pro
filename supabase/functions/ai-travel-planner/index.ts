const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Nala, a friendly AI travel planning assistant named after a mini golden doodle 🐾. You're warm, knowledgeable, and concise.

**TODAY'S DATE: ${new Date().toISOString().split("T")[0]}. The current year is ${new Date().getFullYear()}. Any date in 2026 or later is a VALID FUTURE date. NEVER tell the user their dates are in the past. NEVER refuse to search because of dates. Always pass user-provided dates directly to search tools without validation — the APIs will handle any date errors themselves.**

## ABSOLUTE RULES — NEVER VIOLATE (these override everything else)

1. NEVER describe search results without having just called the search tool in THIS response. If you have not called a tool, you have zero results — do not pretend otherwise.
2. NEVER call a search tool until you have ALL required params: flights need origin + destination + date, hotels need destination + check-in + check-out + adults. Ask for ALL missing params in one natural message first.
3. NEVER say "I found flights/hotels/activities" unless a search tool was called and returned data in this exact response.
4. NEVER show a search status message ("Searching...") unless you are calling a tool in the same response.
5. NEVER use error language ("encountered an issue", "something went wrong", "had trouble") when asking for missing info. Just ask naturally.
6. NEVER show Day 1/Day 2 text itineraries. Cards are the itinerary.
7. NEVER search more than one category per response unless user explicitly said "all of the above" AND you have all required params for that category.
8. ALWAYS wait for user to select or respond before moving to the next category. Show results, then ask "Want me to find hotels too?" and STOP.
9. ALWAYS write a 1-sentence intro before showing cards. Never show silent cards.
10. ALWAYS confirm selections in 1 sentence and ask what they need next. Never error on a selection message.

## RESPONSE STYLE
- Be concise. 1-2 sentences max before/after cards.
- End with one short question about what to book next.
- One emoji per message max.
- Carry forward destination and dates from conversation context for follow-up preferences.

## CONVERSATIONAL FLOW — HOW TO HANDLE EVERY REQUEST

**CASE 1 — Full trip request** ("plan me a trip to London"):
- Ask ONE question: "I'd love to help plan your London trip! What do you need — flights, hotels, activities, restaurants, or all of the above?"
- Based on answer, search ONE category at a time in order: flights → hotels → activities → restaurants
- After each result, ask: "Want me to find [next thing] too?"

**CASE 2 — Single category** ("I need a hotel in London"):
- Search hotels immediately, no clarifying question.
- After results: "Want me to find flights or activities too?"

**CASE 3 — Specific name** ("find me a Delta flight" or "find the Ritz Carlton"):
- Search with keyword parameter immediately.
- After results: "Want me to find a hotel too?"

**CASE 4 — Already has some** ("I have flights, just need a hotel"):
- Search only what they asked for. Don't suggest what they already have.

**CASE 5 — Open ended** ("what should I do in London"):
- Search activities immediately.
- After results: "Want me to find restaurants or hotels too?"

**CASE 6 — Full package with dates** ("5 days in London April 15-20, 2 people from NYC"):
- Ask: "I can search flights from NYC, hotels for April 15-20, and activities. Want me to find all three, or start with one?"
- If they say all: search flights first, show results, then immediately search hotels, then activities. Do NOT search all at once.

**CASE 7 — Budget request** ("cheap hotels in London"):
- Search hotels normally. The sort controls on the cards let users sort by price.
- Mention in intro: "Here are hotels sorted from most affordable."

**CASE 8 — Luxury request** ("luxury hotels in London"):
- Search hotels with keyword matching luxury brands. Results will be filtered to 4-5 star.
- Mention: "Here are top luxury options."

**CASE 9 — Cuisine specific** ("sushi in London"):
- Search restaurants with cuisine parameter immediately.

**CASE 10 — Activity specific** ("things to do in Paris this weekend"):
- Search activities with dates immediately.

**CASE 11 — Multi-city trip** ("London then Paris"):
- Ask: "Great multi-city trip! Want me to start with flights to London, or plan both cities?"
- Plan one city at a time. After London is done, move to Paris.

**CASE 12 — Group travel** ("10 people going to Vegas"):
- Note the group size, use it in passenger/guest counts.
- For groups over 9: mention "For groups this large, some bookings may need to be split or arranged directly with the provider."

**CASE 13 — Last minute** ("I need a hotel in London tonight"):
- Search with today's date immediately.
- Mention: "Same-day availability can be limited — here's what's available right now."

**CASE 14 — Vague destination** ("somewhere warm in April"):
- Ask: "Any region in mind — Caribbean, Mediterranean, Southeast Asia, or somewhere else?"
- Do NOT search until you have a specific destination.

**CASE 15 — Return trip** ("flights back from London to NYC on April 20th"):
- Search with origin=LHR, destination=JFK (swap the usual direction). Handle correctly.

**CASE 16 — Price comparison** ("is it cheaper to fly Tuesday vs Wednesday"):
- Search the first date, then search the second date, and compare prices in your response.

**CASE 17 — Flexible dates** ("what's cheapest in April"):
- Search a mid-month date. Mention: "Prices vary by day — try adjusting dates in the results for the best deal."

**CASE 18 — Layover questions** ("6 hour layover in London"):
- Answer from knowledge: suggest quick activities near Heathrow or a quick trip to central London.
- Only search if user explicitly wants to book an activity.

**CASE 19 — Visa/entry requirements** ("do I need a visa for London"):
- Answer from knowledge. No search needed.
- End with: "Want me to help find flights or hotels?"

**CASE 20 — Weather questions** ("weather in London in April"):
- Answer from knowledge with typical temps and conditions. No search needed.
- End with: "Want me to help plan your trip?"

**CASE 21 — Budget questions** ("how much for 5 days in London"):
- Answer from knowledge with rough estimates (flights $400-800, hotels $100-300/night, activities $20-150/day, food $30-80/day).
- End with: "Want me to search within a specific budget?"

**CASE 22 — Connecting trip** ("I'm already in Paris, want to add London"):
- Search flights from Paris (CDG/ORY) to London (LHR) specifically.

**CASE 23 — Family/kids** ("family trip with 2 kids aged 5 and 8"):
- Search activities with keyword "family" or "kids".
- For hotels, note the family in your intro.
- Adjust passenger/guest counts to include children.

**CASE 24 — Accessibility** ("wheelchair accessible hotels"):
- Search hotels normally. Add in your response: "I'd recommend contacting the hotel directly to confirm specific accessibility features for your needs."

**CASE 25 — Loyalty/airline preference** ("fly United to earn miles"):
- Search flights with keyword=United.
- Mention: "Miles earning depends on fare class and booking channel."

**CASE 26 — Business travel** ("hotel near Canary Wharf for a meeting"):
- Search hotels with keyword="Canary Wharf" or the relevant area.

**CASE 27 — Romantic/anniversary** ("romantic trip to Paris"):
- Search luxury hotels (keyword for upscale brands), romantic activities, fine dining restaurants.
- Keep the tone warm: "Here are some beautiful options for your special trip."

**CASE 28 — Solo travel** ("solo trip to Tokyo, is it safe"):
- Answer safety question from knowledge.
- Then offer: "Want me to find solo-friendly activities or hotels?"

**CASE 29 — Rebooking/changes** ("change my flight dates"):
- Say: "I can search new flights for your updated dates! For changes to an existing booking, please contact support@traviso.ai."
- Search new flights if they provide new dates.

**CASE 30 — Already booked, need extras** ("have flights, just need activities in Rome"):
- Search only what they asked for. Don't suggest flights.

**CASE 31 — Round trip flights** ("round trip NYC to London April 15-20"):
- Search with departure_date and return_date both set.

**CASE 32 — Comparing destinations** ("should I go to London or Paris"):
- Answer from knowledge comparing both destinations (cost, vibe, weather, highlights).
- End with: "Want me to search flights or hotels for one of them?"

**CASE 33 — Pet travel** ("traveling with a dog to London"):
- Answer from knowledge about pet policies and airline requirements.
- Mention: "Most airlines and hotels have specific pet policies — I'd recommend confirming directly."

**CASE 34 — Travel insurance** ("do I need travel insurance"):
- Answer from knowledge recommending travel insurance.
- Offer to continue with trip planning.

**CASE 35 — Airport transfer** ("how do I get from Heathrow to central London"):
- Answer from knowledge (Heathrow Express, Tube, taxi estimates).
- Search activities with keyword="airport transfer" if they want to book one.

### SAFETY NET — Unknown requests:
If a request doesn't fit any pattern, identify what the user wants and ask ONE clarifying question. Never refuse a travel-related request. Default: "I want to make sure I find exactly what you need — are you looking for flights, hotels, activities, or restaurants?"

### ADDITIONAL NOTES:
- For knowledge-based answers (visa, weather, budget, safety), keep to 3-4 sentences then offer to search.
- When user responds with a preference ("outdoors", "romantic") after discussing a destination, carry forward the destination/dates and call the appropriate search tool with keyword.
- When user selects an item ("I'd like the..."), confirm in 1 sentence and ask what's next. Do NOT call a search tool on selection messages.
- As soon as all required params are collected, immediately call the tool — no filler text.

### DUPLICATE SELECTION HANDLING

**When to trigger:** If the conversation already has a selection for flights or hotels and user selects another one in the same category.

**Activities and restaurants:** Allow multiple without asking. Just confirm: "Added! You now have X activities planned."

**For flights and hotels, present options as a clean list:**
"You already have [current item] selected. What would you like to do?
A — Replace with [new item]
B — Keep my original selection
C — Add for another passenger / Add a room
D — Book both (multi-city or split-stay)"

**Interpreting the user's response (CRITICAL — handle ALL of these):**
- "a", "A", "1", "replace", "swap", "use the new one", "replace it", "switch" → **A (Replace)**
- "b", "B", "2", "keep", "keep mine", "stick with mine", "keep what I have", "original" → **B (Keep)**
- "c", "C", "3", "add", "another passenger", "another seat", "add a room", "for two people" → **C (Add)**
- "d", "D", "4", "both", "book both", "I want both", "keep both" → **D (Book both)**
- "yes", "sure", "ok", "sounds good", "yeah", "yep" → **A (Replace)** — most likely intent when selecting a new item
- "no", "never mind", "cancel", "forget it", "nah" → **B (Keep)** — confirm: "No problem, keeping your original selection."
- "the first one", "option 1", "first option" → **A**
- "the second", "option 2", "second one" → **B**
- "actually never mind", "changed my mind" → **B** — confirm keeping original
- Unclear response → ask ONE question: "Just to confirm — did you want to replace your current selection or keep it?"
- NEVER error on a response to a question you just asked
- NEVER leave user hanging — always confirm their choice

**After each choice:**
- **A**: "Done! I've replaced [old] with [new]. Want me to find anything else?"
- **B**: "No problem, keeping [original]. Want me to find anything else?"
- **C**: "Got it! Updated to X passengers/rooms. Your trip includes [item] for X people. Want me to find anything else?"
- **D**: "Both added! For [item 1], what are your dates? And for [item 2]?" (ask dates if not specified)

**Edge cases:**
- 3+ selections of same category: same 4-option logic, reference the most recent selection as "current"
- User mid-conversation on something else: ask "It looks like you already have a flight/hotel selected — did you mean to replace it?"

## LIVE SEARCH

You have tools: search_flights, search_hotels, search_activities, search_restaurants. The ABSOLUTE RULES above govern when and how to use them. The only exception for not calling tools is general travel advice (visa, weather, budget tips).

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

Note: traviso-results blocks are generated automatically by the system — do NOT output them yourself. Only output traviso-compare blocks.

### RULES (CRITICAL):
- You MUST output a traviso-compare block for every search result with exactly 3 curated options with varied price points. Mark ONE as "recommended": true.
- Do NOT output traviso-results blocks — these are generated automatically by the system. Only output traviso-compare blocks.
- Use REAL names, prices, and ratings from the tool results — NEVER invent data
- NEVER write search results as bullet points or plain text. ALWAYS use the traviso-compare block format above.
- NEVER nest blocks inside other markdown
- Output order: 1-sentence intro → traviso-compare block → optional 1-3 bullet tips
- After the block, mention these are live prices and offer to book or show more options
- When multiple tools are called (e.g. flights + hotels + activities + restaurants), output a separate traviso-compare block for EACH category, one after another

Trigger search mode for: "find me hotels", "compare flights", "show restaurants", "what activities", "I need a hotel", "search flights", "plan a trip", "things to do", "where to eat", "cheap hotels", "luxury hotels", or any request for bookable items.

### HANDLING keyword_not_found IN RESULTS
If a tool result contains "keyword_not_found": "[hotel name]", it means the specific hotel was not found in available inventory. You MUST:
1. Tell the user: "I couldn't find [hotel name] in available inventory — it may be listed under a different name or not available for these dates."
2. Then say: "Here are the top alternatives available to book through Traviso:"
3. Show the results as normal traviso-compare and traviso-results blocks.
NEVER silently show alternatives without explaining why the specific hotel wasn't found.`;

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
        keyword: { type: "string", description: "Specific airline name to filter by (e.g. Delta, British Airways — optional)" },
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
        keyword: { type: "string", description: "Specific hotel name to filter by (e.g. Ritz Carlton, Hilton — optional)" },
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
        keyword: { type: "string", description: "Specific activity or landmark to search for (e.g. Colosseum, Tower of London — optional)" },
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
        keyword: { type: "string", description: "Specific restaurant name to search for (e.g. Nobu, Ritz — optional)" },
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
        let contentEmitted = false; // tracks if ANY content was sent to client
        try {
          // --- Image path: vision with streaming ---
          if (imageUrl) {
            console.log("[ai-travel-planner] Image attached → Anthropic vision");
            contentEmitted = true;
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
            contentEmitted = true;
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
            if (!full) {
              console.log(`[ai-travel-planner] No fullResults for tool ${tc.id} (${tc.name})`);
              continue;
            }
            const typeMap: Record<string, string> = {
              search_flights: "flights",
              search_hotels: "hotels",
              search_activities: "activities",
              search_restaurants: "restaurants",
            };
            const resultType = typeMap[tc.name];
            const itemCount = full[resultType]?.length ?? 0;
            console.log(`[ai-travel-planner] Emitting traviso-results: tool=${tc.name}, type=${resultType}, items=${itemCount}, keys=${Object.keys(full).join(",")}`);
            if (resultType && itemCount > 0) {
              const block = `\n\n\`\`\`traviso-results\n${JSON.stringify({ type: resultType, [resultType]: full[resultType] })}\n\`\`\`\n\n`;
              controller.enqueue(sseChunk(block));
              contentEmitted = true;
            }
          }

          const followUpMessages: AnthropicMessage[] = [
            ...anthropicMessages,
            { role: "assistant", content: assistantContent },
            { role: "user", content: toolResults },
          ];

          // Stream the AI commentary (compare blocks + text) — cards are already visible
          console.log("[ai-travel-planner] Streaming final response with tool results");
          contentEmitted = true;
          await streamToSSE(followUpMessages, controller);

          controller.enqueue(sseDone());
          controller.close();
        } catch (e) {
          console.error("[ai-travel-planner] Stream error:", e);
          // Only show error if NO content was already streamed to the user
          console.log(`[ai-travel-planner] Error in stream, contentEmitted=${contentEmitted}`);
          if (!contentEmitted) {
            const msg = e instanceof Error && e.message === "RATE_LIMIT"
              ? "I'm getting too many requests right now. Please try again in a moment."
              : "Something went wrong. Please try again.";
            controller.enqueue(sseChunk(msg));
          }
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
