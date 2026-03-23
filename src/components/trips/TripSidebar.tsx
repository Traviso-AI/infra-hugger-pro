import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { ShareTripModal } from "@/components/sharing/ShareTripModal";

interface TripSidebarProps {
  trip: any;
  creator: any;
  onBook: (params: { checkIn: string; checkOut: string; travelers: string }) => void;
  searchParams: URLSearchParams;
  user: any;
}

export function TripSidebar({ trip, creator, onBook, searchParams, user }: TripSidebarProps) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [travelers, setTravelers] = useState("2");

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Check in</Label>
                <Input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="text-sm h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Check out</Label>
                <Input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split("T")[0]}
                  className="text-sm h-9"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Travelers</Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTravelers(String(Math.max(1, parseInt(travelers) - 1)))}
                  className="h-9 w-9 rounded-md border flex items-center justify-center text-lg font-medium hover:bg-muted transition-colors"
                >−</button>
                <span className="flex-1 text-center text-sm font-medium">{travelers} {parseInt(travelers) === 1 ? "traveler" : "travelers"}</span>
                <button
                  type="button"
                  onClick={() => setTravelers(String(Math.min(10, parseInt(travelers) + 1)))}
                  className="h-9 w-9 rounded-md border flex items-center justify-center text-lg font-medium hover:bg-muted transition-colors"
                >+</button>
              </div>
            </div>
          </div>
          <Button
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
            size="lg"
            onClick={() => onBook({ checkIn, checkOut, travelers })}
            disabled={!checkIn || !checkOut}
          >
            {checkIn && checkOut ? "Check Availability →" : "Select dates to continue"}
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
