import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TripCard } from "@/components/trips/TripCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Compass, Sparkles, TrendingUp, Users, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Index() {
  const { data: featuredTrips } = useQuery({
    queryKey: ["featured-trips"],
    queryFn: async () => {
      const { data } = await supabase
        .from("trips")
        .select("*, profiles!trips_creator_id_profiles_fkey(display_name, avatar_url, username)")
        .eq("is_published", true)
        .order("total_bookings", { ascending: false })
        .limit(6);
      return data || [];
    },
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-36">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-sunset/5" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm font-medium shadow-sm">
              <Sparkles className="h-4 w-4 text-accent" />
              AI-powered travel planning
            </div>
            <h1 className="font-display text-5xl font-bold leading-tight tracking-tight md:text-7xl">
              Turn any idea into a{" "}
              <span className="bg-gradient-to-r from-accent to-teal bg-clip-text text-transparent">
                bookable trip
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Plan trips with AI, discover creator itineraries, and book everything in one place.
              The future of travel starts here.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-8">
                <Link to="/ai-planner">
                  <Sparkles className="mr-2 h-4 w-4" /> Plan with AI
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8">
                <Link to="/explore">
                  Explore Trips <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-y bg-card py-16">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: Sparkles, title: "AI Trip Builder", desc: "Describe your dream trip and our AI creates a complete itinerary with flights, hotels, and activities." },
              { icon: Users, title: "Creator Marketplace", desc: "Browse and book curated trips from travel creators, influencers, and locals who know best." },
              { icon: TrendingUp, title: "Earn as a Creator", desc: "Publish your travel experiences and earn commission every time someone books your trip." },
            ].map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center p-6"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <Icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Trips */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl font-bold">Trending Trips</h2>
              <p className="mt-1 text-muted-foreground">The most popular itineraries from our community</p>
            </div>
            <Button asChild variant="ghost" className="hidden sm:flex">
              <Link to="/explore">View all <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          {featuredTrips && featuredTrips.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredTrips.map((trip: any) => (
                <TripCard
                  key={trip.id}
                  id={trip.id}
                  title={trip.title}
                  destination={trip.destination}
                  coverImage={trip.cover_image_url}
                  durationDays={trip.duration_days}
                  priceEstimate={trip.price_estimate}
                  avgRating={trip.avg_rating}
                  totalBookings={trip.total_bookings}
                  creatorName={trip.profiles?.display_name}
                  creatorAvatar={trip.profiles?.avatar_url}
                  creatorUsername={trip.profiles?.username}
                  tags={trip.tags}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed bg-muted/50 p-12 text-center">
              <Compass className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="font-display text-xl font-semibold mb-2">No trips yet</h3>
              <p className="text-muted-foreground mb-4">Be the first to create and publish a trip!</p>
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/create-trip">Create a Trip</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 md:py-24">
        <div className="container text-center">
          <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
            Ready to share your travel expertise?
          </h2>
          <p className="mt-4 text-primary-foreground/70 text-lg">
            Become a Traviso creator and earn money from your travel experiences.
          </p>
          <Button asChild size="lg" className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/signup">Get Started Free</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
