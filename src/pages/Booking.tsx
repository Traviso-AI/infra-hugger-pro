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
import { Plane, Hotel, Utensils, Activity, Package, Check, Loader2 } from "lucide-react";

type LoadingStep = { label: string; icon: React.ElementType };

export default function Booking() {
  const { tripId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");
  const [selectedHotel, setSelectedHotel] = useState<string>("");
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

  const { data: activities } = useQuery({
    queryKey: ["booking-activities", tripId],
    queryFn: async () => {
      const { data } = await supabase
        .from("trip_days")
        .select("trip_activities(type)")
        .eq("trip_id", tripId!);
      const types = new Set<string>();
      data?.forEach((day: any) =>
        day.trip_activities?.forEach((act: any) => types.add(act.type?.toLowerCase()))
      );
      return types;
    },
    enabled: !!tripId,
  });

  const hasFlights = activities?.has("flight") ?? false;
  const hasHotels = activities?.has("hotel") ?? false;
  const hasExperiences = useMemo(() => {
    if (!activities) return false;
    return activities.has("activity") || activities.has("restaurant") || activities.has("experience") || activities.has("event");
  }, [activities]);

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

  const { data: hotels } = useQuery({
    queryKey: ["hotels", trip?.destination],
    queryFn: async () => {
      const { data } = await supabase
        .from("hotel_inventory")
        .select("*")
        .ilike("destination", `%${trip!.destination}%`)
        .eq("available", true)
        .order("price_per_night");
      return data || [];
    },
    enabled: !!trip?.destination,
  });

  const handleCalculatePrice = () => {
    if (!checkIn || !checkOut) {
      toast.error("Please select travel dates first");
      return;
    }
    setCurrentStep(0);
    setCalculating(true);
  };

  const handleBook = async () => {
    if (!user || !trip) return;
    if (!checkIn || !checkOut) {
      toast.error("Please select check-in and check-out dates");
      return;
    }
    setLoading(true);
    try {
      const hotel = hotels?.find((h) => h.id === selectedHotel);
      const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
      const hotelCost = hotel ? hotel.price_per_night * nights : 0;
      const totalPrice = hotelCost;

      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          trip_id: trip.id,
          hotel_id: selectedHotel || null,
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

  const nights = checkIn && checkOut
    ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const hotel = hotels?.find((h) => h.id === selectedHotel);

  return (
    <div className="container max-w-2xl py-8 md:py-12">
      <h1 className="font-display text-3xl font-bold mb-2">Check Availability</h1>
      <p className="text-muted-foreground mb-8">Select your travel dates and number of guests to see live pricing.</p>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Travel Dates</CardTitle></CardHeader>
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

        {hotels && hotels.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="font-display text-lg">Select Hotel</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {hotels.map((h) => (
                <div
                  key={h.id}
                  className={`cursor-pointer rounded-lg border p-4 transition-colors ${selectedHotel === h.id ? "border-accent bg-accent/5" : "hover:border-accent/50"}`}
                  onClick={() => { setSelectedHotel(h.id); setPriceCalculated(false); }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{h.name}</h4>
                      <p className="text-sm text-muted-foreground">{h.star_rating}★ · {h.amenities?.slice(0, 3).join(", ")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${h.price_per_night}</p>
                      <p className="text-xs text-muted-foreground">per night</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            {calculating && (
              <div className="space-y-3 mb-4">
                {loadingSteps.map((step, i) => {
                  const Icon = step.icon;
                  const done = i < currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={step.label} className={`flex items-center gap-3 text-sm transition-opacity ${active ? "opacity-100" : done ? "opacity-60" : "opacity-30"}`}>
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

            {priceCalculated && (
              <div className="space-y-2 mb-4">
                {hasFlights && (
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2"><Plane className="h-3.5 w-3.5 text-muted-foreground" /> Flights</span>
                    <span className="text-muted-foreground italic text-xs">Live pricing coming soon</span>
                  </div>
                )}
                {hasHotels && hotel && nights > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2"><Hotel className="h-3.5 w-3.5 text-muted-foreground" /> {hotel.name} ({nights} nights)</span>
                    <span>${(hotel.price_per_night * nights).toLocaleString()}</span>
                  </div>
                )}
                {hasHotels && !hotel && (
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2"><Hotel className="h-3.5 w-3.5 text-muted-foreground" /> Hotel</span>
                    <span className="text-muted-foreground italic text-xs">Select a hotel above</span>
                  </div>
                )}
                {hasExperiences && (
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-muted-foreground" /> Experiences</span>
                    <span className="text-muted-foreground italic text-xs">Live pricing coming soon</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Estimated Total</span>
                  <span>{hotel && nights > 0 ? `$${(hotel.price_per_night * nights).toLocaleString()}+` : "TBD"}</span>
                </div>
              </div>
            )}

            {priceCalculated ? (
              <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg" onClick={handleBook} disabled={loading}>
                {loading ? "Processing..." : "Confirm Booking"}
              </Button>
            ) : (
              <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg" onClick={handleCalculatePrice} disabled={calculating}>
                {calculating ? "Calculating..." : "Calculate Price →"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
