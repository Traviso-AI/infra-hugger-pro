import { motion } from "framer-motion";
import { Plane, Hotel, Activity, Utensils, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FlightData } from "./FlightCard";
import type { HotelData } from "./HotelCard";
import type { ActivityData } from "./ActivityCard";
import type { RestaurantData } from "./RestaurantCard";

export interface TripSummaryData {
  destination: string;
  dates: string;
  travelers: number;
  flight?: FlightData;
  hotel?: HotelData;
  activities: ActivityData[];
  restaurants: RestaurantData[];
}

interface TripSummaryCardProps {
  trip: TripSummaryData;
  onCheckout?: (trip: TripSummaryData) => void;
}

interface LineItemProps {
  icon: React.ElementType;
  label: string;
  detail: string;
  amount: string;
}

function LineItem({ icon: Icon, label, detail, amount }: LineItemProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{detail}</p>
      </div>
      <p className="text-sm font-semibold shrink-0">{amount}</p>
    </div>
  );
}

export function TripSummaryCard({ trip, onCheckout }: TripSummaryCardProps) {
  let totalCents = 0;

  if (trip.flight) totalCents += trip.flight.price_cents * trip.travelers;
  if (trip.hotel) totalCents += trip.hotel.total_price_cents;
  for (const a of trip.activities) totalCents += a.price_cents * trip.travelers;

  const total = (totalCents / 100).toFixed(2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card overflow-hidden my-3"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-muted/50 border-b">
        <p className="text-sm font-semibold">Trip Summary</p>
        <p className="text-xs text-muted-foreground">{trip.destination} · {trip.dates} · {trip.travelers} traveler{trip.travelers !== 1 ? "s" : ""}</p>
      </div>

      {/* Line items */}
      <div className="px-4 divide-y">
        {trip.flight && (
          <LineItem
            icon={Plane}
            label={trip.flight.airline_name}
            detail={`${trip.flight.stops === 0 ? "Nonstop" : `${trip.flight.stops} stop`} · ${trip.flight.cabin_class}`}
            amount={`$${((trip.flight.price_cents * trip.travelers) / 100).toFixed(0)}`}
          />
        )}

        {trip.hotel && (
          <LineItem
            icon={Hotel}
            label={trip.hotel.name}
            detail={trip.hotel.address ?? ""}
            amount={`$${(trip.hotel.total_price_cents / 100).toFixed(0)}`}
          />
        )}

        {trip.activities.map((a) => (
          <LineItem
            key={a.id}
            icon={Activity}
            label={a.title}
            detail={a.duration_minutes ? `${Math.floor(a.duration_minutes / 60)}h` : ""}
            amount={`$${((a.price_cents * trip.travelers) / 100).toFixed(0)}`}
          />
        ))}

        {trip.restaurants.map((r) => (
          <LineItem
            key={r.id}
            icon={Utensils}
            label={r.name}
            detail={[r.cuisine, r.price_range].filter(Boolean).join(" · ")}
            amount=""
          />
        ))}
      </div>

      {/* Total + CTA */}
      <div className="px-4 py-3 border-t bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Estimated Total</p>
          <p className="text-xl font-bold text-accent">${total}</p>
        </div>
        {onCheckout && (
          <Button
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => onCheckout(trip)}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Proceed to Checkout
          </Button>
        )}
      </div>
    </motion.div>
  );
}
