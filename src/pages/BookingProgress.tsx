import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, CreditCard, Plane, Hotel, FileText, PartyPopper, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatusEvent {
  id: string;
  event_type: string;
  message: string;
  created_at: string;
}

const STEP_CONFIG: { key: string; label: string; icon: React.ElementType; matches: string[] }[] = [
  { key: "payment", label: "Payment confirmed", icon: CreditCard, matches: ["payment_confirmed"] },
  { key: "flight", label: "Issuing flight ticket", icon: Plane, matches: ["flight_confirmed", "flight_cancelled"] },
  { key: "hotel", label: "Confirming hotel", icon: Hotel, matches: ["hotel_confirmed"] },
  { key: "writing", label: "Writing confirmation", icon: FileText, matches: ["activities_confirmed", "commission_recorded"] },
  { key: "done", label: "Done!", icon: PartyPopper, matches: ["completed"] },
];

export default function BookingProgress() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tripSessionId = searchParams.get("trip_session_id");

  const [events, setEvents] = useState<StatusEvent[]>([]);
  const [failed, setFailed] = useState(false);
  const [failMessage, setFailMessage] = useState("");
  const [completed, setCompleted] = useState(false);
  const [references, setReferences] = useState<{ type: string; ref: string }[]>([]);

  // Load existing events
  useEffect(() => {
    if (!tripSessionId) return;

    const loadEvents = async () => {
      const { data } = await supabase
        .from("booking_status_events")
        .select("*")
        .eq("trip_session_id", tripSessionId)
        .order("created_at", { ascending: true });
      if (data) {
        setEvents(data);
        processEvents(data);
      }
    };

    loadEvents();
  }, [tripSessionId]);

  // Subscribe to realtime events
  useEffect(() => {
    if (!tripSessionId) return;

    const channel = supabase
      .channel(`booking-progress-${tripSessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "booking_status_events",
          filter: `trip_session_id=eq.${tripSessionId}`,
        },
        (payload) => {
          const newEvent = payload.new as StatusEvent;
          setEvents((prev) => {
            const updated = [...prev, newEvent];
            processEvents(updated);
            return updated;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripSessionId]);

  const processEvents = (evts: StatusEvent[]) => {
    const refs: { type: string; ref: string }[] = [];

    for (const evt of evts) {
      if (evt.event_type === "failed") {
        setFailed(true);
        setFailMessage(evt.message);
      }
      if (evt.event_type === "completed") {
        setCompleted(true);
      }
      // Extract references from messages like "Flight confirmed: ABC123"
      if (evt.event_type === "flight_confirmed") {
        const ref = evt.message.split(": ").pop();
        if (ref) refs.push({ type: "Flight", ref });
      }
      if (evt.event_type === "hotel_confirmed") {
        const ref = evt.message.split(": ").pop();
        if (ref) refs.push({ type: "Hotel", ref });
      }
    }

    setReferences(refs);
  };

  // Redirect to confirmation after completion
  useEffect(() => {
    if (!completed) return;
    const timer = setTimeout(() => {
      navigate(`/booking/confirmation?trip_session_id=${tripSessionId}`);
    }, 2000);
    return () => clearTimeout(timer);
  }, [completed, tripSessionId, navigate]);

  const completedTypes = new Set(events.map((e) => e.event_type));

  const getStepStatus = (step: typeof STEP_CONFIG[number]): "done" | "active" | "pending" | "failed" => {
    if (failed) {
      const failedIdx = STEP_CONFIG.findIndex((s) =>
        s.matches.some((m) => events.some((e) => e.event_type === "failed" && e.message.toLowerCase().includes(s.key))),
      );
      const stepIdx = STEP_CONFIG.indexOf(step);
      if (stepIdx <= failedIdx || step.matches.some((m) => completedTypes.has(m))) return "done";
      if (stepIdx === failedIdx + 1) return "failed";
      return "pending";
    }
    if (step.matches.some((m) => completedTypes.has(m))) return "done";
    // Find the first incomplete step — that's the active one
    const firstIncomplete = STEP_CONFIG.find((s) => !s.matches.some((m) => completedTypes.has(m)));
    if (firstIncomplete === step) return "active";
    return "pending";
  };

  if (!tripSessionId) {
    return (
      <div className="container max-w-lg py-16 text-center">
        <h1 className="font-display text-2xl font-bold mb-2">Missing Session</h1>
        <p className="text-muted-foreground mb-6">No booking session found.</p>
        <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, delay: 0.2 }}
            className="mx-auto mb-4 h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center"
          >
            {failed ? (
              <AlertTriangle className="h-8 w-8 text-red-500" />
            ) : completed ? (
              <PartyPopper className="h-8 w-8 text-accent" />
            ) : (
              <Loader2 className="h-8 w-8 text-accent animate-spin" />
            )}
          </motion.div>
          <h1 className="font-display text-2xl font-bold mb-1">
            {failed ? "Booking Issue" : completed ? "All Set!" : "Booking Your Trip"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {failed
              ? "We ran into a problem — see details below."
              : completed
                ? "Redirecting to your confirmation..."
                : "Hang tight while we confirm everything."}
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-1 mb-8">
          <AnimatePresence>
            {STEP_CONFIG.map((step, i) => {
              const status = getStepStatus(step);
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                    status === "done"
                      ? "bg-accent/5"
                      : status === "active"
                        ? "bg-accent/10 ring-1 ring-accent/20"
                        : status === "failed"
                          ? "bg-red-500/5 ring-1 ring-red-500/20"
                          : "opacity-40"
                  }`}
                >
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                      status === "done"
                        ? "bg-accent text-accent-foreground"
                        : status === "active"
                          ? "bg-accent/20 text-accent"
                          : status === "failed"
                            ? "bg-red-500/20 text-red-500"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {status === "done" ? (
                      <Check className="h-4 w-4" />
                    ) : status === "active" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : status === "failed" ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${status === "done" ? "text-foreground" : status === "failed" ? "text-red-500" : ""}`}>
                      {step.label}
                    </p>
                  </div>
                  {status === "done" && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 15 }}>
                      <Check className="h-4 w-4 text-accent" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Booking references */}
        {references.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-muted/50 space-y-2"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Booking References</p>
            {references.map((r, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{r.type}</span>
                <span className="font-mono font-medium">{r.ref}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Failed state */}
        {failed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15 text-sm space-y-2">
              <p className="font-medium text-red-600">What happened</p>
              <p className="text-muted-foreground">{failMessage}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 text-center">
              <p className="text-sm text-amber-700 font-medium">Refund Processing</p>
              <p className="text-xs text-muted-foreground mt-1">Your full refund will appear in 5-10 business days.</p>
            </div>
            <Button className="w-full" variant="outline" onClick={() => navigate("/dashboard")}>
              Return to Dashboard
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
