import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TripCard } from "@/components/trips/TripCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, TrendingUp, Users, ArrowRight, MapPin, Star } from "lucide-react";
import { motion } from "framer-motion";
import { TryNalaWidget } from "@/components/home/TryNalaWidget";


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
      <section className="relative overflow-hidden py-28 md:py-40 min-h-[600px] flex items-center">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="/images/hero-travel.jpg"
            alt="Beautiful tropical beach destination"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </div>

        <div className="container relative z-10">
          <div className="grid items-center gap-12 lg:grid-cols-5">
            {/* Text content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-3 text-center lg:text-left"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-white/90 shadow-lg">
                <Sparkles className="h-4 w-4 text-accent" />
                AI-powered travel planning
              </div>
              <h1 className="font-display text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl">
                The trip finally made it{" "}
                <span className="bg-gradient-to-r from-accent to-teal bg-clip-text text-transparent">
                  out of the group chat.
                </span>
              </h1>
              <p className="mt-6 text-lg text-white/80 md:text-xl max-w-2xl lg:max-w-none">
                Plan it, book it, and get paid when others follow your lead.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start sm:justify-center">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-8 shadow-[0_0_24px_hsl(var(--accent)/0.4)] hover:shadow-[0_0_32px_hsl(var(--accent)/0.6)] transition-shadow">
                  <Link to="/ai-planner">
                    <Sparkles className="mr-2 h-4 w-4" /> Plan with AI
                  </Link>
                </Button>
                <Button asChild size="lg" className="border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 text-base px-8">
                  <Link to="/explore">
                    Explore Trips <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Floating trip card thumbnails */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:flex lg:col-span-2 flex-col gap-4 items-end"
            >
              {[
                { img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=300&q=80", title: "Bali Adventure", dest: "Bali, Indonesia", rating: 4.9, price: "$1,200" },
                { img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=300&q=80", title: "Paris Getaway", dest: "Paris, France", rating: 4.8, price: "$2,400" },
                { img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=300&q=80", title: "Tokyo Explorer", dest: "Tokyo, Japan", rating: 4.7, price: "$1,800" },
              ].map((card, i) => (
                <div
                  key={card.title}
                  className={`flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 p-2.5 pr-5 shadow-2xl w-72 ${
                    i === 0 ? "animate-float" : i === 1 ? "animate-float-delayed mr-8" : "animate-float"
                  }`}
                  style={i === 2 ? { animationDelay: "2s" } : undefined}
                >
                  <img src={card.img} alt={card.title} className="h-14 w-14 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{card.title}</p>
                    <div className="flex items-center gap-1 text-xs text-white/60">
                      <MapPin className="h-3 w-3" /> {card.dest}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="flex items-center gap-0.5 text-xs text-amber-300">
                        <Star className="h-3 w-3 fill-current" /> {card.rating}
                      </span>
                      <span className="text-xs font-medium text-accent">{card.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
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
      <section className="py-12 md:py-16">
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
                  creatorId={trip.creator_id}
                  tags={trip.tags}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-gradient-to-br from-accent/5 to-teal/5 border-2 border-dashed border-accent/20 p-12 text-center">
              <Sparkles className="mx-auto mb-4 h-12 w-12 text-accent/50" />
              <h3 className="font-display text-xl font-semibold mb-2">Be the first creator</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Traviso is launching soon. Start building your audience by publishing a trip — early creators earn the highest commissions.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link to="/ai-planner"><Sparkles className="mr-2 h-4 w-4" /> Plan with AI</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/create-trip">Create a Trip</Link>
                </Button>
              </div>
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
