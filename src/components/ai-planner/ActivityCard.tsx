import { motion } from "framer-motion";
import { Star, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ActivityData {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price_cents: number;
  currency: string;
  duration_minutes: number | null;
  rating: number | null;
  review_count: number;
  category: string | null;
  booking_url: string | null;
  booking_token: string;
}

interface ActivityCardProps {
  activity: ActivityData;
  onSelect?: (activity: ActivityData) => void;
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function ActivityCard({ activity, onSelect }: ActivityCardProps) {
  const price = (activity.price_cents / 100).toFixed(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card overflow-hidden my-2"
    >
      <div className="flex">
        {/* Image */}
        {activity.image_url && (
          <div className="w-28 sm:w-36 shrink-0">
            <img
              src={activity.image_url}
              alt={activity.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Details */}
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
          <div>
            <p className="text-sm font-medium line-clamp-2">{activity.title}</p>

            <div className="flex items-center gap-2.5 mt-1 flex-wrap">
              {activity.rating && (
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {activity.rating.toFixed(1)}
                  <span className="text-[10px]">({activity.review_count.toLocaleString()})</span>
                </span>
              )}
              {activity.duration_minutes && (
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDuration(activity.duration_minutes)}
                </span>
              )}
              {activity.category && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {activity.category}
                </Badge>
              )}
            </div>

            {activity.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{activity.description}</p>
            )}
          </div>

          <div className="flex items-end justify-between mt-2 gap-2">
            <div>
              <p className="text-lg font-bold text-accent">
                ${price}<span className="text-xs font-normal text-muted-foreground">/person</span>
              </p>
              <p className="text-[10px] text-muted-foreground uppercase">{activity.currency}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {activity.booking_url && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs px-2"
                  asChild
                >
                  <a href={activity.booking_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </a>
                </Button>
              )}
              {onSelect && (
                <Button
                  size="sm"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs"
                  onClick={() => onSelect(activity)}
                >
                  Add
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
