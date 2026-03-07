import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { MapPin, Calendar, Users as UsersIcon } from "lucide-react";

export default function Booking() {
  const { tripId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");
  const [selectedHotel, setSelectedHotel] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [priceCalculated, setPriceCalculated] = useState(false);

  const { data: trip } = useQuery({
    queryKey: ["booking-trip", tripId],
    queryFn: async () => {
      const { data } = await supabase.from("trips").select("*").eq("id", tripId!).single();
      return data;
    },
    enabled: !!tripId,
  });

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
      const totalPrice = (trip.price_estimate || 0) + hotelCost;

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

  const hasPrice = trip?.price_estimate && trip.price_estimate > 0;

  const handleCalculatePrice = () => {
    toast.info("Live pricing coming soon — we're working on it!");
    setPriceCalculated(true);
  };

  if (!trip) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
    </div>
  );

  return (
    <div className="container max-w-2xl py-8 md:py-12">
      <h1 className="font-display text-3xl font-bold mb-2">Check Availability</h1>
      <p className="text-muted-foreground mb-8">Select your travel dates and number of guests to see live pricing for flights, hotels, and experiences.</p>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Travel Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Check-in</Label>
                <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Check-out</Label>
                <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Guests</Label>
              <Select value={guests} onValueChange={setGuests}>
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
            <CardHeader>
              <CardTitle className="font-display text-lg">Select Hotel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {hotels.map((hotel) => (
                <div
                  key={hotel.id}
                  className={`cursor-pointer rounded-lg border p-4 transition-colors ${selectedHotel === hotel.id ? "border-accent bg-accent/5" : "hover:border-accent/50"}`}
                  onClick={() => setSelectedHotel(hotel.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{hotel.name}</h4>
                      <p className="text-sm text-muted-foreground">{hotel.star_rating}★ · {hotel.amenities?.slice(0, 3).join(", ")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${hotel.price_per_night}</p>
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
            {hasPrice && (
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Trip package</span>
                  <span>${trip.price_estimate!.toLocaleString()}</span>
                </div>
                {selectedHotel && checkIn && checkOut && (() => {
                  const hotel = hotels?.find((h) => h.id === selectedHotel);
                  const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
                  return hotel ? (
                    <div className="flex justify-between text-sm">
                      <span>{hotel.name} ({nights} nights)</span>
                      <span>${(hotel.price_per_night * nights).toLocaleString()}</span>
                    </div>
                  ) : null;
                })()}
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total</span>
                  <span>
                    ${(() => {
                      const hotel = hotels?.find((h) => h.id === selectedHotel);
                      const nights = checkIn && checkOut ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                      return (trip.price_estimate! + (hotel ? hotel.price_per_night * nights : 0)).toLocaleString();
                    })()}
                  </span>
                </div>
              </div>
            )}
            {hasPrice || priceCalculated ? (
              <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg" onClick={handleBook} disabled={loading}>
                {loading ? "Processing..." : "Confirm Booking"}
              </Button>
            ) : (
              <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg" onClick={handleCalculatePrice}>
                Calculate Price →
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
