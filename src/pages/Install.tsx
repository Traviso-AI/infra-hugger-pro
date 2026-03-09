import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download, Smartphone, WifiOff, Zap, Bell, MapPin, Sparkles } from "lucide-react";
import { usePageSEO } from "@/hooks/usePageSEO";
import { motion } from "framer-motion";

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  usePageSEO({
    title: "Traviso AI App — Coming Soon",
    description: "The Traviso AI mobile app is coming soon. Get offline itineraries, real-time alerts, and more.",
  });

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const features = [
    { icon: WifiOff, title: "Offline Itineraries", desc: "Access your trip details without internet — perfect for traveling abroad" },
    { icon: Bell, title: "Smart Notifications", desc: "Get alerts for booking confirmations, group plan updates, and price drops" },
    { icon: Zap, title: "Lightning Fast", desc: "Instant loading from your home screen with native app performance" },
    { icon: MapPin, title: "Live Trip Tracking", desc: "Real-time maps and location-based activity suggestions" },
    { icon: Sparkles, title: "AI on the Go", desc: "Chat with Nala anywhere to adjust your itinerary on the fly" },
    { icon: Smartphone, title: "Native Experience", desc: "Full-screen, gesture-based UI designed for mobile travelers" },
  ];

  return (
    <div className="container px-4 py-6 md:py-12 max-w-2xl mx-auto">
      {/* Back button */}
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
        <div className="h-20 w-20 mx-auto mb-5 rounded-2xl bg-accent/10 flex items-center justify-center">
          <Download className="h-10 w-10 text-accent" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">The App is Coming Soon</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          We're building the Traviso AI mobile app — offline itineraries, smart notifications, and your AI travel assistant in your pocket.
        </p>
      </motion.div>

      {/* Coming Soon Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="flex justify-center mb-10"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-5 py-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
          </span>
          <span className="text-sm font-medium">Available on iOS & Android soon</span>
        </div>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h2 className="font-display text-lg font-bold text-center mb-5">What to Expect</h2>
        <div className="grid gap-3 sm:grid-cols-2 mb-10">
          {features.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border-border/60">
              <CardContent className="flex items-start gap-3.5 p-4">
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-4.5 w-4.5 text-accent" />
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

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="rounded-xl border bg-muted/30 p-6 text-center"
      >
        {isInstalled ? (
          <>
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <p className="font-medium mb-1">You're all set!</p>
            <p className="text-sm text-muted-foreground">Traviso AI is installed. Open it from your home screen.</p>
          </>
        ) : deferredPrompt ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Want early access? Install the web version now — it works offline too.
            </p>
            <Button
              onClick={handleInstall}
              className="h-11 px-8 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Download className="mr-2 h-4 w-4" /> Install Web App
            </Button>
          </>
        ) : (
          <>
            <p className="font-medium mb-1">Stay in the loop</p>
            <p className="text-sm text-muted-foreground">
              The mobile app is in development. In the meantime, you can use Traviso AI right here in your browser — it's fully responsive and works great on mobile.
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
