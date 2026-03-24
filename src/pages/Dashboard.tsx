import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, MapPin, Eye, DollarSign, BookOpen, Download } from "lucide-react";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { CreatorAnalytics } from "@/components/dashboard/CreatorAnalytics";
import { MyGroups } from "@/components/dashboard/MyGroups";

export default function Dashboard() {
  const { user, profile } = useAuth();

  const { data: myTrips } = useQuery({
    queryKey: ["my-trips", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("trips")
        .select("*")
        .eq("creator_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: myBookings } = useQuery({
    queryKey: ["my-bookings", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("trip_sessions")
        .select("id, total_amount_cents, status")
        .eq("user_id", user!.id)
        .in("status", ["confirmed", "completed"]);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: myCommissions } = useQuery({
    queryKey: ["my-commissions", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("commission_ledger")
        .select("amount_cents, creator_percentage")
        .eq("creator_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const publishedCount = myTrips?.filter((t) => t.is_published).length || 0;
  const totalBookings = myBookings?.length || 0;
  const totalRevenue = (myCommissions || []).reduce((sum: number, c: any) => {
    return sum + Math.round((c.amount_cents * (c.creator_percentage / 100)) / 100);
  }, 0);

  return (
    <div className="container px-4 py-6 md:py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back, {profile?.display_name || "Traveler"}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button asChild variant="outline" className="flex-1 sm:flex-initial">
            <Link to="/my-trips">My Trips</Link>
          </Button>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 flex-1 sm:flex-initial">
            <Link to="/create-trip"><Plus className="mr-2 h-4 w-4" /> Create Trip</Link>
          </Button>
        </div>
      </div>

      <OnboardingChecklist />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6 md:mb-8">
        {[
          { label: "Published Trips", value: publishedCount, icon: MapPin, emptyHint: "Create & publish a trip" },
          { label: "Total Bookings", value: totalBookings, icon: BookOpen, emptyHint: "Share trips to get bookings" },
          { label: "Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, emptyHint: "Earn from bookings", isEmpty: totalRevenue === 0 },
          { label: "My Bookings", value: myBookings?.length || 0, icon: Eye, emptyHint: "Book a trip to get started" },
        ].map(({ label, value, icon: Icon, emptyHint, isEmpty }) => {
          const showEmpty = isEmpty !== undefined ? isEmpty : value === 0;
          return (
            <Card key={label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{showEmpty ? "—" : value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  {showEmpty && <p className="text-[10px] text-accent mt-0.5">{emptyHint}</p>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Creator Analytics */}
      <div className="mb-6 md:mb-8">
        <CreatorAnalytics />
      </div>

      {/* My Group Plans */}
      <MyGroups />

      {/* Install App CTA */}
      <div className="mb-6">
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <Download className="h-8 w-8 text-accent" />
              <div>
                <h3 className="font-medium">Get the Traviso AI App</h3>
                <p className="text-sm text-muted-foreground">Install for offline itinerary access while traveling</p>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link to="/install">Install App</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
