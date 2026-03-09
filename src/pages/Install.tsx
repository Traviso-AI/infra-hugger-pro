import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, WifiOff, Zap, Bell, MapPin, Sparkles, Smartphone, Check } from "lucide-react";
import { usePageSEO } from "@/hooks/usePageSEO";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Install() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notified, setNotified] = useState(false);

  usePageSEO({
    title: "Traviso AI App — Coming Soon",
    description: "The Traviso AI mobile app is coming soon. Offline itineraries, smart notifications, and more.",
  });

  const handleNotify = () => {
    setNotified(true);
    toast.success("We'll email you when the app launches!");
  };

  const features = [
    { icon: WifiOff, title: "Offline Itineraries", desc: "Access trips without internet" },
    { icon: Bell, title: "Smart Notifications", desc: "Booking & group plan alerts" },
    { icon: Zap, title: "Lightning Fast", desc: "Native app performance" },
    { icon: MapPin, title: "Live Tracking", desc: "Real-time maps & suggestions" },
    { icon: Sparkles, title: "AI on the Go", desc: "Chat with Nala anywhere" },
    { icon: Smartphone, title: "Native UX", desc: "Gesture-based mobile UI" },
  ];

  return (
    <div className="container px-4 py-6 md:py-10 max-w-xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="-ml-2 mb-4 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
      </Button>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-center mb-8"
      >
        {/* Platform icons */}
        <div className="flex items-center justify-center gap-5 mb-5">
          {/* Apple icon */}
          <div className="h-14 w-14 rounded-2xl bg-foreground flex items-center justify-center shadow-md">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-background" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
          </div>
          {/* Android icon */}
          <div className="h-14 w-14 rounded-2xl bg-[hsl(142,60%,45%)] flex items-center justify-center shadow-md">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-white" fill="currentColor">
              <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.27-.86-.31-.16-.69-.04-.86.27l-1.87 3.24C14.85 8.35 13.47 8 12 8s-2.85.35-4.44.95L5.69 5.71c-.16-.31-.54-.43-.86-.27-.31.16-.43.55-.27.86L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z"/>
            </svg>
          </div>
        </div>

        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2 tracking-tight">
          Coming soon to iOS & Android
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
          Offline itineraries, smart alerts, and your AI travel assistant — all in a native app.
        </p>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="grid grid-cols-2 gap-2.5 mb-8"
      >
        {features.map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="border-border/50">
            <CardContent className="flex items-start gap-2.5 p-3">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-accent" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-xs">{title}</h3>
                <p className="text-[11px] text-muted-foreground leading-snug">{desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.18 }}
        className="rounded-xl border bg-muted/30 p-5 text-center"
      >
        {notified ? (
          <div className="flex items-center justify-center gap-2">
            <Check className="h-4 w-4 text-accent" />
            <p className="text-sm font-medium">You're on the list — we'll email you at launch.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-3">
              We'll notify <span className="font-medium text-foreground">{user?.email || "you"}</span> when it's ready.
            </p>
            <Button
              onClick={handleNotify}
              className="h-10 px-6 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Bell className="mr-2 h-4 w-4" /> Notify Me at Launch
            </Button>
          </>
        )}
      </motion.div>

      <p className="text-center text-[11px] text-muted-foreground mt-4">
        Traviso AI works great in your mobile browser right now — fully responsive.
      </p>
    </div>
  );
}
