import { Compass, Users, TrendingUp, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div>
      <section className="container max-w-3xl py-12 md:py-16">
        <h1 className="font-display text-4xl font-bold mb-4">About Traviso AI</h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-8">
          Traviso AI is where travel planning meets the creator economy. We're building a platform where travel creators, influencers, and locals can share their best itineraries — and earn when others book them.
        </p>

        <div className="grid gap-6 md:grid-cols-2 mb-12">
          {[
            { icon: Sparkles, title: "AI-First Planning", desc: "Our AI planner turns a simple prompt into a complete, bookable trip itinerary in seconds." },
            { icon: Users, title: "Creator Marketplace", desc: "Browse curated trips from people who've actually been there — not generic travel guides." },
            { icon: TrendingUp, title: "Creator Economy", desc: "Creators earn commission on every booking. Build an audience around your travel expertise." },
            { icon: Compass, title: "End-to-End Booking", desc: "From discovery to payment, everything happens in one seamless experience." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border bg-card p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 mb-3">
                <Icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-primary p-8 text-center">
          <h2 className="font-display text-2xl font-bold text-primary-foreground mb-2">Join the community</h2>
          <p className="text-primary-foreground/70 mb-6">Whether you're a traveler or a creator, there's a place for you on Traviso.</p>
          <div className="flex gap-3 justify-center">
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/signup">Get Started</Link>
            </Button>
            <Button asChild variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/explore">Explore Trips</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
