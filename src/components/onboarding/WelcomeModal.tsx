import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Compass, Sparkles, User, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
  displayName: string;
}

export function WelcomeModal({ open, onClose, displayName }: WelcomeModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center py-2">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
            <Compass className="h-7 w-7 text-accent" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-1">Welcome to Traviso! 🎉</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Hey {displayName || "there"}, here's how to get started:
          </p>

          <div className="space-y-3 text-left">
            <Link to="/explore" onClick={onClose} className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Compass className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium text-sm">Explore Trips</p>
                <p className="text-xs text-muted-foreground">Browse curated itineraries from travel creators</p>
              </div>
            </Link>

            <Link to="/ai-planner" onClick={onClose} className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium text-sm">Plan with AI</p>
                <p className="text-xs text-muted-foreground">Let Nala build your perfect trip in seconds</p>
              </div>
            </Link>

            <Link to="/profile" onClick={onClose} className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <User className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium text-sm">Complete Your Profile</p>
                <p className="text-xs text-muted-foreground">Add a photo and bio to stand out</p>
              </div>
            </Link>

            <Link to="/create-trip" onClick={onClose} className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50 transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium text-sm">Become a Creator</p>
                <p className="text-xs text-muted-foreground">Publish trips and earn when others book them</p>
              </div>
            </Link>
          </div>

          <Button
            className="w-full mt-6 bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={onClose}
          >
            Let's Go!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
