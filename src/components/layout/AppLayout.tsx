import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

export function AppLayout() {
  const { user, profile } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (user && profile) {
      const key = `traviso_welcomed_${user.id}`;
      if (!localStorage.getItem(key)) {
        // Show welcome modal for new users (profile created within last 2 minutes)
        const created = new Date(profile.created_at).getTime();
        const now = Date.now();
        if (now - created < 2 * 60 * 1000) {
          setShowWelcome(true);
        }
        localStorage.setItem(key, "true");
      }
    }
  }, [user, profile]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WelcomeModal
        open={showWelcome}
        onClose={() => setShowWelcome(false)}
        displayName={profile?.display_name || ""}
      />
    </div>
  );
}

export function AppLayoutNoFooter() {
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
