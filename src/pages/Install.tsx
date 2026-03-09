import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Smartphone, Wifi, WifiOff, Zap, Check } from "lucide-react";
import { usePageSEO } from "@/hooks/usePageSEO";

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  usePageSEO({
    title: "Install Traviso AI | Offline Travel Itineraries",
    description: "Install Traviso AI on your device for offline access to your itineraries while traveling.",
  });

  useEffect(() => {
    // Check if running in standalone (already installed)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // iOS detection
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) {
      setIsIOS(true);
    }

    // Listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Listen for successful install
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
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const benefits = [
    { icon: WifiOff, title: "Offline Itineraries", desc: "Access your trip details without internet — perfect for traveling abroad" },
    { icon: Zap, title: "Lightning Fast", desc: "Loads instantly from your home screen, no browser needed" },
    { icon: Smartphone, title: "Native Feel", desc: "Full-screen experience that looks and feels like a native app" },
  ];

  return (
    <div className="container px-4 py-12 max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="h-20 w-20 mx-auto mb-4 rounded-2xl bg-accent/10 flex items-center justify-center">
          <Download className="h-10 w-10 text-accent" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">Get the App</h1>
        <p className="text-muted-foreground">Install Traviso AI for the best travel experience</p>
      </div>

      <div className="space-y-4 mb-8">
        {benefits.map(({ icon: Icon, title, desc }) => (
          <Card key={title}>
            <CardContent className="flex items-start gap-4 p-4">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-medium text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isInstalled ? (
        <div className="text-center p-6 rounded-xl border bg-accent/5">
          <Check className="h-8 w-8 text-accent mx-auto mb-2" />
          <p className="font-medium">App is already installed!</p>
          <p className="text-sm text-muted-foreground mt-1">Open Traviso AI from your home screen.</p>
        </div>
      ) : isIOS ? (
        <div className="text-center p-6 rounded-xl border">
          <p className="text-sm text-muted-foreground mb-3">To install on iPhone/iPad:</p>
          <ol className="text-sm text-left space-y-2 max-w-xs mx-auto">
            <li className="flex items-start gap-2">
              <span className="font-bold text-accent">1.</span>
              Tap the <strong>Share</strong> button in Safari (the square with an arrow)
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-accent">2.</span>
              Scroll down and tap <strong>"Add to Home Screen"</strong>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-accent">3.</span>
              Tap <strong>"Add"</strong> to confirm
            </li>
          </ol>
        </div>
      ) : deferredPrompt ? (
        <Button
          onClick={handleInstall}
          className="w-full h-12 text-base bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Download className="mr-2 h-5 w-5" /> Install Traviso AI
        </Button>
      ) : (
        <div className="text-center p-6 rounded-xl border">
          <p className="text-sm text-muted-foreground">
            Visit this page in Chrome or Edge on your device to install the app.
          </p>
        </div>
      )}
    </div>
  );
}
