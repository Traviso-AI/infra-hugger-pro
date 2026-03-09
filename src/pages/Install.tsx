import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Smartphone, WifiOff, Zap, Bell, MapPin, Sparkles, Check } from "lucide-react";
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
    { icon: WifiOff, title: "Offline Itineraries", desc: "Access trip details without internet — perfect for traveling abroad" },
    { icon: Bell, title: "Smart Notifications", desc: "Booking confirmations, group updates, and price drop alerts" },
    { icon: Zap, title: "Lightning Fast", desc: "Instant loading with native app performance" },
    { icon: MapPin, title: "Live Trip Tracking", desc: "Real-time maps and location-based suggestions" },
    { icon: Sparkles, title: "AI on the Go", desc: "Chat with Nala to adjust your itinerary anywhere" },
    { icon: Smartphone, title: "Native Experience", desc: "Full-screen, gesture-based UI for mobile travelers" },
  ];

  return (
    <div className="min-h-[80vh]">
      {/* Hero with gradient background */}
      <div className="relative overflow-hidden bg-gradient-to-b from-accent/8 via-accent/3 to-transparent">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />
          <div className="absolute top-32 -left-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="container px-4 pt-6 pb-12 md:pt-12 md:pb-16 max-w-2xl mx-auto relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-8 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Phone mockup placeholder */}
            <div className="relative mx-auto mb-8 w-[140px] h-[140px]">
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 shadow-lg shadow-accent/10 flex items-center justify-center">
                <div className="text-center">
                  <Smartphone className="h-10 w-10 text-accent mx-auto mb-1" />
                  <span className="text-[10px] font-bold text-accent/70 tracking-wider uppercase">2026</span>
                </div>
              </div>
            </div>

            <h1 className="font-display text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              Your trips,<br />in your pocket
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed text-sm md:text-base">
              The Traviso AI app for iOS and Android is in development — offline itineraries, smart alerts, and your AI travel assistant on the go.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Features + CTA */}
      <div className="container px-4 py-8 md:py-12 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-10"
        >
          <h2 className="font-display text-lg font-bold text-center mb-5">What we're building</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="border-border/60">
                <CardContent className="flex items-start gap-3.5 p-4">
                  <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-[18px] w-[18px] text-accent" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="rounded-xl border bg-muted/30 p-6 md:p-8 text-center"
        >
          {notified ? (
            <>
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <Check className="h-6 w-6 text-accent" />
              </div>
              <p className="font-medium">You're on the list!</p>
              <p className="text-sm text-muted-foreground mt-1">We'll send you an email when the app is ready to download.</p>
            </>
          ) : (
            <>
              <p className="font-display font-bold text-lg mb-1">Want early access?</p>
              <p className="text-sm text-muted-foreground mb-5">
                We'll notify you at {user?.email || "your email"} when the app launches.
              </p>
              <Button
                onClick={handleNotify}
                className="h-11 px-8 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Bell className="mr-2 h-4 w-4" /> Notify Me at Launch
              </Button>
            </>
          )}
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          In the meantime, Traviso AI works great right here in your mobile browser.
        </p>
      </div>
    </div>
  );
}
