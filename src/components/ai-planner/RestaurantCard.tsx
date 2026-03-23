import { motion } from "framer-motion";
import { Star, MapPin, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface RestaurantData {
  id: string;
  name: string;
  cuisine: string | null;
  price_range: string | null;
  rating: number | null;
  review_count: number;
  image_url: string | null;
  address: string | null;
  opentable_url: string | null;
  affiliate_enabled: boolean;
}

interface RestaurantCardProps {
  restaurant: RestaurantData;
  onSelect?: (restaurant: RestaurantData) => void;
}

export function RestaurantCard({ restaurant, onSelect }: RestaurantCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card overflow-hidden my-2 w-full min-w-0"
    >
      <div className="flex">
        {/* Image */}
        {restaurant.image_url && (
          <div className="w-28 sm:w-36 shrink-0 min-h-[120px]">
            <img
              src={restaurant.image_url}
              alt={restaurant.name}
              className="h-full w-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Details */}
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
          <div>
            <p className="text-sm font-medium truncate">{restaurant.name}</p>

            <div className="flex items-center gap-2.5 mt-1 flex-wrap">
              {restaurant.rating && (
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {restaurant.rating.toFixed(1)}
                  <span className="text-[10px]">({restaurant.review_count.toLocaleString()})</span>
                </span>
              )}
              {restaurant.price_range && (
                <span className="text-xs font-medium text-muted-foreground">
                  {restaurant.price_range}
                </span>
              )}
              {restaurant.cuisine && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {restaurant.cuisine}
                </Badge>
              )}
            </div>

            {restaurant.address && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{restaurant.address}</span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-end mt-2 gap-1.5">
            <Button size="sm" variant="outline" className="text-xs px-2" asChild>
              <a
                href={restaurant.opentable_url ?? `https://www.google.com/maps/search/${encodeURIComponent(restaurant.name + " " + (restaurant.address ?? ""))}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Reserve a Table
              </a>
            </Button>
            {onSelect && (
              <Button
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs"
                onClick={() => onSelect(restaurant)}
              >
                Add to trip
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
