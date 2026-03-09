import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Smartphone, WifiOff, Zap, Bell, MapPin, Sparkles, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePageSEO } from "@/hooks/usePageSEO";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Install() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  usePageSEO({
    title: "Traviso AI App — Coming Soon",
    description: "The Traviso AI mobile app is coming soon. Get offline itineraries, smart notifications, and more.",
  });

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("You're on the list! We'll notify you when the app launches.");
    setEmail("");
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
    <div className="container px-4 py-6 md:py-12 max-w-2xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
      </Button>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3.5 py-1 text-xs font-medium text-muted-foreground mb-6">
          <Smartphone className="h-3 w-3" /> Coming 2026
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
          Your trips, in your pocket
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
          We're building the Traviso AI app for iOS and Android — offline itineraries, smart alerts, and your AI travel assistant on the go.
        </p>
      </motion.div>

      {/* Features Grid */}
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

      {/* Notify CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="rounded-xl border bg-muted/30 p-6 md:p-8 text-center"
      >
        <Mail className="h-8 w-8 text-accent mx-auto mb-3" />
        <h3 className="font-display font-bold text-lg mb-1">Get notified at launch</h3>
        <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
          Drop your email and we'll let you know the moment the app is ready to download.
        </p>
        <form onSubmit={handleNotify} className="flex gap-2 max-w-sm mx-auto">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11"
          />
          <Button type="submit" className="h-11 px-6 bg-accent text-accent-foreground hover:bg-accent/90 shrink-0">
            Notify Me
          </Button>
        </form>
      </motion.div>

      {/* Browser note */}
      <p className="text-center text-xs text-muted-foreground mt-6">
        In the meantime, Traviso AI works great right here in your mobile browser — fully responsive and optimized for every screen.
      </p>
    </div>
  );
}
