import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, User, MapPin, Sparkles, Camera, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Step {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  link: string;
  check: () => boolean;
}

export function OnboardingChecklist() {
  const { user, profile } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [hasTrips, setHasTrips] = useState<boolean | null>(null);
  const [hasUsedAi, setHasUsedAi] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    // Check if user has created trips
    supabase
      .from("trips")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", user.id)
      .then(({ count }) => setHasTrips((count ?? 0) > 0));

    // Check if user has used AI planner
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => setHasUsedAi((count ?? 0) > 0));
  }, [user]);

  useEffect(() => {
    if (user) {
      const key = `traviso_onboarding_dismissed_${user.id}`;
      if (localStorage.getItem(key)) setDismissed(true);
    }
  }, [user]);

  if (!user || !profile || dismissed || hasTrips === null || hasUsedAi === null) return null;

  const steps: Step[] = [
    {
      id: "profile",
      label: "Complete your profile",
      description: "Add a photo and bio",
      icon: profile?.avatar_url ? Check : Camera,
      link: "/profile",
      check: () => !!(profile?.avatar_url && profile?.bio),
    },
    {
      id: "explore",
      label: "Browse trips",
      description: "Discover curated itineraries",
      icon: MapPin,
      link: "/explore",
      check: () => true, // Always available
    },
    {
      id: "ai",
      label: "Try AI Planner",
      description: "Let Nala build your trip",
      icon: Sparkles,
      link: "/ai-planner",
      check: () => hasUsedAi,
    },
    {
      id: "create",
      label: "Create your first trip",
      description: "Become a creator",
      icon: MapPin,
      link: "/create-trip",
      check: () => hasTrips,
    },
  ];

  const completedCount = steps.filter((s) => s.check()).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  // Hide if all steps complete
  if (completedCount === steps.length) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (user) localStorage.setItem(`traviso_onboarding_dismissed_${user.id}`, "true");
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="mb-6 border-accent/20 bg-gradient-to-r from-accent/5 to-transparent">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display text-lg font-bold">Getting Started 🚀</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {completedCount}/{steps.length} completed
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={handleDismiss}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Progress value={progress} className="h-1.5 mb-4" />
              <div className="grid gap-2 sm:grid-cols-2">
                {steps.map((step) => {
                  const done = step.check();
                  const Icon = done ? Check : step.icon;
                  return (
                    <Link
                      key={step.id}
                      to={step.link}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                        done
                          ? "bg-muted/30 opacity-60"
                          : "hover:bg-muted/50 hover:border-accent/30"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          done ? "bg-accent/20" : "bg-accent/10"
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${done ? "text-accent" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${done ? "line-through" : ""}`}>{step.label}</p>
                        <p className="text-[11px] text-muted-foreground">{step.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
