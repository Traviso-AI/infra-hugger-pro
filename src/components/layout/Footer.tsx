import { Compass } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t bg-secondary/50 py-12">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Compass className="h-5 w-5 text-accent" />
              <span className="font-display text-lg font-bold">Traviso AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered travel planning meets creator marketplace.
            </p>
          </div>
          <div>
            <h4 className="font-sans text-sm font-semibold mb-3">Product</h4>
            <div className="flex flex-col gap-2">
              <Link to="/explore" className="text-sm text-muted-foreground hover:text-foreground">Explore Trips</Link>
              <Link to="/ai-planner" className="text-sm text-muted-foreground hover:text-foreground">AI Planner</Link>
              <Link to="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground">Leaderboard</Link>
            </div>
          </div>
          <div>
            <h4 className="font-sans text-sm font-semibold mb-3">For Creators</h4>
            <div className="flex flex-col gap-2">
              <Link to="/create-trip" className="text-sm text-muted-foreground hover:text-foreground">Publish a Trip</Link>
              <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Creator Dashboard</Link>
            </div>
          </div>
          <div>
            <h4 className="font-sans text-sm font-semibold mb-3">Company</h4>
            <div className="flex flex-col gap-2">
              <Link to="/explore" className="text-sm text-muted-foreground hover:text-foreground">About Us</Link>
              <a href="mailto:hello@traviso.ai" className="text-sm text-muted-foreground hover:text-foreground">Contact</a>
              <Link to="/explore" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link>
              <Link to="/explore" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Traviso AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
