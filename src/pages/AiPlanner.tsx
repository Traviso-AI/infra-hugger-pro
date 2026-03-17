import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Save, Paperclip, X, FileText, Image } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { NalaAvatar } from "@/components/ai-planner/NalaAvatar";
import { TypingDots } from "@/components/ai-planner/TypingDots";
import { ChatHistoryDrawer } from "@/components/ai-planner/ChatHistoryDrawer";
import { useConversations } from "@/hooks/useConversations";
import { ComparisonCard, parseComparisonBlocks } from "@/components/ai-planner/ComparisonCard";
import type { ComparisonOption } from "@/components/ai-planner/ComparisonCard";
import { SearchResultsBlock, parseSearchResultsBlocks } from "@/components/ai-planner/SearchResultsBlock";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "text/plain"];
const MAX_FILE_SIZE_MB = 10;

type Message = { role: "user" | "assistant"; content: string };

export default function AiPlanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>(() => crypto.randomUUID());
  const [conversationCreated, setConversationCreated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
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

  // Detect social media URLs in text
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
      
      // Check if extraction actually failed
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

  const sendMessage = async () => {
    const hasText = input.trim().length > 0;
    const hasFile = selectedFile !== null;
    if ((!hasText && !hasFile) || loading) return;

    setLoading(true);
    setUploadLoading(hasFile);

    let userText = input.trim();
    let imageUrl: string | undefined;

    // Check for social media URLs
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

    const userMsg: Message = { role: "user", content: userText };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      // Ensure conversation exists
      if (!conversationCreated && user) {
        await createConversation(conversationId);
        setConversationCreated(true);
      }

      if (user) {
        await supabase.from("messages").insert({
          user_id: user.id,
          conversation_id: conversationId,
          role: "user",
          content: userText,
        });
        touchConversation(conversationId);
      }

      // Build messages for AI
      const aiMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
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

      // Stream response
      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      if (reader) {
        const assistantMsg: Message = { role: "assistant", content: "" };
        setMessages((prev) => [...prev, assistantMsg]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
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

      // Auto-update title if it was the first message
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

  const isImage = selectedFile?.type.startsWith("image/");
  const canSend = (input.trim().length > 0 || selectedFile !== null) && !loading;

  return (
    <div className="flex flex-col h-full">

      {/* Chat area */}
      <div className="relative flex-1 overflow-y-auto">
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
            {messages.length === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="text-center py-16"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                  className="flex justify-center"
                >
                  <NalaAvatar size="lg" showOnline />
                </motion.div>
                <h2 className="font-display text-2xl font-bold mb-1 mt-4">Meet Nala 🐾</h2>
                <p className="text-xs text-accent font-medium mb-3">AI Trip Planner · Online</p>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Your AI travel buddy. Describe a trip, <span className="text-accent font-medium">paste a TikTok/Instagram link</span>, or upload a group chat screenshot — Nala will build your itinerary.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    "3 days in Tokyo with friends, cherry blossoms and nightlife",
                    "Weekend in Barcelona, food and architecture",
                    "🔗 Paste a TikTok or Instagram travel link here",
                    "Find me hotels in Tulum for March 15-20",
                  ].map((suggestion, i) => (
                    <motion.div
                      key={suggestion}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + i * 0.08 }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setInput(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {messages.map((msg, i) => {
            const hasComparison = msg.role === "assistant" && msg.content.includes("```traviso-compare");
            const hasResults = msg.role === "assistant" && msg.content.includes("```traviso-results");
            const parsedComparison = hasComparison ? parseComparisonBlocks(msg.content) : null;
            const parsedResults = hasResults ? parseSearchResultsBlocks(msg.content) : null;

            const handleComparisonSelect = (opt: ComparisonOption) => {
              setInput(`I'd like to go with "${opt.name}" (${opt.price}). Please add it to my itinerary.`);
            };

            // Render assistant message content with embedded blocks
            const renderAssistantContent = () => {
              // Both block types can coexist — parse results first, then comparisons within text parts
              if (parsedResults && parsedResults.results.some(Boolean)) {
                return (
                  <div className="prose prose-sm max-w-none dark:prose-invert nala-prose space-y-3">
                    {parsedResults.textParts.map((text, j) => {
                      // Within each text part, also check for comparison blocks
                      const hasInnerComparison = text.includes("```traviso-compare");
                      const innerParsed = hasInnerComparison ? parseComparisonBlocks(text) : null;

                      return (
                        <div key={`results-${j}`}>
                          {innerParsed ? (
                            innerParsed.textParts.map((innerText, k) => (
                              <div key={`inner-${k}`}>
                                {innerText.trim() && <ReactMarkdown>{innerText}</ReactMarkdown>}
                                {k < innerParsed.comparisons.length && innerParsed.comparisons[k] && (
                                  <ComparisonCard
                                    data={innerParsed.comparisons[k]!}
                                    onSelect={handleComparisonSelect}
                                  />
                                )}
                              </div>
                            ))
                          ) : (
                            text.trim() && <ReactMarkdown>{text}</ReactMarkdown>
                          )}
                          {j < parsedResults.results.length && parsedResults.results[j] && (
                            <SearchResultsBlock
                              data={parsedResults.results[j]!}
                              onSelectFlight={(f) => setInput(`I'd like the ${f.airline_name} flight at $${(f.price_cents / 100).toFixed(0)}. Please add it to my trip.`)}
                              onSelectHotel={(h) => setInput(`I'd like to stay at ${h.name} ($${(h.price_per_night_cents / 100).toFixed(0)}/night). Please add it to my trip.`)}
                              onSelectActivity={(a) => setInput(`I'd like to do "${a.title}" ($${(a.price_cents / 100).toFixed(0)}/person). Please add it to my trip.`)}
                              onSelectRestaurant={(r) => setInput(`I'd like to dine at ${r.name}. Please add it to my trip.`)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              }

              if (parsedComparison) {
                return (
                  <div className="prose prose-sm max-w-none dark:prose-invert nala-prose space-y-3">
                    {parsedComparison.textParts.map((text, j) => (
                      <div key={`text-${j}`}>
                        {text.trim() && <ReactMarkdown>{text}</ReactMarkdown>}
                        {j < parsedComparison.comparisons.length && parsedComparison.comparisons[j] && (
                          <ComparisonCard
                            data={parsedComparison.comparisons[j]!}
                            onSelect={handleComparisonSelect}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                );
              }

              return (
                <div className="prose prose-sm max-w-none dark:prose-invert nala-prose">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              );
            };

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}
              >
                {msg.role === "assistant" && <NalaAvatar />}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-accent text-accent-foreground"
                      : "bg-card border"
                  }`}
                >
                  {msg.role === "assistant" ? renderAssistantContent() : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </motion.div>
            );
          })}

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex justify-start gap-2"
            >
              <NalaAvatar />
              <div className="rounded-2xl bg-card border px-4 py-3">
                <TypingDots />
              </div>
            </motion.div>
          )}

          {messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: 0.15 }}
              className="flex justify-start pl-9"
            >
              <Button
                size="sm"
                onClick={handleSaveTrip}
                className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-4"
              >
                <Save className="mr-1.5 h-3.5 w-3.5" /> Save as Trip
              </Button>
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
