import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Shield, Users, MapPin, BookOpen, DollarSign, Star, Trash2, Eye, EyeOff } from "lucide-react";
import { Navigate } from "react-router-dom";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function Admin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const { data: isAdmin, isLoading: checkingRole } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      return data === true;
    },
    enabled: !!user,
  });

  const { data: allTrips } = useQuery({
    queryKey: ["admin-trips"],
    queryFn: async () => {
      const { data } = await supabase
        .from("trips")
        .select("*, profiles!trips_creator_id_profiles_fkey(display_name)")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: isAdmin === true,
  });

  const { data: allProfiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      return data || [];
    },
    enabled: isAdmin === true,
  });

  const { data: allBookings } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*, trips(title, destination)")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: isAdmin === true,
  });

  const togglePublish = async (tripId: string, current: boolean) => {
    const { error } = await supabase.from("trips").update({ is_published: !current }).eq("id", tripId);
    if (error) { toast.error("Failed"); return; }
    toast.success(current ? "Trip unpublished" : "Trip published");
    queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
  };

  const toggleFeatured = async (tripId: string, current: boolean) => {
    const { error } = await supabase.from("trips").update({ is_featured: !current }).eq("id", tripId);
    if (error) { toast.error("Failed"); return; }
    toast.success(current ? "Unfeatured" : "Featured!");
    queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
  };

  const deleteTrip = async (tripId: string) => {
    const { error } = await supabase.from("trips").delete().eq("id", tripId);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Trip deleted");
    queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
  };

  if (checkingRole) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const totalRevenue = allBookings?.reduce((s, b: any) => s + (b.total_price || 0), 0) || 0;
  const totalCommissions = allBookings?.reduce((s, b: any) => s + (b.commission_amount || 0), 0) || 0;

  return (
    <div className="container py-8 md:py-12">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-8 w-8 text-accent" />
        <div>
          <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage trips, users, and bookings</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        {[
          { label: "Total Users", value: allProfiles?.length || 0, icon: Users },
          { label: "Total Trips", value: allTrips?.length || 0, icon: MapPin },
          { label: "Bookings", value: allBookings?.length || 0, icon: BookOpen },
          { label: "Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Icon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="trips">
        <TabsList className="mb-6">
          <TabsTrigger value="trips">Trips</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="trips">
          <div className="space-y-3">
            {allTrips?.map((trip: any) => (
              <Card key={trip.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{trip.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {trip.destination} · by {(trip.profiles as any)?.display_name || "Unknown"} · {trip.total_bookings || 0} bookings
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={trip.is_published ? "default" : "secondary"}>
                      {trip.is_published ? "Published" : "Draft"}
                    </Badge>
                    {trip.is_featured && <Badge className="bg-sunset text-white">Featured</Badge>}
                    <Button variant="ghost" size="icon" onClick={() => togglePublish(trip.id, trip.is_published)}>
                      {trip.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleFeatured(trip.id, trip.is_featured)}>
                      <Star className={`h-4 w-4 ${trip.is_featured ? "fill-sunset text-sunset" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteTrip(trip.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="space-y-3">
            {allProfiles?.map((p: any) => (
              <Card key={p.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-medium">{p.display_name || "No name"}</h3>
                    <p className="text-sm text-muted-foreground">@{p.username || "—"} · Joined {new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.is_creator && <Badge>Creator</Badge>}
                    <span className="text-sm font-medium">${(p.total_earnings || 0).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bookings">
          <div className="space-y-3">
            {allBookings?.map((b: any) => (
              <Card key={b.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-medium">{b.trips?.title || "Trip"}</h3>
                    <p className="text-sm text-muted-foreground">
                      {b.check_in} → {b.check_out} · {b.guests} guest(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={b.status === "confirmed" ? "default" : "secondary"}>{b.status}</Badge>
                    <span className="text-sm font-medium">${b.total_price || 0}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!allBookings || allBookings.length === 0) && (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No bookings yet</CardContent></Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
