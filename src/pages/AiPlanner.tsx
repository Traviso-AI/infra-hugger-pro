import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Save, Paperclip, X, FileText, Image } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import nalaAvatar from "@/assets/nala-avatar.png";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "text/plain"];
const MAX_FILE_SIZE_MB = 10;

type Message = { role: "user" | "assistant"; content: string };

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1 px-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-2 w-2 rounded-full bg-accent/60"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.1, 0.85] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function NalaAvatar({ size = "sm", showOnline = false }: { size?: "sm" | "lg"; showOnline?: boolean }) {
  const sizeClasses = size === "lg" ? "h-16 w-16" : "h-7 w-7";
  return (
    <div className="relative shrink-0">
      <div className={`${sizeClasses} rounded-full bg-accent/10 border-2 border-accent/20 overflow-hidden flex items-center justify-center`}>
        <img src={nalaAvatar} alt="Nala" className="h-full w-full object-cover" />
      </div>
      {showOnline && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-accent border-2 border-background" />
        </span>
      )}
    </div>
  );
}

export default function AiPlanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId] = useState(() => crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);

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
    } catch (err: any) {
      toast.error("Failed to save trip. Try creating it manually.");
      navigate("/create-trip");
    }
  };

  const isImage = selectedFile?.type.startsWith("image/");
  const canSend = (input.trim().length > 0 || selectedFile !== null) && !loading;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">

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
                  Your AI travel buddy. Describe your trip idea or <span className="text-accent font-medium">upload a group chat screenshot</span> and Nala will create a complete itinerary.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    "3 days in Tokyo with friends, cherry blossoms and nightlife",
                    "Weekend in Barcelona, food and architecture",
                    "Miami beach party weekend for 4 people",
                    "5-day wellness retreat in Bali",
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
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-accent text-accent-foreground"
                    : "bg-card border"
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
      <div className="border-t bg-card px-4 py-3">
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

          <div className="flex gap-2 items-end">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,text/plain" className="hidden" onChange={handleFileSelect} />
            <Button variant="outline" size="icon" className="shrink-0 self-end" onClick={() => fileInputRef.current?.click()} disabled={loading} title="Attach image or text file">
              {isImage ? <Image className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
            </Button>
            <Textarea
              placeholder="Describe your dream trip, or attach a group chat screenshot..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
            />
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0 self-end" size="icon" onClick={sendMessage} disabled={!canSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
