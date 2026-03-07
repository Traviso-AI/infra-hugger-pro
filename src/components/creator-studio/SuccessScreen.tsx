import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Copy, ExternalLink, LayoutDashboard, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { TripBasicsData } from "./StepTripBasics";

interface SuccessScreenProps {
  tripId: string;
  basics: TripBasicsData;
}

export function SuccessScreen({ tripId, basics }: SuccessScreenProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const tripUrl = `${window.location.origin}/trip/${tripId}`;
  const durationDays = parseInt(basics.durationDays) || 1;
  const price = parseFloat(basics.priceEstimate) || null;

  const copyLink = () => {
    navigator.clipboard.writeText(tripUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(`Check out my trip: ${basics.title} 🌍`);
    const url = encodeURIComponent(tripUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  return (
    <div className="flex flex-col items-center text-center space-y-6 py-8">
      <div className="h-16 w-16 rounded-full bg-accent/15 flex items-center justify-center">
        <Check className="h-8 w-8 text-accent" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold">Your trip is live! 🎉</h2>
        <p className="text-muted-foreground mt-1">Travelers can now discover and book your trip</p>
      </div>

      {/* Mini card preview */}
      <div className="max-w-xs w-full">
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="aspect-[4/3] overflow-hidden bg-muted">
            {basics.coverImageUrl ? (
              <img src={basics.coverImageUrl} alt={basics.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-accent/20 to-accent/5">
                <MapPin className="h-12 w-12 text-accent/40" />
              </div>
            )}
          </div>
          <div className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <MapPin className="h-3 w-3 text-accent" />
              <span className="text-xs text-muted-foreground">{basics.destination}</span>
            </div>
            <h3 className="font-display text-sm font-semibold">{basics.title}</h3>
            <div className="flex items-center justify-between mt-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {durationDays} day{durationDays > 1 ? "s" : ""}
              </span>
              {price && <span className="text-xs font-semibold">${price.toLocaleString()}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Share section */}
      <Card className="w-full max-w-md">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2.5 text-xs">
            <span className="truncate flex-1 text-left text-muted-foreground">{tripUrl}</span>
            <Button variant="ghost" size="sm" className="h-7 shrink-0" onClick={copyLink}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={shareTwitter}>
              Share to Twitter
            </Button>
            <Button variant="outline" size="sm" onClick={copyLink}>
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy Link
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        <Button variant="outline" onClick={() => navigate(`/trip/${tripId}`)}>
          <ExternalLink className="mr-1.5 h-4 w-4" /> View Live Listing
        </Button>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/dashboard")}>
          <LayoutDashboard className="mr-1.5 h-4 w-4" /> Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
