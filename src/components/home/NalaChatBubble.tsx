import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X, ArrowRight, Sparkles } from "lucide-react";
import { NalaAvatar } from "@/components/ai-planner/NalaAvatar";
import { TypingDots } from "@/components/ai-planner/TypingDots";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type Msg = { role: "user" | "assistant"; content: string };

const MAX_FREE_MESSAGES = 2;

const suggestions = [
  "3 days in Tokyo 🌸",
  "Weekend in Barcelona",
  "Best beaches in Bali",
];

export function NalaChatBubble() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userMsgCount, setUserMsgCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Don't show for logged-in users — they have the full AI Planner
  if (user) return null;

  const gated = userMsgCount >= MAX_FREE_MESSAGES;

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading || gated) return;

    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setUserMsgCount((c) => c + 1);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-travel-planner`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        }
      );

      if (!resp.ok) throw new Error("AI error");

      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      if (reader) {
        const assistantMsg: Msg = { role: "assistant", content: "" };
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
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantContent,
                  };
                  return updated;
                });
              }
            } catch {}
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Oops, I couldn't connect right now! Sign up to get the full Nala experience 🐾",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-[0_4px_20px_hsl(var(--accent)/0.4)] hover:shadow-[0_4px_28px_hsl(var(--accent)/0.6)] hover:scale-105 transition-all"
            aria-label="Chat with Nala"
          >
            <NalaAvatar size="sm" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Notification dot on FAB */}
      <AnimatePresence>
        {!open && messages.length === 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-[4.25rem] right-5 z-50 pointer-events-none"
          >
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-accent border-2 border-background" />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border bg-card shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "min(520px, calc(100dvh - 6rem))" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3 bg-card">
              <div className="flex items-center gap-2.5">
                <NalaAvatar showOnline />
                <div>
                  <p className="text-sm font-semibold leading-tight">Nala</p>
                  <p className="text-xs text-muted-foreground">AI Travel Planner</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <AnimatePresence mode="popLayout">
                {messages.length === 0 && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-8 text-center gap-2"
                  >
                    <NalaAvatar size="lg" showOnline />
                    <p className="font-display text-base font-bold mt-1">
                      Hey! I'm Nala 🐾
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tell me where you want to go and I'll plan your trip.
                    </p>
                    <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                      {suggestions.map((s) => (
                        <Button
                          key={s}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 px-2.5"
                          onClick={() => setInput(s)}
                        >
                          {s}
                        </Button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    } gap-1.5`}
                  >
                    {msg.role === "assistant" && <NalaAvatar />}
                    <div
                      className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert nala-prose">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </motion.div>
                ))}

                {loading && messages[messages.length - 1]?.role === "user" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-1.5"
                  >
                    <NalaAvatar />
                    <div className="rounded-2xl bg-muted px-3 py-2.5">
                      <TypingDots />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={scrollRef} />
            </div>

            {/* Input / Gate */}
            <div className="border-t p-3">
              {gated ? (
                <div className="text-center py-1.5">
                  <p className="text-xs text-muted-foreground mb-2.5">
                    Sign up for unlimited conversations & trip saving 🚀
                  </p>
                  <Button
                    asChild
                    size="sm"
                    className="bg-accent text-accent-foreground hover:bg-accent/90 w-full"
                  >
                    <Link to="/signup">
                      Create Free Account <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Where do you want to go?"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    className="min-h-[36px] max-h-[72px] resize-none text-sm"
                  />
                  <Button
                    size="icon"
                    className="shrink-0 bg-accent text-accent-foreground hover:bg-accent/90 h-9 w-9"
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
