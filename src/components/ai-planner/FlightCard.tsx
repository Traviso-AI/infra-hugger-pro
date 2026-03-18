import { motion } from "framer-motion";
import { Plane, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface FlightData {
  id: string;
  airline_name: string;
  airline_logo_url: string | null;
  flight_number: string | null;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  stops: number;
  price_cents: number;
  currency: string;
  cabin_class: string;
  booking_token: string;
}

interface FlightCardProps {
  flight: FlightData;
  onSelect?: (flight: FlightData) => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function FlightCard({ flight, onSelect }: FlightCardProps) {
  const price = (flight.price_cents / 100).toFixed(2);
  const stopsLabel = flight.stops === 0 ? "Nonstop" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card p-4 my-2 w-full min-w-0"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Airline */}
        <div className="flex items-center gap-2.5 min-w-0">
          {flight.airline_logo_url ? (
            <img src={flight.airline_logo_url} alt={flight.airline_name} className="h-8 w-8 rounded object-contain" />
          ) : (
            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
              <Plane className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {flight.airline_name}
              {flight.flight_number && <span className="ml-1.5 text-xs font-normal text-muted-foreground">{flight.flight_number}</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(flight.departure_time)} · <span className="capitalize">{flight.cabin_class}</span>
            </p>
          </div>
        </div>

        {/* Price */}
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-accent">${price}</p>
          <p className="text-[10px] text-muted-foreground uppercase">{flight.currency}</p>
        </div>
      </div>

      {/* Route */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="text-center">
          <p className="text-sm font-semibold">{formatTime(flight.departure_time)}</p>
        </div>
        <div className="flex-1 flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDuration(flight.duration_minutes)}
          </div>
          <div className="w-full flex items-center gap-1">
            <div className="flex-1 border-t border-dashed border-muted-foreground/40" />
            <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
          </div>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {stopsLabel}
          </Badge>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold">{formatTime(flight.arrival_time)}</p>
        </div>
      </div>

      {onSelect && (
        <Button
          size="sm"
          className="w-full mt-3 bg-accent text-accent-foreground hover:bg-accent/90 text-xs"
          onClick={() => onSelect(flight)}
        >
          Select flight
        </Button>
      )}
    </motion.div>
  );
}
