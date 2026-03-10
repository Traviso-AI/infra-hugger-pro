import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X, User, LogOut, Plus, BarChart3, MessageSquare, Compass, FolderOpen, Plane, Download, Shield } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useState } from "react";
import { useBetaMode } from "@/hooks/useBetaMode";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isBetaMode } = useBetaMode();

  // User has beta access if beta mode is off, or they have is_beta/is_admin
  const hasBetaAccess = !isBetaMode || profile?.is_beta || profile?.is_admin;

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
              <Link to="/my-trips" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                My Trips
              </Link>
              <Link to="/create-trip" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {profile?.is_creator ? "Creator Studio" : "Create Trip"}
              </Link>
            </>
          )}
        </div>

        <div className="hidden items-center gap-1 md:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          {user && <NotificationBell />}
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
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium truncate">{profile?.display_name || "My Account"}</p>
                  <p className="text-xs text-muted-foreground truncate">@{profile?.username || "user"}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal uppercase tracking-wider">Travel</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate("/my-trips")}>
                  <Plane className="mr-2 h-4 w-4" /> My Trips
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/collections")}>
                  <FolderOpen className="mr-2 h-4 w-4" /> Collections
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/ai-planner")}>
                  <MessageSquare className="mr-2 h-4 w-4" /> AI Planner
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal uppercase tracking-wider">Account</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  <BarChart3 className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/install")}>
                  <Download className="mr-2 h-4 w-4" /> Install App
                </DropdownMenuItem>
                {profile?.is_admin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <Shield className="mr-2 h-4 w-4" /> Admin
                    </DropdownMenuItem>
                  </>
                )}
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
          <div className="flex flex-col gap-1">
            <Link to="/explore" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
              <Compass className="h-4 w-4 text-muted-foreground" /> Explore
            </Link>
            <Link to="/leaderboard" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
              <BarChart3 className="h-4 w-4 text-muted-foreground" /> Leaderboard
            </Link>
            {user ? (
              <>
                <Link to="/ai-planner" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" /> AI Planner
                </Link>
                <Link to="/create-trip" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
                  <Plus className="h-4 w-4 text-muted-foreground" /> {profile?.is_creator ? "Creator Studio" : "Create Trip"}
                </Link>
                <Link to="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" /> Dashboard
                </Link>
                <Link to="/my-trips" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
                  <Plane className="h-4 w-4 text-muted-foreground" /> My Trips
                </Link>
                <Link to="/collections" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
                  <FolderOpen className="h-4 w-4 text-muted-foreground" /> Collections
                </Link>
                <Link to="/install" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
                  <Download className="h-4 w-4 text-muted-foreground" /> Install App
                </Link>
                <div className="flex items-center gap-2 mt-2 px-3">
                  <NotificationBell />
                  <span className="text-sm text-muted-foreground">Notifications</span>
                </div>
                <div className="flex items-center gap-2 px-3 mt-1">
                  <ThemeToggle />
                  <span className="text-sm text-muted-foreground">Theme</span>
                </div>
                <div className="flex items-center gap-2 px-3 mt-1">
                  <LanguageSwitcher />
                  <span className="text-sm text-muted-foreground">Language</span>
                </div>
                <div className="border-t mt-2 pt-2">
                  <Button variant="outline" size="sm" className="w-full" onClick={() => { handleSignOut(); setMobileOpen(false); }}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 mt-2">
                <Button variant="ghost" className="w-full justify-center" onClick={() => { navigate("/login"); setMobileOpen(false); }}>Log in</Button>
                <Button className="w-full bg-accent text-accent-foreground" onClick={() => { navigate("/signup"); setMobileOpen(false); }}>Sign up</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
