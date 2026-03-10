import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Compass, Sparkles, CreditCard, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import logo from "@/assets/logo.png";

const features = [
  {
    icon: Sparkles,
    title: "AI Trip Planning",
    description: "Nala, your AI travel assistant, builds personalized itineraries in seconds.",
  },
  {
    icon: CreditCard,
    title: "One-Click Booking",
    description: "Book hotels and activities directly from any creator's trip guide.",
  },
  {
    icon: Share2,
    title: "Share & Earn",
    description: "Publish your trips and earn commissions when followers book through you.",
  },
];

export default function BetaWaitlist() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  // If not logged in, redirect to landing
  if (!user) {
    window.location.href = "https://traviso.ai";
    return null;
  }

  // If user already has beta access, redirect to dashboard
  if (profile?.is_beta || profile?.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg text-center">
        <img src={logo} alt="Traviso AI" className="mx-auto mb-10 h-14 w-auto" />

        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          You're on the list
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          We're in private beta right now. We'll send an invite to{" "}
          <span className="font-medium text-foreground">{user.email}</span>{" "}
          the moment your spot opens up.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="border-border/50 bg-card/50">
              <CardContent className="flex flex-col items-center p-5 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          Follow us on{" "}
          <a
            href="https://x.com/travisoai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            @travisoai
          </a>{" "}
          for behind-the-scenes updates.
        </p>
      </div>
    </div>
  );
}
