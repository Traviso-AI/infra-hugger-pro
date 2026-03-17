import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, BarChart, Bar } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, TrendingUp, Users, DollarSign, Wallet, CheckCircle, ExternalLink, Loader2 } from "lucide-react";
import { format, subDays } from "date-fns";
import { useMemo } from "react";
import { toast } from "sonner";

const chartConfig = {
  views: { label: "Views", color: "hsl(174, 60%, 40%)" },
  bookings: { label: "Bookings", color: "hsl(25, 95%, 55%)" },
  revenue: { label: "Revenue", color: "hsl(220, 60%, 15%)" },
};

export function CreatorAnalytics() {
  const { user } = useAuth();
  const [connectLoading, setConnectLoading] = useState(false);

  // --- Earnings data ---
  const { data: earnings, refetch: refetchEarnings } = useQuery({
    queryKey: ["creator-earnings", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("creator_earnings")
        .select("*")
        .eq("creator_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // --- Commission history ---
  const { data: commissions } = useQuery({
    queryKey: ["creator-commissions", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("commission_ledger")
        .select("*")
        .eq("creator_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
    enabled: !!user,
  });

  // --- Existing analytics queries ---
  const { data: tripIds } = useQuery({
    queryKey: ["my-trip-ids", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("trips")
        .select("id")
        .eq("creator_id", user!.id);
      return data?.map((t) => t.id) || [];
    },
    enabled: !!user,
  });

  const { data: viewsData } = useQuery({
    queryKey: ["creator-views", tripIds],
    queryFn: async () => {
      if (!tripIds?.length) return [];
      const { data } = await supabase
        .from("trip_views")
        .select("created_at, trip_id")
        .in("trip_id", tripIds)
        .gte("created_at", subDays(new Date(), 30).toISOString())
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!tripIds?.length,
  });

  const { data: bookingsData } = useQuery({
    queryKey: ["creator-bookings", tripIds],
    queryFn: async () => {
      if (!tripIds?.length) return [];
      const { data } = await supabase
        .from("bookings")
        .select("created_at, total_price, status")
        .in("trip_id", tripIds)
        .gte("created_at", subDays(new Date(), 30).toISOString())
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!tripIds?.length,
  });

  const { data: followersData } = useQuery({
    queryKey: ["creator-followers", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("follows")
        .select("created_at")
        .eq("following_id", user!.id)
        .gte("created_at", subDays(new Date(), 30).toISOString())
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  const chartData = useMemo(() => {
    const days: Record<string, { date: string; views: number; bookings: number; revenue: number; followers: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "MMM dd");
      days[d] = { date: d, views: 0, bookings: 0, revenue: 0, followers: 0 };
    }
    viewsData?.forEach((v) => {
      const d = format(new Date(v.created_at), "MMM dd");
      if (days[d]) days[d].views++;
    });
    bookingsData?.forEach((b) => {
      const d = format(new Date(b.created_at), "MMM dd");
      if (days[d]) {
        days[d].bookings++;
        days[d].revenue += Number(b.total_price || 0);
      }
    });
    followersData?.forEach((f) => {
      const d = format(new Date(f.created_at), "MMM dd");
      if (days[d]) days[d].followers++;
    });
    return Object.values(days);
  }, [viewsData, bookingsData, followersData]);

  const totalViews = viewsData?.length || 0;
  const totalBookings30d = bookingsData?.filter((b) => b.status === "confirmed").length || 0;
  const totalRevenue30d = bookingsData?.filter((b) => b.status === "confirmed").reduce((s, b) => s + Number(b.total_price || 0), 0) || 0;
  const totalFollowers30d = followersData?.length || 0;

  const pendingPayout = (earnings?.pending_payout_cents ?? 0) / 100;
  const totalPaidOut = (earnings?.total_paid_out_cents ?? 0) / 100;
  const isConnected = !!earnings?.stripe_connect_account_id;

  const handleConnectBank = async () => {
    setConnectLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-connect-account", {
        body: { email: user?.email },
      });
      if (error) throw error;
      const url = typeof data === "string" ? JSON.parse(data)?.url : data?.url;
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No onboarding URL returned");
      }
    } catch (err: any) {
      console.error("Connect error:", err);
      toast.error(err.message || "Failed to start Stripe onboarding");
      setConnectLoading(false);
    }
  };

  const stats = [
    { label: "Views (30d)", value: totalViews.toLocaleString(), icon: Eye, change: "+views this month" },
    { label: "Bookings (30d)", value: totalBookings30d, icon: TrendingUp, change: "confirmed" },
    { label: "Revenue (30d)", value: `$${totalRevenue30d.toLocaleString()}`, icon: DollarSign, change: "earned" },
    { label: "New Followers", value: totalFollowers30d, icon: Users, change: "this month" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold">Creator Analytics</h2>

      {/* Earnings banner */}
      <Card className="border-accent/20 bg-gradient-to-r from-accent/5 to-transparent">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <Wallet className="h-6 w-6 text-accent" />
              </div>
              <div>
                <div className="flex items-baseline gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Pending Payout</p>
                    <p className="text-2xl font-bold text-accent">${pendingPayout.toFixed(2)}</p>
                  </div>
                  <div className="border-l pl-3">
                    <p className="text-xs text-muted-foreground">Total Paid Out</p>
                    <p className="text-lg font-semibold">${totalPaidOut.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              {isConnected ? (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 px-3 py-1.5">
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                  Bank Connected
                </Badge>
              ) : (
                <Button
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={handleConnectBank}
                  disabled={connectLoading}
                >
                  {connectLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  Connect Your Bank Account
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission history */}
      {commissions && commissions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Commission History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0 divide-y">
              {commissions.map((c: any) => {
                const creatorEarned = ((c.amount_cents * c.creator_percentage) / 100 / 100).toFixed(2);
                const travisoMargin = (c.traviso_margin_cents / 100).toFixed(2);
                return (
                  <div key={c.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium capitalize">{c.booking_type?.replace(/_/g, " ") ?? "Booking"}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(c.created_at), "MMM d, yyyy")} · {c.creator_percentage}% commission
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-accent">+${creatorEarned}</p>
                      <p className="text-[10px] text-muted-foreground">Platform: ${travisoMargin}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, change }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
              </div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="views" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="views">Views</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="views">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Trip Views — Last 30 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(174, 60%, 40%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(174, 60%, 40%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="views" stroke="hsl(174, 60%, 40%)" fill="url(#viewsGradient)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Bookings — Last 30 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="bookings" fill="hsl(25, 95%, 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Revenue — Last 30 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(220, 60%, 15%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(220, 60%, 15%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} tickFormatter={(v) => `$${v}`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(220, 60%, 15%)" fill="url(#revenueGradient)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
