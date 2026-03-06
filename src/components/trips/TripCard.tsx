import { Link } from "react-router-dom";
import { MapPin, Star, Users, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TripCardProps {
  id: string;
  title: string;
  destination: string;
  coverImage?: string | null;
  durationDays: number;
  priceEstimate?: number | null;
  avgRating?: number | null;
  totalBookings?: number | null;
  creatorName?: string;
  creatorAvatar?: string | null;
  tags?: string[] | null;
}

export function TripCard({
  id, title, destination, coverImage, durationDays, priceEstimate,
  avgRating, totalBookings, creatorName, creatorAvatar, tags,
}: TripCardProps) {
  return (
    <Link to={`/trip/${id}`} className="group block">
      <div className="overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg hover:-translate-y-1">
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          {coverImage ? (
            <img
              src={coverImage}
              alt={title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-accent/20 to-accent/5">
              <MapPin className="h-12 w-12 text-accent/40" />
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-medium text-muted-foreground">{destination}</span>
          </div>
          <h3 className="font-display text-lg font-semibold leading-tight mb-2 line-clamp-2">{title}</h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {durationDays} day{durationDays > 1 ? "s" : ""}
            </span>
            {avgRating && avgRating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-sunset text-sunset" /> {avgRating.toFixed(1)}
              </span>
            )}
            {totalBookings && totalBookings > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {totalBookings} booked
              </span>
            )}
          </div>
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between">
            {creatorName && (
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent">
                  {creatorName[0]}
                </div>
                <span className="text-xs text-muted-foreground">{creatorName}</span>
              </div>
            )}
            {priceEstimate && (
              <span className="text-sm font-semibold">
                ${priceEstimate.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
