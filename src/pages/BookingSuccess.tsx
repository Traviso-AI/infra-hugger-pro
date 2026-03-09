import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { CheckCircle, Users, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(true);
  const [saved, setSaved] = useState(false);
  const [destination, setDestination] = useState("");
  const [tripId, setTripId] = useState<string | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [hasGroup, setHasGroup] = useState(false);

  useEffect(() => {
    const saveBooking = async () => {
      if (!user) return;

      const sessionId = searchParams.get("session_id");
      const tid = searchParams.get("trip_id");
      const hotelId = searchParams.get("hotel_id") || null;
      const checkIn = searchParams.get("check_in");
      const checkOut = searchParams.get("check_out");
      const guests = parseInt(searchParams.get("guests") || "1");
      const price = parseFloat(searchParams.get("total_price") || "0");

      setTripId(tid);
      setTotalPrice(price);

      if (!tid || !sessionId) {
        toast.error("Missing booking information");
        setSaving(false);
        return;
      }

      // Check if there's a group for this trip
      const { count } = await supabase
        .from("trip_collaborators")
        .select("id", { count: "exact", head: true })
        .eq("trip_id", tid)
        .not("accepted_at", "is", null);
      setHasGroup((count || 0) > 0);

      // Check for existing booking
      const { data: existingBooking } = await supabase
        .from("bookings")
        .select("id")
        .eq("stripe_payment_id", sessionId)
        .maybeSingle();

      if (existingBooking) {
        const { data: trip } = await supabase
          .from("trips")
          .select("destination")
          .eq("id", tid)
          .single();
        if (trip) setDestination(trip.destination);
        setSaved(true);
        setSaving(false);
        return;
      }

      const { data: currentTrip } = await supabase
        .from("trips")
        .select("commission_rate, destination")
        .eq("id", tid)
        .single();

      if (currentTrip) setDestination(currentTrip.destination);
      const commission = price * ((currentTrip?.commission_rate || 10) / 100);

      const { error } = await supabase.from("bookings").upsert(
        {
          user_id: user.id,
          trip_id: tid,
          hotel_id: hotelId || null,
          check_in: checkIn,
          check_out: checkOut,
          guests,
          total_price: price,
          commission_amount: commission,
          status: "confirmed",
          stripe_payment_id: sessionId,
        },
        { onConflict: "stripe_payment_id" }
      );

      if (error) {
        console.error("Booking save error:", error);
        toast.error("Payment succeeded but booking save failed. Please contact support.");
      } else {
        setSaved(true);
        toast.success("Booking confirmed!");
      }
      setSaving(false);
    };

    saveBooking();
  }, [user, searchParams]);

  if (saving) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <p className="text-muted-foreground">Confirming your booking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-lg py-16 text-center">
      <CheckCircle className="mx-auto mb-4 h-16 w-16 text-accent" />
      <h1 className="font-display text-3xl font-bold mb-2">Booking Confirmed!</h1>
      <p className="text-muted-foreground mb-6">
        {destination
          ? `Your trip to ${destination} has been booked and paid for.`
          : "Your booking has been confirmed and paid for."}{" "}
        Check your dashboard for details.
      </p>

      {/* If there's a group — prompt to split costs */}
      {hasGroup && totalPrice > 0 && tripId && (
        <div className="mb-6 p-4 rounded-xl bg-accent/5 border border-accent/15 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            <p className="text-sm font-medium">You have a group for this trip!</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Split the ${totalPrice.toLocaleString()} cost with your group members.
          </p>
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => navigate(`/trip/${tripId}`)}
          >
            <DollarSign className="mr-1.5 h-4 w-4" />
            Split Costs with Group
          </Button>
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          Go to Dashboard
        </Button>
        <Button
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={() => navigate("/explore")}
        >
          Explore More
        </Button>
      </div>
    </div>
  );
}
