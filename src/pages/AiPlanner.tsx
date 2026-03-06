import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Sparkles, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";


type Message = { role: "user" | "assistant"; content: string };

export default function AiPlanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId] = useState(() => crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // Save user message
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
          body: JSON.stringify({ messages: newMessages }),
        }
      );

      if (!resp.ok) {
        if (resp.status === 429) {
          toast.error("Rate limit exceeded, please try again later");
          setLoading(false);
          return;
        }
        if (resp.status === 402) {
          toast.error("AI credits exhausted, please add funds");
          setLoading(false);
          return;
        }
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

      // Save assistant message
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
    // Use AI to extract trip details via tool calling
    try {
      const resp = await supabase.functions.invoke("extract-trip", {
        body: { messages },
      });

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

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b bg-card px-4 py-3">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <h1 className="font-display text-lg font-bold">AI Trip Planner</h1>
          </div>
          {messages.length > 2 && (
            <Button size="sm" variant="outline" onClick={handleSaveTrip}>
              <Save className="mr-1 h-3 w-3" /> Save as Trip
            </Button>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="container max-w-3xl space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <Sparkles className="mx-auto mb-4 h-12 w-12 text-accent/40" />
              <h2 className="font-display text-2xl font-bold mb-2">Plan Your Dream Trip</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Describe your trip idea and I'll create a complete itinerary with flights, hotels, activities, and more.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "3 days in Tokyo with friends, cherry blossoms and nightlife",
                  "Weekend in Barcelona, food and architecture",
                  "Miami beach party weekend for 4 people",
                  "5-day wellness retreat in Bali",
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setInput(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
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
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-card border px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-card px-4 py-3">
        <div className="container max-w-3xl">
          <div className="flex gap-2">
            <Textarea
              placeholder="Describe your dream trip..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
            />
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
              size="icon"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
