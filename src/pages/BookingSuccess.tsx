import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  CheckCircle, Plane, Hotel, Activity, Calendar, Users,
  Share2, Copy, ExternalLink, DollarSign, Sparkles,
} from "lucide-react";

export default function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const tripSessionId = searchParams.get("trip_session_id");
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Load trip session
  const { data: session, isLoading } = useQuery({
    queryKey: ["confirmation-session", tripSessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_sessions")
        .select("*")
        .eq("id", tripSessionId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!tripSessionId,
  });

  // Load booking items
  const { data: bookingItems } = useQuery({
    queryKey: ["confirmation-items", tripSessionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("booking_items")
        .select("*")
        .eq("trip_session_id", tripSessionId!)
        .order("created_at");
      return data ?? [];
    },
    enabled: !!tripSessionId,
  });

  // Load commission if creator
  const { data: commission } = useQuery({
    queryKey: ["confirmation-commission", tripSessionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("commission_ledger")
        .select("*")
        .eq("trip_session_id", tripSessionId!)
        .maybeSingle();
      return data;
    },
    enabled: !!tripSessionId,
  });

  const flights = (session?.selected_flights as any[] | null) ?? [];
  const hotels = (session?.selected_hotels as any[] | null) ?? [];
  const activities = (session?.selected_activities as any[] | null) ?? [];
  const totalDollars = ((session?.total_amount_cents ?? 0) / 100).toFixed(2);

  const flightRef = bookingItems?.find((b: any) => b.type === "flight" && b.status === "booked")?.provider_reference;
  const hotelRef = bookingItems?.find((b: any) => b.type === "hotel" && b.status === "booked")?.provider_reference;

  // Destination from hotel address or flight destination
  const destination = hotels[0]?.address?.split(",").pop()?.trim() ??
    flights[0]?.airline_name ? "your destination" : "your trip";

  const shareUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${shareUrl}/booking/confirmation?trip_session_id=${tripSessionId}`);
    toast.success("Link copied!");
  };

  const handleShare = (platform: string) => {
    const text = `Just booked an amazing trip to ${destination} with Traviso!`;
    const url = shareUrl;
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);

    const links: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      instagram: `https://www.instagram.com/`,
      tiktok: `https://www.tiktok.com/`,
    };

    if (links[platform]) {
      window.open(links[platform], "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container max-w-lg py-16 text-center">
        <h1 className="font-display text-2xl font-bold mb-2">Booking Not Found</h1>
        <p className="text-muted-foreground mb-6">We couldn't find this booking confirmation.</p>
        <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-lg px-4 py-10 md:py-16">
      {/* Celebration animation */}
      {showConfetti && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1, delay: 2 }}
          className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: 0,
                y: 0,
                scale: 0,
                rotate: 0,
              }}
              animate={{
                x: (Math.random() - 0.5) * 400,
                y: (Math.random() - 0.5) * 400,
                scale: [0, 1, 0.5],
                rotate: Math.random() * 720,
              }}
              transition={{ duration: 1.5, delay: i * 0.05, ease: "easeOut" }}
              className="absolute h-3 w-3 rounded-full"
              style={{
                backgroundColor: ["#29A38B", "#FFD700", "#FF6B6B", "#4ECDC4", "#7C3AED"][i % 5],
              }}
            />
          ))}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 10, delay: 0.3 }}
        >
          <CheckCircle className="mx-auto mb-4 h-20 w-20 text-accent" />
        </motion.div>
        <h1 className="font-display text-3xl font-bold mb-2">Trip Confirmed!</h1>
        <p className="text-muted-foreground">
          Your trip to <strong className="text-foreground">{destination}</strong> is all set.
        </p>
      </motion.div>

      {/* Trip card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="overflow-hidden mb-6">
          {/* Hotel image header */}
          {hotels[0]?.image_url && (
            <div className="h-40 w-full overflow-hidden">
              <img
                src={hotels[0].image_url}
                alt={destination}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">{destination}</h2>
              <Badge className="bg-accent text-accent-foreground">
                <Sparkles className="h-3 w-3 mr-1" />
                Confirmed
              </Badge>
            </div>

            {/* Booking details */}
            <div className="space-y-2.5">
              {flightRef && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Plane className="h-4 w-4" />
                    Flight Reference
                  </span>
                  <span className="font-mono font-medium">{flightRef}</span>
                </div>
              )}
              {hotelRef && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Hotel className="h-4 w-4" />
                    Hotel Reference
                  </span>
                  <span className="font-mono font-medium">{hotelRef}</span>
                </div>
              )}
              {hotels[0]?.check_in_date && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Dates
                  </span>
                  <span>{hotels[0].check_in_date} — {hotels[0].check_out_date}</span>
                </div>
              )}
              {activities.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    Activities
                  </span>
                  <span>{activities.length} booked</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm font-bold border-t pt-2">
                <span>Total Paid</span>
                <span className="text-accent">${totalDollars}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Creator earnings */}
      {commission && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-6 p-4 rounded-xl bg-accent/5 border border-accent/15"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-accent" />
            <p className="text-sm font-semibold">Creator Earnings</p>
          </div>
          <p className="text-xs text-muted-foreground">
            You earned <strong className="text-foreground">${((commission.amount_cents * (commission.creator_percentage / 100)) / 100).toFixed(2)}</strong> ({commission.creator_percentage}% commission) from this booking.
          </p>
        </motion.div>
      )}

      {/* Share */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="h-4 w-4 text-accent" />
              <p className="text-sm font-semibold">Share Your Trip</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => handleShare("instagram")}>
                Instagram
              </Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => handleShare("tiktok")}>
                TikTok
              </Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => handleShare("whatsapp")}>
                WhatsApp
              </Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={handleCopyLink}>
                <Copy className="h-3 w-3 mr-1" />
                Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex gap-3"
      >
        <Button variant="outline" className="flex-1" onClick={() => navigate("/dashboard")}>
          View My Bookings
        </Button>
        <Button
          className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={() => navigate("/explore")}
        >
          <ExternalLink className="h-4 w-4 mr-1.5" />
          Explore More
        </Button>
      </motion.div>
    </div>
  );
}
