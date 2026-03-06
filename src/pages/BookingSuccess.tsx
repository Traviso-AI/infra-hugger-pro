import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(true);
  const [saved, setSaved] = useState(false);
  const [destination, setDestination] = useState("");

  useEffect(() => {
    const saveBooking = async () => {
      if (!user) return;

      const sessionId = searchParams.get("session_id");
      const tripId = searchParams.get("trip_id");
      const hotelId = searchParams.get("hotel_id") || null;
      const checkIn = searchParams.get("check_in");
      const checkOut = searchParams.get("check_out");
      const guests = parseInt(searchParams.get("guests") || "1");
      const totalPrice = parseFloat(searchParams.get("total_price") || "0");

      if (!tripId || !sessionId) {
        toast.error("Missing booking information");
        setSaving(false);
        return;
      }

      // Check for existing booking with same stripe_payment_id to prevent duplicates
      const { data: existingBooking } = await supabase
        .from("bookings")
        .select("id")
        .eq("stripe_payment_id", sessionId)
        .maybeSingle();

      if (existingBooking) {
        // Already saved — fetch destination for display
        const { data: trip } = await supabase
          .from("trips")
          .select("destination")
          .eq("id", tripId)
          .single();
        if (trip) setDestination(trip.destination);
        setSaved(true);
        setSaving(false);
        return;
      }

      // Fetch current trip stats for increment
      const { data: currentTrip } = await supabase
        .from("trips")
        .select("commission_rate, destination, total_bookings, total_revenue")
        .eq("id", tripId)
        .single();

      if (currentTrip) setDestination(currentTrip.destination);
      const commission = totalPrice * ((currentTrip?.commission_rate || 10) / 100);

      const { error } = await supabase.from("bookings").insert({
        user_id: user.id,
        trip_id: tripId,
        hotel_id: hotelId || null,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        total_price: totalPrice,
        commission_amount: commission,
        status: "confirmed",
        stripe_payment_id: sessionId,
      });

      if (error) {
        console.error("Booking save error:", error);
        toast.error("Payment succeeded but booking save failed. Please contact support.");
      } else {
        // Update trip stats: increment total_bookings and total_revenue
        await supabase
          .from("trips")
          .update({
            total_bookings: (trip?.total_bookings ?? 0) + 1,
            total_revenue: (trip?.total_revenue ?? 0) + totalPrice,
          } as any)
          .eq("id", tripId);

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
