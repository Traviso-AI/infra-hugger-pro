import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { X, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setReferral } from "@/lib/referral";

export function ViralSignupBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [searchParams] = useSearchParams();

  // Store referral in localStorage with 30-day expiry
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferral(ref);
    }
  }, [searchParams]);

  if (user || dismissed) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-accent text-accent-foreground shadow-lg">
      <div className="container flex items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Plane className="h-4 w-4 shrink-0" />
          <span>Plan your own trip free on Traviso AI</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            className="bg-white text-accent hover:bg-white/90 font-medium"
          >
            <Link to="/signup">Join Free →</Link>
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
