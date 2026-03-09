import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, ArrowRight } from "lucide-react";
import { NalaAvatar } from "@/components/ai-planner/NalaAvatar";
import { TypingDots } from "@/components/ai-planner/TypingDots";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";

type Msg = { role: "user" | "assistant"; content: string };

export function TryNalaWidget() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [trialUsed, setTrialUsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

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

      setTrialUsed(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Oops, I couldn't connect right now! Sign up to get the full Nala experience 🐾",
        },
      ]);
      setTrialUsed(true);
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

  const suggestions = [
    "3 days in Tokyo, cherry blossoms 🌸",
    "Weekend in Barcelona, food & architecture",
    "Best beaches in Bali for 5 days",
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent mb-4">
            <Sparkles className="h-4 w-4" />
            Try it — no signup required
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold">
            Ask Nala anything about travel
          </h2>
          <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
            Describe your dream trip and watch Nala build a complete itinerary in
            seconds.
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border bg-card shadow-lg overflow-hidden">
            {/* Chat area */}
            <div className="h-[320px] overflow-y-auto p-4 space-y-3">
              <AnimatePresence mode="popLayout">
                {messages.length === 0 && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full text-center gap-3"
                  >
                    <NalaAvatar size="lg" showOnline />
                    <div>
                      <p className="font-display text-lg font-bold">
                        Hey! I'm Nala 🐾
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Tell me where you want to go and I'll plan your trip.
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                      {suggestions.map((s) => (
                        <Button
                          key={s}
                          variant="outline"
                          size="sm"
                          className="text-xs"
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
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    } gap-2`}
                  >
                    {msg.role === "assistant" && <NalaAvatar />}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
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
                    className="flex gap-2"
                  >
                    <NalaAvatar />
                    <div className="rounded-2xl bg-muted px-4 py-3">
                      <TypingDots />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={scrollRef} />
            </div>

            {/* Input area */}
            <div className="border-t p-3">
              {trialUsed ? (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground mb-3">
                    Sign up for unlimited conversations, trip saving, and more 🚀
                  </p>
                  <Button
                    asChild
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <Link to="/signup">
                      Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
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
                    className="min-h-[40px] max-h-[80px] resize-none text-sm"
                  />
                  <Button
                    size="icon"
                    className="shrink-0 bg-accent text-accent-foreground hover:bg-accent/90 h-10 w-10"
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
