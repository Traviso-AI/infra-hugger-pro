import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { ShareTripModal } from "@/components/sharing/ShareTripModal";

interface TripSidebarProps {
  trip: any;
  creator: any;
  onBook: () => void;
  searchParams: URLSearchParams;
  user: any;
}

export function TripSidebar({ trip, creator, onBook, searchParams, user }: TripSidebarProps) {
  return (
    <div className="lg:sticky lg:top-24 space-y-6">
      <Card>
        <CardContent className="p-6">
          {trip.price_estimate && (
            <div className="mb-4">
              <span className="text-3xl font-bold">${trip.price_estimate.toLocaleString()}</span>
              <span className="text-muted-foreground"> / person</span>
            </div>
          )}
          <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg" onClick={onBook}>
            Check Availability →
          </Button>
          <div className="mt-2">
            <ShareTripModal trip={trip} creator={creator} />
          </div>

          {creator && (
            <div className="mt-6 border-t pt-4">
              <p className="text-xs text-muted-foreground mb-2">Created by</p>
              <Link
                to={creator.username ? `/profile/${creator.username}` : "#"}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center font-medium">
                  {creator.display_name?.[0] || "C"}
                </div>
                <div>
                  <p className="text-sm font-medium">{creator.display_name}</p>
                  {creator.username && <p className="text-xs text-muted-foreground">@{creator.username}</p>}
                </div>
              </Link>
              {creator.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{creator.bio}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
