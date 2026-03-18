import { motion } from "framer-motion";
import { Star, MapPin, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface HotelData {
  id: string;
  name: string;
  stars: number | null;
  address: string | null;
  image_url: string | null;
  price_per_night_cents: number;
  total_price_cents: number;
  currency: string;
  cancellation_policy: string;
  booking_token: string | null;
}

interface HotelCardProps {
  hotel: HotelData;
  onSelect?: (hotel: HotelData) => void;
}

export function HotelCard({ hotel, onSelect }: HotelCardProps) {
  const perNight = (hotel.price_per_night_cents / 100).toFixed(0);
  const total = (hotel.total_price_cents / 100).toFixed(0);
  const isFreeCancel = hotel.cancellation_policy?.startsWith("Free");

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card overflow-hidden my-2"
    >
      <div className="flex">
        {/* Image */}
        {hotel.image_url && (
          <div className="w-28 sm:w-36 shrink-0 min-h-[120px]">
            <img
              src={hotel.image_url}
              alt={hotel.name}
              className="h-full w-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Details */}
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium truncate">{hotel.name}</p>
              {hotel.stars && (
                <div className="flex items-center gap-0.5 shrink-0">
                  {Array.from({ length: hotel.stars }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              )}
            </div>

            {hotel.address && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{hotel.address}</span>
              </p>
            )}

            {isFreeCancel && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-1.5 text-green-600 border-green-200">
                <Shield className="h-2.5 w-2.5 mr-0.5" />
                {hotel.cancellation_policy}
              </Badge>
            )}
          </div>

          <div className="flex items-end justify-between mt-2 gap-2">
            <div>
              <p className="text-lg font-bold text-accent">${perNight}<span className="text-xs font-normal text-muted-foreground">/night</span></p>
              <p className="text-[10px] text-muted-foreground">${total} total · {hotel.currency}</p>
            </div>
            {onSelect && (
              <Button
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs shrink-0"
                onClick={() => onSelect(hotel)}
              >
                Select
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
