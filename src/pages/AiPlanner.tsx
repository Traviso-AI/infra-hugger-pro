import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Loader2, Save, Paperclip, X, FileText, Image, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "text/plain"];
const MAX_FILE_SIZE_MB = 10;

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "3 days in Tokyo — cherry blossoms & nightlife",
  "Weekend in Barcelona — food & architecture",
  "Miami beach party weekend for 4",
  "5-day wellness retreat in Bali",
];

export default function AiPlanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId] = useState(() => crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const sendMessage = async () => {
    const hasText = input.trim().length > 0;
    const hasFile = selectedFile !== null;
    if ((!hasText && !hasFile) || loading) return;

    setLoading(true);
    setUploadLoading(hasFile);

    let userText = input.trim();
    let imageUrl: string | undefined;

    if (selectedFile) {
      try {
        if (selectedFile.type.startsWith("image/")) {
          imageUrl = await uploadImageToStorage(selectedFile);
          userText = userText
            ? `${userText}\n\n📎 [Attached image: ${selectedFile.name}]`
            : `📎 [Attached image: ${selectedFile.name}] — please read this screenshot and build a trip itinerary from the group chat conversation shown.`;
        } else {
          const text = await readTextFile(selectedFile);
          const prefix = `📎 [Shared conversation from "${selectedFile.name}"]:\n\`\`\`\n${text}\n\`\`\`\n\n`;
          userText = userText ? `${prefix}${userText}` : `${prefix}Please read this group chat conversation and create a detailed trip itinerary based on what the group is planning.`;
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to process attachment.");
        setLoading(false);
        setUploadLoading(false);
        return;
      }
    }

    setUploadLoading(false);
    clearFile();

    const userMsg: Message = { role: "user", content: userText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");

    if (user) {
      await supabase.from("messages").insert({
        user_id: user.id,
        conversation_id: conversationId,
        role: "user",
        content: userMsg.content,
      });
    }

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-travel-planner`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: newMessages, imageUrl }),
        }
      );

      if (!resp.ok) {
        if (resp.status === 429) { toast.error("Rate limit exceeded, please try again later"); setLoading(false); return; }
        if (resp.status === 402) { toast.error("AI credits exhausted, please add funds"); setLoading(false); return; }
        throw new Error("AI request failed");
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
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
    } catch (err: any) {
      toast.error(err.message || "Failed to get AI response");
    } finally {
      setLoading(false);
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
    } catch {
      toast.error("Failed to save trip. Try creating it manually.");
      navigate("/create-trip");
    }
  };

  const isImage = selectedFile?.type.startsWith("image/");
  const canSend = (input.trim().length > 0 || selectedFile !== null) && !loading;
  const isEmpty = messages.length === 0;

  return (
    <div className="relative flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Aurora / gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
        <div
          className="absolute -top-1/4 -left-1/4 w-[80vw] h-[80vh] rounded-full opacity-[0.07] blur-[120px]"
          style={{ background: "radial-gradient(circle, hsl(174 60% 45%), transparent 70%)" }}
        />
        <div
          className="absolute -bottom-1/4 -right-1/4 w-[70vw] h-[70vh] rounded-full opacity-[0.05] blur-[100px]"
          style={{ background: "radial-gradient(circle, hsl(220 60% 40%), transparent 70%)" }}
        />
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[50vw] h-[40vh] rounded-full opacity-[0.04] blur-[80px] animate-float"
          style={{ background: "radial-gradient(circle, hsl(174 60% 50%), transparent 70%)" }}
        />
      </div>

      {/* Header */}
      <div className="border-b border-border/40 bg-card/60 backdrop-blur-xl px-4 py-3">
        <div className="mx-auto max-w-3xl flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="font-display text-lg font-bold">AI Trip Planner</h2>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <AnimatePresence>
            {isEmpty && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center pt-[12vh] pb-8"
              >
                {/* Icon */}
                <div className="relative mb-6">
                  <div
                    className="absolute inset-0 rounded-full blur-2xl opacity-30"
                    style={{ background: "hsl(174 60% 45%)" }}
                  />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 backdrop-blur-sm">
                    <Sparkles className="h-7 w-7 text-accent" />
                  </div>
                </div>

                <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
                  Where to next?
                </h1>
                <p className="text-muted-foreground text-sm md:text-base max-w-md text-center leading-relaxed mb-10">
                  Describe your dream trip or{" "}
                  <span className="text-accent font-medium">upload a group chat</span>{" "}
                  — I'll build the perfect itinerary.
                </p>

                {/* Suggestion chips */}
                <div className="flex flex-wrap justify-center gap-2.5 max-w-lg">
                  {SUGGESTIONS.map((s, i) => (
                    <motion.button
                      key={s}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                      onClick={() => setInput(s)}
                      className="group relative px-4 py-2.5 text-xs md:text-sm text-foreground/80 rounded-full
                        border border-border/60 bg-card/50 backdrop-blur-md
                        hover:border-accent/40 hover:bg-accent/5 hover:text-foreground
                        transition-all duration-300 cursor-pointer
                        shadow-[0_0_0_1px_hsl(174_60%_45%/0)] hover:shadow-[0_0_12px_-3px_hsl(174_60%_45%/0.25)]"
                    >
                      <span className="flex items-center gap-1.5">
                        {s}
                        <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all duration-200" />
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-accent text-accent-foreground"
                    : "bg-card/70 backdrop-blur-md border border-border/50"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))}

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="rounded-2xl bg-card/70 backdrop-blur-md border border-border/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  <span className="text-xs text-muted-foreground">Crafting your itinerary…</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Save as Trip */}
          {messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <Button
                size="sm"
                onClick={handleSaveTrip}
                className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-5 shadow-[0_0_16px_-4px_hsl(174_60%_45%/0.4)]"
              >
                <Save className="mr-1.5 h-3.5 w-3.5" /> Save as Trip
              </Button>
            </motion.div>
          )}

          <div ref={scrollRef} />
        </div>
      </div>

      {/* Frosted glass input bar */}
      <div className="relative border-t border-border/40">
        <div
          className="absolute inset-0 -z-10 bg-card/60 backdrop-blur-xl"
        />
        <div className="mx-auto max-w-3xl px-4 py-3 space-y-2">
          {/* File preview chip */}
          {selectedFile && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 backdrop-blur-sm rounded-xl w-fit max-w-full border border-border/40">
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
          )}

          <div className="flex gap-2 items-end">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,text/plain" className="hidden" onChange={handleFileSelect} />

            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 self-end text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-xl"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              title="Attach image or text file"
            >
              {isImage ? <Image className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
            </Button>

            <Textarea
              placeholder="Describe your dream trip…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="min-h-[44px] max-h-32 resize-none rounded-xl border-border/50 bg-background/50 backdrop-blur-sm
                focus-visible:ring-accent/30 focus-visible:border-accent/40 transition-all"
              rows={1}
            />

            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!canSend}
              className="shrink-0 self-end rounded-xl bg-accent text-accent-foreground hover:bg-accent/90
                shadow-[0_0_16px_-4px_hsl(174_60%_45%/0.4)] hover:shadow-[0_0_20px_-4px_hsl(174_60%_45%/0.5)]
                transition-all duration-300 disabled:shadow-none"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
