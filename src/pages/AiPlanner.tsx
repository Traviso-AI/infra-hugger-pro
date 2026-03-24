import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Save, Paperclip, X, FileText, Image } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { NalaAvatar } from "@/components/ai-planner/NalaAvatar";
import { TypingDots } from "@/components/ai-planner/TypingDots";
import { ChatHistoryDrawer } from "@/components/ai-planner/ChatHistoryDrawer";
import { useConversations } from "@/hooks/useConversations";
import { ComparisonCard, parseComparisonBlocks } from "@/components/ai-planner/ComparisonCard";
import type { ComparisonOption } from "@/components/ai-planner/ComparisonCard";
import { SearchResultsBlock, type SearchResultsData } from "@/components/ai-planner/SearchResultsBlock";
import { SearchLoadingCard, detectSearchStatus } from "@/components/ai-planner/SearchLoadingCard";
import type { ComparisonData } from "@/components/ai-planner/ComparisonCard";
import { TripSetupForm } from "@/components/ai-planner/TripSetupForm";
import { TripSummaryCard } from "@/components/ai-planner/TripSummaryCard";
import type { FlightData } from "@/components/ai-planner/FlightCard";
import type { HotelData } from "@/components/ai-planner/HotelCard";
import type { ActivityData } from "@/components/ai-planner/ActivityCard";
import type { RestaurantData } from "@/components/ai-planner/RestaurantCard";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip traviso fenced blocks (complete or incomplete) before ReactMarkdown */
function stripRawBlocks(text: string): string {
  let cleaned = text.replace(/```traviso-(?:compare|results)\s*\n[\s\S]*?```/g, "");
  cleaned = cleaned.replace(/```traviso-(?:compare|results)[\s\S]*$/g, "");
  // Strip raw JSON code blocks (tool call arguments leaking into chat)
  cleaned = cleaned.replace(/```json\s*\n[\s\S]*?```/g, "");
  cleaned = cleaned.replace(/```json[\s\S]*$/g, "");
  // Strip any remaining fenced code blocks that look like JSON objects
  cleaned = cleaned.replace(/```\s*\n\s*\{[\s\S]*?```/g, "");
  return cleaned;
}

/** Strip emoji status lines that the backend streams before tool results */
function stripStatusLines(text: string): string {
  // Use alternation instead of character class — multi-byte emoji break [] without /u flag
  return text
    .replace(/(?:✈️|🏨|🎯|🍽️|🔍)\s*(?:Search(?:ing)?|Check(?:ing)?|Find(?:ing)?|Look(?:ing)?\s*up)[^\n]*\.{3}\n*/gi, "")
    .replace(/Found\s+\d+\s+\w+,?\s*[^\n]*\.{3}\n*/gi, "")
    .trim();
}

/**
 * Parse an assistant message into structured sections for clean rendering.
 * Returns: intro text, all result blocks, all compare blocks, trailing text (tips).
 */
function parseMessageSections(content: string): {
  introText: string;
  results: SearchResultsData[];
  comparisons: ComparisonData[];
  trailingText: string;
} {
  const results: SearchResultsData[] = [];
  const comparisons: ComparisonData[] = [];

  // Extract all traviso-results blocks, deduplicate by type (keep largest)
  const resultsRegex = /```traviso-results\s*\n([\s\S]*?)```/g;
  let match;
  const resultsByType = new Map<string, SearchResultsData>();
  while ((match = resultsRegex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim()) as SearchResultsData;
      const t = parsed.type;
      const items = (parsed as any)[t] as any[] | undefined;
      const existing = resultsByType.get(t);
      const existingLen = existing ? ((existing as any)[t]?.length ?? 0) : 0;
      if (!existing || (items?.length ?? 0) > existingLen) {
        resultsByType.set(t, parsed);
      }
    } catch { /* skip malformed */ }
  }
  results.push(...resultsByType.values());

  // Extract all traviso-compare blocks
  const compareRegex = /```traviso-compare\s*\n([\s\S]*?)```/g;
  while ((match = compareRegex.exec(content)) !== null) {
    try {
      comparisons.push(JSON.parse(match[1].trim()));
    } catch { /* skip malformed */ }
  }

  // Strip all blocks and status lines to get clean text
  let cleanText = content
    .replace(/```traviso-(?:compare|results)\s*\n[\s\S]*?```/g, "")
    .replace(/```traviso-(?:compare|results)[\s\S]*$/g, "");
  cleanText = stripStatusLines(cleanText);

  // Split into intro (before first ---) and trailing (after last ---)
  const hrParts = cleanText.split(/\n---\n/);
  let introText = "";
  let trailingText = "";

  if (hrParts.length >= 2) {
    introText = hrParts[0].trim();
    trailingText = hrParts.slice(1).join("\n---\n").trim();
  } else {
    introText = cleanText.trim();
  }

  return { introText, results, comparisons, trailingText };
}


// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "text/plain"];
const MAX_FILE_SIZE_MB = 10;

type Message = { role: "user" | "assistant"; content: string; aiContent?: string };

interface BriefContext {
  destination: string;
  origin: string;
  departure: string;
  returnDate: string;
  travelers: string;
  needs: string[];
  preferences: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AiPlanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>(() => crypto.randomUUID());
  const [conversationCreated, setConversationCreated] = useState(false);

  // Trip setup
  const [tripSetupDone, setTripSetupDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Booking state
  const [activitiesAdded, setActivitiesAdded] = useState(0);
  const [showDoneActivities, setShowDoneActivities] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<HotelData | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<ActivityData[]>([]);
  const [selectedRestaurants, setSelectedRestaurants] = useState<RestaurantData[]>([]);
  const [tripSessionId, setTripSessionId] = useState<string | null>(null);
  const [showTripSummary, setShowTripSummary] = useState(false);
  const [briefContext, setBriefContext] = useState<BriefContext | null>(null);

  const {
    conversations,
    loading: convsLoading,
    createConversation,
    updateTitle,
    deleteConversation,
    touchConversation,
    refetch,
  } = useConversations();

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [sourceTripId, setSourceTripId] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const initialValues = useMemo(() => {
    const destination = searchParams.get("destination");
    const departure = searchParams.get("departure");
    if (!destination || !departure) return undefined;
    return {
      destination,
      departure,
      returnDate: searchParams.get("return") ?? undefined,
      travelers: searchParams.get("travelers") ?? "2",
      needs: searchParams.get("needs")?.split(",") ?? ["flights", "hotels", "activities"],
      autosubmit: searchParams.get("autosubmit") === "true",
      origin: searchParams.get("origin") ?? undefined,
      curatedHotel: searchParams.get("curatedHotel") ?? undefined,
      curatedActivities: searchParams.get("curatedActivities") ?? undefined,
      priceEstimate: searchParams.get("priceEstimate") ?? undefined,
      sourceTripId: searchParams.get("sourceTripId") ?? undefined,
      creatorId: searchParams.get("creatorId") ?? undefined,
    };
  }, []);

  useEffect(() => {
    if (initialValues?.sourceTripId) {
      setSourceTripId(initialValues.sourceTripId);
    }
  }, []);

  // Smart scroll: only auto-scroll if user is near the bottom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 200) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const loadConversation = useCallback(
    async (id: string) => {
      if (!user) return;
      setConversationId(id);
      setConversationCreated(true);
      const { data } = await supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      setMessages(
        (data as Message[])?.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })) ?? []
      );
    },
    [user]
  );

  const handleNewChat = useCallback(() => {
    const newId = crypto.randomUUID();
    setConversationId(newId);
    setConversationCreated(false);
    setMessages([]);
    setInput("");
  }, []);

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      await deleteConversation(id);
      if (id === conversationId) handleNewChat();
    },
    [deleteConversation, conversationId, handleNewChat]
  );

  const generateTitle = (text: string) => {
    const clean = text.replace(/📎.*?\n/g, "").trim();
    return clean.length > 40 ? clean.slice(0, 40) + "…" : clean || "New Chat";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG, or TXT files are supported.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_FILE_SIZE_MB} MB.`);
      e.target.value = "";
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null);
    }
    e.target.value = "";
  };

  const clearFile = () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
    setSelectedFile(null);
    setFilePreview(null);
  };

  const uploadImageToStorage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${user?.id ?? "anon"}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("trip-images")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from("trip-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const readTextFile = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });

  const detectSocialUrl = (text: string): string | null => {
    const urlRegex = /(https?:\/\/)?(www\.)?(tiktok\.com|instagram\.com|youtube\.com|youtu\.be|twitter\.com|x\.com|reddit\.com|threads\.net)[^\s]*/i;
    const match = text.match(urlRegex);
    if (!match) return null;
    let url = match[0];
    if (!url.startsWith("http")) url = "https://" + url;
    return url;
  };

  const scrapeSocialUrl = async (url: string): Promise<{ content: string | null; failed: boolean }> => {
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-social`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ url }),
        }
      );
      if (!resp.ok) return { content: null, failed: true };
      const data = await resp.json();
      if (data.extractionFailed || (!data.content && !data.title)) {
        return { content: null, failed: true };
      }
      if (data.success && data.content && data.content.trim().length > 0) {
        return {
          content: `📎 [Extracted content from ${url}]:\nTitle: ${data.title || "N/A"}\nDescription: ${data.description || "N/A"}\n\nContent:\n${data.content.slice(0, 8000)}`,
          failed: false,
        };
      }
      return { content: null, failed: true };
    } catch {
      return { content: null, failed: true };
    }
  };

  // ---------------------------------------------------------------------------
  // Send message (core logic, accepts optional override text)
  // ---------------------------------------------------------------------------
  const sendMessageWithText = async (overrideText?: string, opts?: { displayText?: string }) => {
    const directText = overrideText?.trim();
    const hasText = directText ? true : input.trim().length > 0;
    const hasFile = selectedFile !== null;
    if ((!hasText && !hasFile) || loading) return;

    setLoading(true);
    setUploadLoading(hasFile);

    let userText = directText || input.trim();
    let imageUrl: string | undefined;

    const socialUrl = detectSocialUrl(userText);
    if (socialUrl) {
      toast.info("Extracting content from link...");
      const { content: scraped, failed } = await scrapeSocialUrl(socialUrl);
      if (scraped && !failed) {
        toast.success("Content extracted!");
        userText = userText + "\n\n" + scraped + "\n\nPlease extract a trip itinerary from this social media post. Create a detailed day-by-day plan based on the destinations, activities, and recommendations mentioned.";
      } else {
        toast.info("Couldn't read that link directly — Nala will ask you about it.");
        userText = userText + "\n\n[SYSTEM: The user pasted a social media link (" + socialUrl + ") but we could NOT scrape its content. DO NOT guess or assume what destination or content is in the video. Instead, ask the user: 'I wasn't able to read that link directly! 🐾 Could you tell me what destination or trip the video was about? Just give me the highlights and I'll build you an amazing itinerary!']";
      }
    }

    if (selectedFile) {
      try {
        if (selectedFile.type.startsWith("image/")) {
          imageUrl = await uploadImageToStorage(selectedFile);
          userText = userText
            ? `${userText}\n\n📎 [Attached image: ${selectedFile.name}]`
            : `📎 [Attached image: ${selectedFile.name}] — please read this screenshot and build a trip itinerary from the group chat conversation shown.`;
        } else {
          const textContent = await readTextFile(selectedFile);
          userText = userText
            ? `${userText}\n\n📎 [Attached file: ${selectedFile.name}]:\n${textContent.slice(0, 10000)}`
            : `📎 [Attached file: ${selectedFile.name}]:\n${textContent.slice(0, 10000)}\n\nPlease analyze this text and create a trip itinerary if possible.`;
        }
      } catch (err: any) {
        toast.error("Failed to process attachment.");
        setLoading(false);
        setUploadLoading(false);
        return;
      }
      clearFile();
      setUploadLoading(false);
    }

    const displayContent = opts?.displayText ?? userText;
    const userMsg: Message = { role: "user", content: displayContent, ...(opts?.displayText ? { aiContent: userText } : {}) };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      if (!conversationCreated && user) {
        await createConversation(conversationId);
        setConversationCreated(true);
      }

      if (user) {
        await supabase.from("messages").insert({
          user_id: user.id,
          conversation_id: conversationId,
          role: "user",
          content: displayContent,
        });
        touchConversation(conversationId);
      }

      const aiMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.aiContent ?? m.content,
      }));

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-travel-planner`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: aiMessages,
            ...(imageUrl ? { imageUrl } : {}),
          }),
        }
      );

      if (!resp.ok) throw new Error(`AI error (${resp.status})`);

      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      if (reader) {
        const assistantMsg: Message = { role: "assistant", content: "" };
        setMessages((prev) => [...prev, assistantMsg]);
        let loadingCleared = false;

        let sseBuffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = (sseBuffer + chunk).split("\n");
          sseBuffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
            try {
              const json = JSON.parse(line.slice(6));
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                assistantContent += delta;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                  return updated;
                });
                // Clear loading as soon as results block arrives so cards are interactive
                if (!loadingCleared && assistantContent.includes("```\n\n")) {
                  const hasResults = /```traviso-results\s*\n[\s\S]*?```/.test(assistantContent);
                  if (hasResults) {
                    setLoading(false);
                    loadingCleared = true;
                  }
                }
              }
            } catch {}
          }
        }
      }

      if (user && assistantContent) {
        await supabase.from("messages").insert({
          user_id: user.id,
          conversation_id: conversationId,
          role: "assistant",
          content: assistantContent,
        });
      }

      if (messages.length === 0 && userText) {
        updateTitle(conversationId, generateTitle(userText));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to get AI response");
    } finally {
      setLoading(false);
      refetch();
    }
  };

  // Public wrappers
  const sendMessage = () => {
    const text = input.trim();
    if (!text || loading) return;
    sendMessageWithText();
  };

  const sendDirectMessage = (text: string) => {
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    sendMessageWithText(text);
  };

  // ---------------------------------------------------------------------------
  // Trip session persistence
  // ---------------------------------------------------------------------------
  const checkAndShowSummary = (
    newFlight: FlightData | null,
    newHotel: HotelData | null,
    newActivities: ActivityData[],
    newRestaurants: RestaurantData[],
    needs: string[]
  ) => {
    if (needs.length === 0) return;
    const flightDone = !needs.includes("flights") || newFlight !== null;
    const hotelDone = !needs.includes("hotels") || newHotel !== null;
    const activitiesDone = !needs.includes("activities") || newActivities.length > 0;
    const restaurantsDone = !needs.includes("restaurants") || newRestaurants.length > 0;
    const hasBookableItem = newFlight !== null || newHotel !== null || newActivities.length > 0;
    if (flightDone && hotelDone && activitiesDone && restaurantsDone && hasBookableItem) {
      setShowTripSummary(true);
    }
  };

  const upsertTripSession = async (updates: {
    selected_flights?: FlightData[];
    selected_hotels?: HotelData[];
    selected_activities?: ActivityData[];
    selected_restaurants?: RestaurantData[];
    total_amount_cents?: number;
    traveler_info?: Record<string, any>;
  }) => {
    if (!user) return null;
    const sessionId = tripSessionId ?? crypto.randomUUID();
    if (!tripSessionId) setTripSessionId(sessionId);
    const { error } = await (supabase as any)
      .from("trip_sessions")
      .upsert(
        {
          id: sessionId,
          user_id: user.id,
          ...(sourceTripId ? { source_trip_id: sourceTripId } : {}),
          status: "pending",
          updated_at: new Date().toISOString(),
          ...(updates.traveler_info ? { traveler_info: updates.traveler_info } : briefContext?.destination ? { traveler_info: { destination: briefContext.destination } } : {}),
          ...updates,
        },
        { onConflict: "id" },
      );
    if (error) console.error("[upsertTripSession]", error);
    return sessionId;
  };

  // Trip setup form callback — show friendly summary to user, send structured brief to AI
  const handleBriefNala = (briefMessage: string, needs: string[]) => {
    setTripSetupDone(true);

    // Parse the structured brief
    const params = Object.fromEntries(
      briefMessage.replace("[TRAVISO BRIEF] ", "").split(" ").map((p) => {
        const [k, ...v] = p.split("=");
        return [k, v.join("=")];
      }),
    );

    // Store brief context for use in selection handlers
    setBriefContext({
      destination: params.destination ?? "",
      origin: params.origin ?? "none",
      departure: params.departure ?? "",
      returnDate: params.return ?? "null",
      travelers: params.travelers ?? "2",
      needs,
      preferences: params.preferences ?? "none",
    });

    // Reset booking state
    setActivitiesAdded(0);
    setShowDoneActivities(false);
    setSelectedFlight(null);
    setSelectedHotel(null);
    setSelectedActivities([]);
    setSelectedRestaurants([]);
    setTripSessionId(null);
    setShowTripSummary(false);

    // Build friendly summary
    const icons: Record<string, string> = { flights: "✈️", hotels: "🏨", activities: "🎯", restaurants: "🍽️" };
    const needIcons = needs.map((n) => icons[n] ?? "").join(" ");
    const dest = params.destination ?? "";
    const origin = params.origin && params.origin !== "none" ? ` from ${params.origin}` : "";
    const dep = params.departure ?? "";
    const ret = params.return && params.return !== "null" ? ` – ${params.return}` : "";
    const travelers = params.travelers ?? "2";
    const friendlyMsg = `Trip to ${dest}${origin}, ${dep}${ret}, ${travelers} travelers ${needIcons}`.trim();

    // Send structured brief to AI, but display friendly version in chat + DB
    sendMessageWithText(briefMessage, { displayText: friendlyMsg });
  };

  const handleSaveTrip = async () => {
    if (!user) {
      toast.error("Please sign in to save trips");
      navigate("/login");
      return;
    }
    try {
      const resp = await supabase.functions.invoke("extract-trip", { body: { messages } });
      if (resp.error) throw resp.error;
      const tripData = resp.data;
      if (tripData?.trip_id) {
        toast.success("Trip saved! Redirecting...");
        navigate(`/trip/${tripData.trip_id}`);
      } else {
        toast.success("Trip saved to your dashboard!");
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error("Failed to save trip. Try creating it manually.");
      navigate("/create-trip");
    }
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const handleComparisonSelect = (opt: ComparisonOption) => {
    sendDirectMessage(`I'd like to go with "${opt.name}" (${opt.price}). Please add it to my itinerary.`);
  };

  /** Renders a structured assistant message: intro → results → picks → tips */
  const renderStructuredContent = (content: string) => {
    const { introText, results, comparisons, trailingText } = parseMessageSections(content);
    const hasStructuredData = results.length > 0 || comparisons.length > 0;

    if (!hasStructuredData) {
      return (
        <div className="prose prose-sm max-w-none dark:prose-invert nala-prose">
          <ReactMarkdown>{stripRawBlocks(stripStatusLines(content))}</ReactMarkdown>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* 1. Nala's intro text */}
        {introText && (
          <div className="prose prose-sm max-w-none dark:prose-invert nala-prose">
            <ReactMarkdown>{introText}</ReactMarkdown>
          </div>
        )}

        {/* 2. ALL result cards grouped together */}
        {results.length > 0 && (
          <div className="not-prose w-full space-y-2">
            {results.map((r, i) => (
              <SearchResultsBlock
                key={`result-${i}`}
                data={r}
                onSelectFlight={(f) => {
                  const dep = new Date(f.departure_time);
                  const arr = new Date(f.arrival_time);
                  const depTime = dep.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
                  const arrTime = arr.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
                  const date = dep.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  const flightNum = f.flight_number ? ` ${f.flight_number}` : "";
                  const stopsText = f.stops === 0 ? "nonstop" : `${f.stops} stop${f.stops > 1 ? "s" : ""}`;
                  // Only message Nala if we have brief context — in free-form mode, skip to avoid duplicate searches
                  if (briefContext) {
                    let msg = `I'd like the ${f.airline_name}${flightNum} flight, departing ${depTime} arriving ${arrTime} on ${date}, ${f.cabin_class}, ${stopsText}, $${(f.price_cents / 100).toFixed(0)}. Please add it to my trip. DO NOT search for flights again.`;
                    if (briefContext.needs.includes("hotels")) {
                      const checkout = briefContext.returnDate !== "null" ? briefContext.returnDate : "";
                      const checkoutPart = checkout ? ` to ${checkout}` : " for a few nights";
                      msg += ` Now immediately search hotels in ${briefContext.destination} from ${briefContext.departure}${checkoutPart} for ${briefContext.travelers} adults.`;
                    }
                    sendDirectMessage(msg);
                  }
                  setSelectedFlight(f);
                  const passengerCount = f.passenger_ids?.length ?? 1;
                  upsertTripSession({
                    selected_flights: [f],
                    total_amount_cents: f.price_cents * passengerCount,
                    traveler_info: { destination: briefContext?.destination ?? f.airline_name },
                  });
                  checkAndShowSummary(f, selectedHotel, selectedActivities, selectedRestaurants, briefContext?.needs ?? ["flights"]);
                }}
                onSelectHotel={(h) => {
                  let msg = `I'd like to stay at ${h.name} ($${(h.price_per_night_cents / 100).toFixed(0)}/night). Please add it to my trip.`;
                  if (briefContext?.needs.includes("activities")) {
                    msg += ` Now immediately search activities in ${briefContext.destination}.`;
                  }
                  sendDirectMessage(msg);
                  setSelectedHotel(h);
                  const passengerCount = selectedFlight?.passenger_ids?.length ?? 1;
                  const flightCents = (selectedFlight?.price_cents ?? 0) * passengerCount;
                  upsertTripSession({ selected_hotels: [h], total_amount_cents: flightCents + h.total_price_cents });
                  checkAndShowSummary(selectedFlight, h, selectedActivities, selectedRestaurants, briefContext?.needs ?? ["hotels"]);
                }}
                onSelectActivity={(a) => {
                  const msg = `I'd like to add "${a.title}" at $${(a.price_cents / 100).toFixed(0)}/person. Please add it to my trip.`;
                  sendDirectMessage(msg);
                  const newActivities = [...selectedActivities, a];
                  setSelectedActivities(newActivities);
                  if (briefContext?.needs.includes("restaurants")) {
                    setActivitiesAdded((n) => n + 1);
                    setShowDoneActivities(true);
                  }
                  const flightCents = selectedFlight?.price_cents ?? 0;
                  const hotelCents = selectedHotel?.total_price_cents ?? 0;
                  const actCents = newActivities.reduce((s, x) => s + x.price_cents, 0);
                  upsertTripSession({ selected_activities: newActivities, total_amount_cents: flightCents + hotelCents + actCents });
                  checkAndShowSummary(selectedFlight, selectedHotel, newActivities, selectedRestaurants, briefContext?.needs ?? ["activities"]);
                }}
                onSelectRestaurant={(r) => {
                  sendDirectMessage(`I'd like to dine at ${r.name}. Please add it to my trip.`);
                  const newRestaurants = [...selectedRestaurants, r];
                  setSelectedRestaurants(newRestaurants);
                  const flightCents = selectedFlight?.price_cents ?? 0;
                  const hotelCents = selectedHotel?.total_price_cents ?? 0;
                  const actCents = selectedActivities.reduce((s, x) => s + x.price_cents, 0);
                  upsertTripSession({ selected_restaurants: newRestaurants, total_amount_cents: flightCents + hotelCents + actCents });
                  checkAndShowSummary(selectedFlight, selectedHotel, selectedActivities, newRestaurants, briefContext?.needs ?? ["restaurants"]);
                }}
              />
            ))}
          </div>
        )}

        {/* Done with activities button */}
        {showDoneActivities && briefContext?.needs.includes("restaurants") && (
          <div className="not-prose flex justify-end pt-1">
            <button
              onClick={() => {
                setShowDoneActivities(false);
                setActivitiesAdded(0);
                sendDirectMessage(
                  `I've added ${activitiesAdded} activit${activitiesAdded === 1 ? "y" : "ies"}. Now immediately search restaurants in ${briefContext.destination}.`
                );
              }}
              className="text-xs px-4 py-2 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              Done with activities → Find restaurants
            </button>
          </div>
        )}

        {/* 3. Nala's Top Picks — compare blocks below results */}
        {comparisons.length > 0 && results.length > 0 && (
          <div className="not-prose w-full space-y-2">
            <div className="flex items-center gap-2 pt-2 pb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">Nala's Top Picks</span>
            </div>
            {comparisons.map((c, i) => (
              <ComparisonCard
                key={`compare-${i}`}
                data={c}
                onSelect={handleComparisonSelect}
              />
            ))}
          </div>
        )}

        {/* 4. Tips / trailing text at the bottom */}
        {trailingText && (
          <div className="prose prose-sm max-w-none dark:prose-invert nala-prose">
            <ReactMarkdown>{trailingText}</ReactMarkdown>
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Detect search-in-progress for loading card
  // ---------------------------------------------------------------------------
  const isSearching = loading && (() => {
    const lastMsg = messages[messages.length - 1];
    return lastMsg?.role === "assistant" ? detectSearchStatus(lastMsg.content) : null;
  })();

  const isImage = selectedFile?.type.startsWith("image/");
  const canSend = (input.trim().length > 0 || selectedFile !== null) && !loading;

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col h-full">
      {/* Chat area — never locks scroll */}
      <div ref={scrollContainerRef} className="relative flex-1 overflow-y-auto">
        {/* Gradient shimmer background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] animate-shimmer opacity-[0.035]"
            style={{
              background: "conic-gradient(from 0deg at 50% 50%, hsl(var(--accent)) 0deg, transparent 60deg, transparent 300deg, hsl(var(--accent)) 360deg)",
            }}
          />
        </div>
        <div className="relative px-4 py-6">
        <div className="container max-w-3xl space-y-4">
          <AnimatePresence mode="wait">
            {messages.length === 0 && !tripSetupDone && (
              <motion.div
                key="trip-setup"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <TripSetupForm onSubmit={handleBriefNala} loading={loading} initialValues={initialValues} />
              </motion.div>
            )}
          </AnimatePresence>

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}
            >
              {msg.role === "assistant" && <NalaAvatar />}
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-accent text-accent-foreground"
                    : "bg-card border"
                }`}
              >
                {msg.role === "assistant"
                  ? renderStructuredContent(msg.content)
                  : <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                }
              </div>
            </motion.div>
          ))}

          {/* Loading state — premium card for search, dots for text */}
          <AnimatePresence>
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="flex justify-start gap-2"
              >
                <NalaAvatar />
                {isSearching ? (
                  <SearchLoadingCard
                    searchType={isSearching.searchType}
                    statusText={isSearching.statusText}
                  />
                ) : (
                  <div className="rounded-2xl bg-card border px-4 py-3">
                    <TypingDots />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* TripSummaryCard — appears after all selections complete */}
          {showTripSummary && tripSessionId && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="not-prose w-full"
            >
              <TripSummaryCard
                trip={{
                  destination: briefContext?.destination ?? "Your Trip",
                  dates: briefContext
                    ? `${briefContext.departure}${briefContext.returnDate !== "null" ? ` – ${briefContext.returnDate}` : ""}`
                    : "",
                  travelers: parseInt(briefContext?.travelers ?? "2"),
                  flight: selectedFlight ?? undefined,
                  hotel: selectedHotel ?? undefined,
                  activities: selectedActivities,
                  restaurants: selectedRestaurants,
                }}
                onCheckout={() => navigate(`/booking/${tripSessionId}`)}
              />
            </motion.div>
          )}

          {/* Save as Trip — only for freeform conversations outside a brief session */}
          {!showTripSummary && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: 0.15 }}
              className="flex items-center justify-start pl-9 gap-3"
            >
              <Button
                size="sm"
                onClick={handleSaveTrip}
                className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-4"
              >
                <Save className="mr-1.5 h-3.5 w-3.5" /> Save as Trip
              </Button>
              {tripSetupDone && (
                <button
                  onClick={() => setTripSetupDone(false)}
                  className="text-xs text-muted-foreground hover:text-accent transition-colors"
                >
                  Edit trip details
                </button>
              )}
            </motion.div>
          )}

          <div ref={scrollRef} />
        </div>
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-card px-3 sm:px-4 py-2 sm:py-3 pb-[env(safe-area-inset-bottom,8px)]">
        <div className="container max-w-3xl space-y-2">
          <AnimatePresence>
            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-xl w-fit max-w-full">
                  {isImage && filePreview ? (
                    <img src={filePreview} alt="preview" className="h-8 w-8 rounded object-cover shrink-0" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">{selectedFile.name}</span>
                  {uploadLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin text-accent shrink-0" />
                  ) : (
                    <button onClick={clearFile} className="text-muted-foreground hover:text-foreground transition-colors shrink-0" aria-label="Remove attachment">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-1.5 sm:gap-2 items-end">
            <ChatHistoryDrawer
              conversations={conversations}
              activeId={conversationId}
              loading={convsLoading}
              onSelect={loadConversation}
              onNew={handleNewChat}
              onDelete={handleDeleteConversation}
              open={drawerOpen}
              onOpenChange={setDrawerOpen}
            />
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,text/plain" className="hidden" onChange={handleFileSelect} />
            <Button variant="outline" size="icon" className="shrink-0 h-10 w-10 min-w-[40px]" onClick={() => fileInputRef.current?.click()} disabled={loading} title="Attach image or text file">
              {isImage ? <Image className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
            </Button>
            <Textarea
              placeholder="Describe your dream trip..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              className="min-h-[40px] max-h-32 resize-none text-sm py-2.5 leading-5"
              rows={1}
            />
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0 h-10 w-10 min-w-[40px]" size="icon" onClick={sendMessage} disabled={!canSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
