import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plane, Hotel, Activity, Shield, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
export default function Booking() {
  const { tripId } = useParams();
  const [searchParams] = useSearchParams();
  const tripSessionId = searchParams.get("session") ?? tripId;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [passport, setPassport] = useState("");

  const [session, setSession] = useState<any | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    if (!tripSessionId || !user) return;
    (supabase as any)
      .from("trip_sessions")
      .select("*")
      .eq("id", tripSessionId)
      .eq("user_id", user.id)
      .single()
      .then(({ data, error }: any) => {
        if (!error && data) setSession(data);
        setSessionLoading(false);
      });
  }, [tripSessionId, user]);

  const flights = useMemo(() => (session?.selected_flights as any[] | null) ?? [], [session]);
  const hotels = useMemo(() => (session?.selected_hotels as any[] | null) ?? [], [session]);
  const activities = useMemo(() => (session?.selected_activities as any[] | null) ?? [], [session]);
  const restaurants = useMemo(() => (session?.selected_restaurants as any[] | null) ?? [], [session]);

  const totalCents = session?.total_amount_cents ?? 0;
  const totalDollars = (totalCents / 100).toFixed(2);

  const hasFlights = flights.length > 0;

  const canSubmit = firstName.trim() && lastName.trim() && email.trim() && phone.trim() &&
    (!hasFlights || passport.trim());

  const handleCheckout = async () => {
    if (!user || !session) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          trip_session_id: tripSessionId,
          traveler: { first_name: firstName, last_name: lastName, email, phone: phone || undefined, passport: passport || undefined },
        },
      });
      if (error) throw error;
      const url = typeof data === "string" ? JSON.parse(data)?.url : data?.url;
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Checkout failed");
      setLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container max-w-lg py-16 text-center">
        <h1 className="font-display text-2xl font-bold mb-2">Session Not Found</h1>
        <p className="text-muted-foreground mb-6">This booking session doesn't exist or has expired.</p>
        <Button onClick={() => navigate("/explore")}>Explore Trips</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl px-4 py-6 md:py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-1">Complete Your Booking</h1>
        <p className="text-muted-foreground text-sm mb-6">Review your selections and enter traveler details.</p>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle className="font-display text-lg">Package Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {flights.map((f: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Plane className="h-4 w-4 text-muted-foreground" />
                    {f.airline_name ?? "Flight"} — {f.cabin_class ?? "economy"}
                  </span>
                  <span className="font-medium">${(f.price_cents / 100).toFixed(0)}</span>
                </div>
              ))}
              {hotels.map((h: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Hotel className="h-4 w-4 text-muted-foreground" />
                    {h.name ?? "Hotel"} — {h.stars ? `${h.stars}*` : ""}
                  </span>
                  <span className="font-medium">${(h.total_price_cents / 100).toFixed(0)}</span>
                </div>
              ))}
              {activities.map((a: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    {a.title ?? "Activity"}
                  </span>
                  <span className="font-medium">${(a.price_cents / 100).toFixed(0)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-lg border-t pt-3 mt-3">
                <span>Total</span>
                <span className="text-accent">${totalDollars}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="font-display text-lg">Traveler Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Smith" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <PhoneInput
                  defaultCountry="us"
                  value={phone}
                  onChange={(phone) => setPhone(phone)}
                  inputClassName="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  countrySelectorStyleProps={{
                    buttonClassName: "h-10 border border-input bg-background px-2 rounded-l-md border-r-0",
                  }}
                />
                <p className="text-[11px] text-muted-foreground">Used for flight notifications</p>
              </div>
              {hasFlights && (
                <div className="space-y-2">
                  <Label>Passport Number *</Label>
                  <Input value={passport} onChange={(e) => setPassport(e.target.value)} placeholder="AB1234567" />
                  <p className="text-[11px] text-muted-foreground">Required for international flights</p>
                </div>
              )}
            </CardContent>
          </Card>

          {restaurants.length > 0 && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Don't forget to reserve your restaurants
              </p>
              <p className="text-xs text-muted-foreground">
                Restaurant reservations are not included in checkout — please book directly before your trip.
              </p>
              <div className="space-y-1.5 pt-1">
                {restaurants.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between">
                    <span className="text-sm">{r.name}</span>
                    <a
                      href={r.opentable_url ?? `https://www.google.com/maps/search/${encodeURIComponent(r.name + " " + (r.address ?? ""))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent underline underline-offset-2"
                    >
                      Reserve →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              <span>Secure checkout powered by Stripe. Your payment details are never stored.</span>
            </div>
            <Button
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_0_20px_hsl(var(--accent)/0.3)] text-base py-6"
              onClick={handleCheckout}
              disabled={loading || !canSubmit}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Redirecting to checkout...
                </>
              ) : (
                `Pay $${totalDollars} →`
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
