import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plane, Hotel, Utensils, Activity, Package, Check, Loader2, Music, Bus } from "lucide-react";

type LoadingStep = { label: string; icon: React.ElementType };

const typeIcon: Record<string, React.ElementType> = {
  flight: Plane, hotel: Hotel, restaurant: Utensils,
  activity: Activity, event: Music, transport: Bus,
};

export default function Booking() {
  const { tripId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [priceCalculated, setPriceCalculated] = useState(false);

  const { data: trip } = useQuery({
    queryKey: ["booking-trip", tripId],
    queryFn: async () => {
      const { data } = await supabase.from("trips").select("*").eq("id", tripId!).single();
      return data;
    },
    enabled: !!tripId,
  });

  // Fetch all activities with their details for price breakdown
  const { data: allActivities } = useQuery({
    queryKey: ["booking-all-activities", tripId],
    queryFn: async () => {
      const { data } = await supabase
        .from("trip_days")
        .select("day_number, title, trip_activities(id, title, type, price_estimate, location)")
        .eq("trip_id", tripId!)
        .order("day_number");
      return data || [];
    },
    enabled: !!tripId,
  });

  const activityTypes = useMemo(() => {
    const types = new Set<string>();
    allActivities?.forEach((day: any) =>
      day.trip_activities?.forEach((act: any) => types.add(act.type?.toLowerCase()))
    );
    return types;
  }, [allActivities]);

  const flatActivities = useMemo(() => {
    const items: { title: string; type: string; price: number }[] = [];
    allActivities?.forEach((day: any) =>
      day.trip_activities?.forEach((act: any) => {
        // Generate a mock price if none exists, based on type
        let price = act.price_estimate;
        if (!price || price <= 0) {
          const t = act.type?.toLowerCase();
          if (t === "flight") price = 280 + Math.floor(Math.random() * 200);
          else if (t === "hotel") price = 120 + Math.floor(Math.random() * 150);
          else if (t === "restaurant") price = 25 + Math.floor(Math.random() * 50);
          else if (t === "transport") price = 15 + Math.floor(Math.random() * 30);
          else price = 40 + Math.floor(Math.random() * 80);
        }
        items.push({ title: act.title, type: act.type?.toLowerCase() || "activity", price });
      })
    );
    return items;
  }, [allActivities]);

  const hasFlights = activityTypes.has("flight");
  const hasHotels = activityTypes.has("hotel");
  const hasExperiences = useMemo(() => {
    return activityTypes.has("activity") || activityTypes.has("restaurant") || activityTypes.has("experience") || activityTypes.has("event");
  }, [activityTypes]);

  const loadingSteps = useMemo(() => {
    const steps: LoadingStep[] = [];
    if (hasFlights) steps.push({ label: "Searching flights...", icon: Plane });
    if (hasHotels) steps.push({ label: "Checking hotel availability...", icon: Hotel });
    if (hasExperiences) steps.push({ label: "Calculating experiences...", icon: Activity });
    steps.push({ label: "Building your package...", icon: Package });
    return steps;
  }, [hasFlights, hasHotels, hasExperiences]);

  useEffect(() => {
    if (!calculating) return;
    if (currentStep >= loadingSteps.length) {
      setCalculating(false);
      setPriceCalculated(true);
      return;
    }
    const timer = setTimeout(() => setCurrentStep((s) => s + 1), 1200);
    return () => clearTimeout(timer);
  }, [calculating, currentStep, loadingSteps.length]);

  const handleCalculatePrice = () => {
    if (!checkIn || !checkOut) {
      toast.error("Please select travel dates first");
      return;
    }
    setCurrentStep(0);
    setCalculating(true);
    setPriceCalculated(false);
  };

  const totalPrice = useMemo(() => {
    const numGuests = parseInt(guests);
    return flatActivities.reduce((sum, a) => sum + a.price, 0) * numGuests;
  }, [flatActivities, guests]);

  const handleBook = async () => {
    if (!user || !trip) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          trip_id: trip.id,
          hotel_id: null,
          check_in: checkIn,
          check_out: checkOut,
          guests: parseInt(guests),
          total_price: totalPrice,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      toast.error(err.message || "Booking failed");
      setLoading(false);
    }
  };

  if (!trip) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
    </div>
  );

  // Group activities by type for the breakdown
  const groupedByType = useMemo(() => {
    const groups: Record<string, { items: typeof flatActivities; total: number }> = {};
    flatActivities.forEach((a) => {
      if (!groups[a.type]) groups[a.type] = { items: [], total: 0 };
      groups[a.type].items.push(a);
      groups[a.type].total += a.price;
    });
    return groups;
  }, [flatActivities]);

  const typeLabels: Record<string, string> = {
    flight: "Flights", hotel: "Accommodation", restaurant: "Dining",
    activity: "Activities", event: "Events", transport: "Transport", experience: "Experiences",
  };

  return (
    <div className="container max-w-2xl py-8 md:py-12">
      <h1 className="font-display text-3xl font-bold mb-2">Check Availability</h1>
      <p className="text-muted-foreground mb-8">
        This is a curated package — everything in the itinerary is included. Select your dates and guests to get your price.
      </p>

      <div className="space-y-6">
        {/* Dates & Guests */}
        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Travel Dates & Guests</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Check-in</Label>
                <Input type="date" value={checkIn} onChange={(e) => { setCheckIn(e.target.value); setPriceCalculated(false); }} />
              </div>
              <div className="space-y-2">
                <Label>Check-out</Label>
                <Input type="date" value={checkOut} onChange={(e) => { setCheckOut(e.target.value); setPriceCalculated(false); }} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Guests</Label>
              <Select value={guests} onValueChange={(v) => { setGuests(v); setPriceCalculated(false); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n} guest{n > 1 ? "s" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Calculate / Loading / Breakdown / Book */}
        <Card>
          <CardContent className="p-6 space-y-4">
            {/* Loading animation */}
            {calculating && (
              <div className="space-y-3">
                {loadingSteps.map((step, i) => {
                  const Icon = step.icon;
                  const done = i < currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={step.label} className={`flex items-center gap-3 text-sm transition-opacity duration-300 ${active ? "opacity-100" : done ? "opacity-60" : "opacity-30"}`}>
                      {done ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : active ? (
                        <Loader2 className="h-4 w-4 animate-spin text-accent" />
                      ) : (
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={done ? "line-through text-muted-foreground" : active ? "font-medium" : ""}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Price breakdown — only after calculation */}
            {priceCalculated && (
              <div className="space-y-3">
                <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">Package Breakdown</h3>
                {Object.entries(groupedByType).map(([type, group]) => {
                  const Icon = typeIcon[type] || Activity;
                  const label = typeLabels[type] || type;
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 font-medium">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          {label}
                        </span>
                        <span>${group.total.toLocaleString()}</span>
                      </div>
                      {group.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs text-muted-foreground pl-6">
                          <span>{item.title}</span>
                          <span>${item.price}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
                {parseInt(guests) > 1 && (
                  <div className="flex justify-between text-sm text-muted-foreground border-t pt-2">
                    <span>× {guests} guests</span>
                    <span></span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-3">
                  <span>Total</span>
                  <span>${totalPrice.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Buttons */}
            {!priceCalculated ? (
              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                size="lg"
                onClick={handleCalculatePrice}
                disabled={calculating}
              >
                {calculating ? "Calculating..." : "Calculate Price →"}
              </Button>
            ) : (
              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_0_20px_hsl(var(--accent)/0.3)]"
                size="lg"
                onClick={handleBook}
                disabled={loading}
              >
                {loading ? "Processing..." : "Confirm & Book →"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
