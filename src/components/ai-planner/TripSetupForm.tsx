import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plane, Hotel, Compass, UtensilsCrossed, LayoutGrid, Loader2 } from "lucide-react";
import { NalaAvatar } from "./NalaAvatar";
import { PlaceAutocomplete } from "./PlaceAutocomplete";

type Tab = "full" | "flights" | "hotels" | "activities" | "restaurants";

interface TripSetupFormProps {
  onSubmit: (message: string, needs: string[]) => void;
  loading?: boolean;
}

function PillToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
        active
          ? "bg-accent text-accent-foreground border-accent"
          : "bg-transparent text-muted-foreground border-muted hover:border-foreground/20"
      }`}
    >
      {label}
    </button>
  );
}

export function TripSetupForm({ onSubmit, loading }: TripSetupFormProps) {
  const [tab, setTab] = useState<Tab>("full");

  // Full trip state
  const [dest, setDest] = useState("");
  const [origin, setOrigin] = useState("");
  const [depDate, setDepDate] = useState("");
  const [retDate, setRetDate] = useState("");
  const [roundTrip, setRoundTrip] = useState(false);
  const [travelers, setTravelers] = useState("2");
  const [needs, setNeeds] = useState({ flights: true, hotels: true, activities: false, restaurants: false });
  const [special, setSpecial] = useState("");

  // Flights tab
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const [fDep, setFDep] = useState("");
  const [fRet, setFRet] = useState("");
  const [fRT, setFRT] = useState(false);
  const [fPax, setFPax] = useState("2");

  // Hotels tab
  const [hDest, setHDest] = useState("");
  const [hIn, setHIn] = useState("");
  const [hOut, setHOut] = useState("");
  const [hGuests, setHGuests] = useState("2");
  const [hPref, setHPref] = useState("");

  // Activities tab
  const [aDest, setADest] = useState("");
  const [aStart, setAStart] = useState("");
  const [aEnd, setAEnd] = useState("");
  const [aPeople, setAPeople] = useState("2");
  const [aInterests, setAInterests] = useState("");

  // Restaurants tab
  const [rDest, setRDest] = useState("");
  const [rDate, setRDate] = useState("");
  const [rParty, setRParty] = useState("2");
  const [rCuisine, setRCuisine] = useState("");

  const [errors, setErrors] = useState<Set<string>>(new Set());

  const today = new Date().toISOString().split("T")[0];

  const toggleNeed = (key: keyof typeof needs) => setNeeds((p) => ({ ...p, [key]: !p[key] }));

  const validate = (fields: Record<string, string>): boolean => {
    const missing = new Set<string>();
    for (const [k, v] of Object.entries(fields)) {
      if (!v.trim()) missing.add(k);
    }
    setErrors(missing);
    return missing.size === 0;
  };

  const errorClass = (field: string) => errors.has(field) ? "border-red-400 ring-1 ring-red-400/30" : "";

  const handleSubmit = () => {
    if (tab === "full") {
      const required: Record<string, string> = { dest, depDate };
      if (needs.flights) required.origin = origin;
      if (!validate(required)) return;

      const needsList = Object.entries(needs).filter(([, v]) => v).map(([k]) => k);
      const msg = `[TRAVISO BRIEF] destination=${dest} origin=${origin || "none"} departure=${depDate} return=${roundTrip && retDate ? retDate : "null"} travelers=${travelers} needs=${needsList.join(",")} preferences=${special || "none"}`;
      onSubmit(msg, needsList);
    } else if (tab === "flights") {
      if (!validate({ fFrom, fTo, fDep })) return;
      const msg = `[TRAVISO BRIEF] destination=${fTo} origin=${fFrom} departure=${fDep} return=${fRT && fRet ? fRet : "null"} travelers=${fPax} needs=flights preferences=none`;
      onSubmit(msg, ["flights"]);
    } else if (tab === "hotels") {
      if (!validate({ hDest, hIn, hOut })) return;
      const msg = `[TRAVISO BRIEF] destination=${hDest} origin=none departure=${hIn} return=${hOut} travelers=${hGuests} needs=hotels preferences=${hPref || "none"}`;
      onSubmit(msg, ["hotels"]);
    } else if (tab === "activities") {
      if (!validate({ aDest })) return;
      const msg = `[TRAVISO BRIEF] destination=${aDest} origin=none departure=${aStart || "null"} return=${aEnd || "null"} travelers=${aPeople} needs=activities preferences=${aInterests || "none"}`;
      onSubmit(msg, ["activities"]);
    } else if (tab === "restaurants") {
      if (!validate({ rDest })) return;
      const msg = `[TRAVISO BRIEF] destination=${rDest} origin=none departure=${rDate || "null"} return=null travelers=${rParty} needs=restaurants preferences=${rCuisine || "none"}`;
      onSubmit(msg, ["restaurants"]);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "full", label: "Package", icon: LayoutGrid },
    { id: "flights", label: "Flights", icon: Plane },
    { id: "hotels", label: "Hotels", icon: Hotel },
    { id: "activities", label: "Activities", icon: Compass },
    { id: "restaurants", label: "Restaurants", icon: UtensilsCrossed },
  ];

  return (
    <div className="py-6">
      <div className="flex justify-center mb-4">
        <NalaAvatar size="lg" showOnline />
      </div>
      <h2 className="font-display text-2xl font-bold mb-1 text-center">Brief Nala</h2>
      <p className="text-xs text-muted-foreground mb-6 text-center">Tell me about your trip and I'll handle the rest.</p>

      <div className="max-w-md mx-auto w-full min-w-0">
        <div className="bg-card/80 backdrop-blur border border-border/50 rounded-2xl shadow-xl overflow-visible">
          {/* Tab bar */}
          <div className="flex border-b overflow-hidden rounded-t-2xl">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setErrors(new Set()); }}
                className={`flex w-1/5 items-center justify-center gap-1 py-2.5 text-xs font-medium border-b-2 transition-colors min-w-0 ${
                  tab === t.id
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                {tab === "full" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Destination *</Label>
                        <PlaceAutocomplete placeholder="e.g. London, UK" value={dest} onChange={setDest} className={`h-10 ${errorClass("dest")}`} autoFocus />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Flying from {needs.flights && "*"}</Label>
                        <PlaceAutocomplete placeholder="e.g. Seattle, USA" value={origin} onChange={setOrigin} className={`h-10 ${errorClass("origin")}`} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setRoundTrip(false)} className={`text-xs px-2.5 py-1 rounded-md ${!roundTrip ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>One Way</button>
                      <button type="button" onClick={() => setRoundTrip(true)} className={`text-xs px-2.5 py-1 rounded-md ${roundTrip ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>Round Trip</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Departure *</Label>
                        <Input type="date" value={depDate} min={today} onChange={(e) => setDepDate(e.target.value)} className={`h-10 ${errorClass("depDate")}`} />
                      </div>
                      {roundTrip && (
                        <div className="space-y-1">
                          <Label className="text-xs">Return</Label>
                          <Input type="date" value={retDate} min={depDate || today} onChange={(e) => setRetDate(e.target.value)} className="h-10" />
                        </div>
                      )}
                      {!roundTrip && (
                        <div className="space-y-1">
                          <Label className="text-xs">Travelers</Label>
                          <Input type="number" min="1" max="9" value={travelers} onChange={(e) => setTravelers(e.target.value)} className="h-10" />
                        </div>
                      )}
                    </div>
                    {roundTrip && (
                      <div className="space-y-1">
                        <Label className="text-xs">Travelers</Label>
                        <Input type="number" min="1" max="9" value={travelers} onChange={(e) => setTravelers(e.target.value)} className="h-10 w-24" />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label className="text-xs">What to include</Label>
                      <div className="flex flex-wrap gap-1.5">
                        <PillToggle label="Flights" active={needs.flights} onClick={() => toggleNeed("flights")} />
                        <PillToggle label="Hotels" active={needs.hotels} onClick={() => toggleNeed("hotels")} />
                        <PillToggle label="Activities" active={needs.activities} onClick={() => toggleNeed("activities")} />
                        <PillToggle label="Restaurants" active={needs.restaurants} onClick={() => toggleNeed("restaurants")} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Special requests</Label>
                      <Input placeholder="e.g. pet friendly, halal food, wheelchair accessible" value={special} onChange={(e) => setSpecial(e.target.value)} className="h-10" />
                    </div>
                  </>
                )}

                {tab === "flights" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">From *</Label>
                        <PlaceAutocomplete placeholder="e.g. Seattle, USA" value={fFrom} onChange={setFFrom} className={`h-10 ${errorClass("fFrom")}`} autoFocus />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">To *</Label>
                        <PlaceAutocomplete placeholder="e.g. London, UK" value={fTo} onChange={setFTo} className={`h-10 ${errorClass("fTo")}`} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setFRT(false)} className={`text-xs px-2.5 py-1 rounded-md ${!fRT ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>One Way</button>
                      <button type="button" onClick={() => setFRT(true)} className={`text-xs px-2.5 py-1 rounded-md ${fRT ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>Round Trip</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Departure *</Label>
                        <Input type="date" value={fDep} min={today} onChange={(e) => setFDep(e.target.value)} className={`h-10 ${errorClass("fDep")}`} />
                      </div>
                      {fRT && (
                        <div className="space-y-1">
                          <Label className="text-xs">Return</Label>
                          <Input type="date" value={fRet} min={fDep || today} onChange={(e) => setFRet(e.target.value)} className="h-10" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Passengers</Label>
                      <Input type="number" min="1" max="9" value={fPax} onChange={(e) => setFPax(e.target.value)} className="h-10 w-24" />
                    </div>
                  </>
                )}

                {tab === "hotels" && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">Destination *</Label>
                      <PlaceAutocomplete placeholder="e.g. Paris, France" value={hDest} onChange={setHDest} className={`h-10 ${errorClass("hDest")}`} autoFocus />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Check-in *</Label>
                        <Input type="date" value={hIn} min={today} onChange={(e) => setHIn(e.target.value)} className={`h-10 ${errorClass("hIn")}`} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Check-out *</Label>
                        <Input type="date" value={hOut} min={hIn || today} onChange={(e) => setHOut(e.target.value)} className={`h-10 ${errorClass("hOut")}`} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Guests</Label>
                      <Input type="number" min="1" max="9" value={hGuests} onChange={(e) => setHGuests(e.target.value)} className="h-10 w-24" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Preferences</Label>
                      <Input placeholder="e.g. beachfront, city center, spa" value={hPref} onChange={(e) => setHPref(e.target.value)} className="h-10" />
                    </div>
                  </>
                )}

                {tab === "activities" && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">Destination *</Label>
                      <PlaceAutocomplete placeholder="e.g. Tokyo, Japan" value={aDest} onChange={setADest} className={`h-10 ${errorClass("aDest")}`} autoFocus />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Start date</Label>
                        <Input type="date" value={aStart} min={today} onChange={(e) => setAStart(e.target.value)} className="h-10" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">End date</Label>
                        <Input type="date" value={aEnd} min={aStart || today} onChange={(e) => setAEnd(e.target.value)} className="h-10" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">People</Label>
                      <Input type="number" min="1" max="9" value={aPeople} onChange={(e) => setAPeople(e.target.value)} className="h-10 w-24" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Interests</Label>
                      <Input placeholder="e.g. outdoor, food tours, museums" value={aInterests} onChange={(e) => setAInterests(e.target.value)} className="h-10" />
                    </div>
                  </>
                )}

                {tab === "restaurants" && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">Destination *</Label>
                      <PlaceAutocomplete placeholder="e.g. Barcelona, Spain" value={rDest} onChange={setRDest} className={`h-10 ${errorClass("rDest")}`} autoFocus />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Date</Label>
                        <Input type="date" value={rDate} min={today} onChange={(e) => setRDate(e.target.value)} className="h-10" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Party size</Label>
                        <Input type="number" min="1" max="20" value={rParty} onChange={(e) => setRParty(e.target.value)} className="h-10" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Cuisine</Label>
                      <Input placeholder="e.g. Italian, sushi, vegan" value={rCuisine} onChange={(e) => setRCuisine(e.target.value)} className="h-10" />
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <Button
              className="w-full mt-4 bg-accent text-accent-foreground hover:bg-accent/90 h-11 text-sm font-medium"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Brief Nala →
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
