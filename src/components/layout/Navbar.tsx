import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X, User, LogOut, Plus, BarChart3, MessageSquare, Compass } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <Compass className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">Traviso AI</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link to="/explore" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Explore
          </Link>
          <Link to="/leaderboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Leaderboard
          </Link>
          {user && (
            <>
              <Link to="/ai-planner" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                AI Planner
              </Link>
              <Link to="/create-trip" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {profile?.is_creator ? "Creator Studio" : "Create Trip"}
              </Link>
            </>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-accent text-accent-foreground text-sm">
                      {profile?.display_name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  <User className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/ai-planner")}>
                  <MessageSquare className="mr-2 h-4 w-4" /> AI Planner
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" /> Edit Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                Log in
              </Button>
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/signup")}>
                Sign up
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-background p-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link to="/explore" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Explore</Link>
            <Link to="/leaderboard" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Leaderboard</Link>
            {user ? (
              <>
                <Link to="/ai-planner" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>AI Planner</Link>
                <Link to="/create-trip" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>{profile?.is_creator ? "Creator Studio" : "Create Trip"}</Link>
                <Link to="/dashboard" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                <Button variant="outline" size="sm" onClick={() => { handleSignOut(); setMobileOpen(false); }}>Sign out</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => { navigate("/login"); setMobileOpen(false); }}>Log in</Button>
                <Button size="sm" className="bg-accent text-accent-foreground" onClick={() => { navigate("/signup"); setMobileOpen(false); }}>Sign up</Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
