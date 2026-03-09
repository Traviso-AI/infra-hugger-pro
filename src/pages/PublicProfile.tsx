import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TripCard } from "@/components/trips/TripCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Globe, Trophy, Pencil, Sparkles, Users, UserPlus, UserMinus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function PublicProfile() {
  const { username } = useParams();
  const { user, profile: myProfile, refreshProfile } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", username],
    queryFn: async () => {
      // Try by username first, then by user_id as fallback
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username!)
        .maybeSingle();
      if (data) return data;
      // Fallback: try as user_id
      const { data: byId } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", username!)
        .maybeSingle();
      return byId;
    },
    enabled: !!username,
  });

  const isOwnProfile = user && profile && user.id === profile.user_id;

  const { data: createdTrips } = useQuery({
    queryKey: ["profile-trips-created", profile?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("trips")
        .select("*, profiles!trips_creator_id_profiles_fkey(display_name, avatar_url, username)")
        .eq("creator_id", profile!.user_id)
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!profile,
  });

  const { data: takenTrips } = useQuery({
    queryKey: ["profile-trips-taken", profile?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*, trips(*, profiles!trips_creator_id_profiles_fkey(display_name, avatar_url, username))")
        .eq("user_id", profile!.user_id)
        .eq("status", "confirmed")
        .order("created_at", { ascending: false });
      if (!data) return [];
      // Deduplicate by trip_id, keeping most recent booking
      const seen = new Map<string, typeof data[0]>();
      for (const booking of data) {
        if (booking.trip_id && !seen.has(booking.trip_id)) {
          seen.set(booking.trip_id, booking);
        }
      }
      return Array.from(seen.values());
    },
    enabled: !!profile,
  });

  // Leaderboard rank
  const { data: rank } = useQuery({
    queryKey: ["profile-rank", profile?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("is_creator", true)
        .order("total_earnings", { ascending: false });
      if (!data) return null;
      const idx = data.findIndex((p) => p.user_id === profile!.user_id);
      return idx >= 0 ? idx + 1 : null;
    },
    enabled: !!profile?.is_creator,
  });

  // Follower count
  const { data: followerCount = 0 } = useQuery({
    queryKey: ["follower-count", profile?.user_id],
    queryFn: async () => {
      const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profile!.user_id);
      return count || 0;
    },
    enabled: !!profile,
  });

  // Is current user following this profile?
  const { data: isFollowing = false } = useQuery({
    queryKey: ["is-following", user?.id, profile?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user!.id)
        .eq("following_id", profile!.user_id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!profile && user.id !== profile.user_id,
  });

  const queryClient = useQueryClient();
  const [followLoading, setFollowLoading] = useState(false);

  const handleFollow = async () => {
    if (!user || !profile) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", profile.user_id);
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: profile.user_id });
      }
      queryClient.invalidateQueries({ queryKey: ["follower-count", profile.user_id] });
      queryClient.invalidateQueries({ queryKey: ["is-following", user.id, profile.user_id] });
    } catch (err: any) {
      toast.error("Something went wrong");
    } finally {
      setFollowLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-16 text-center">
        <h1 className="font-display text-2xl font-bold">User not found</h1>
        <p className="mt-2 text-muted-foreground">No profile exists for @{username}</p>
      </div>
    );
  }

  const tripsCreatedCount = createdTrips?.length || 0;
  const tripsTakenCount = takenTrips?.length || 0;

  return (
    <div className="container py-8 md:py-12">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-10">
        <Avatar className="h-24 w-24 mb-4">
          <AvatarImage src={profile.avatar_url || ""} />
          <AvatarFallback className="bg-accent text-accent-foreground text-3xl">
            {profile.display_name?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-3xl font-bold">{profile.display_name}</h1>
          {profile.is_creator && (
            <Badge className="bg-accent text-accent-foreground text-xs">Creator</Badge>
          )}
        </div>
        <p className="text-muted-foreground">@{profile.username}</p>
        {profile.bio && <p className="mt-2 max-w-md text-sm text-muted-foreground">{profile.bio}</p>}

        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-accent">
              <Globe className="h-3.5 w-3.5" /> Website
            </a>
          )}
        </div>

        <div className="mt-6 flex items-center gap-6">
          <div className="text-center">
            <p className="font-display text-2xl font-bold">{tripsCreatedCount}</p>
            <p className="text-xs text-muted-foreground">Trips Created</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <p className="font-display text-2xl font-bold">{tripsTakenCount}</p>
            <p className="text-xs text-muted-foreground">Trips Taken</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <p className="font-display text-2xl font-bold">{followerCount}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          {rank && (
            <>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <Badge variant="secondary" className="gap-1">
                  <Trophy className="h-3 w-3 text-sunset" /> #{rank}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Leaderboard</p>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          {isOwnProfile ? (
            <EditProfileDialog profile={profile} onSaved={refreshProfile} />
          ) : user && user.id !== profile.user_id ? (
            <Button
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              className={isFollowing ? "gap-2" : "gap-2 bg-accent text-accent-foreground hover:bg-accent/90"}
              onClick={handleFollow}
              disabled={followLoading}
            >
              {isFollowing ? <UserMinus className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
              {isFollowing ? "Unfollow" : "Follow"}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="created" className="w-full">
        <TabsList className="mx-auto flex w-fit">
          <TabsTrigger value="created">Trips Created ({tripsCreatedCount})</TabsTrigger>
          <TabsTrigger value="taken">Trips Taken ({tripsTakenCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="created" className="mt-6">
          {createdTrips && createdTrips.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {createdTrips.map((trip: any) => (
                <TripCard
                  key={trip.id}
                  id={trip.id}
                  title={trip.title}
                  destination={trip.destination}
                  coverImage={trip.cover_image_url}
                  durationDays={trip.duration_days}
                  priceEstimate={trip.price_estimate}
                  avgRating={trip.avg_rating}
                  totalBookings={trip.total_bookings}
                  creatorName={trip.profiles?.display_name}
                  creatorAvatar={trip.profiles?.avatar_url}
                  tags={trip.tags}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed bg-muted/50 p-12 text-center">
              <p className="text-muted-foreground">No published trips yet.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="taken" className="mt-6">
          {takenTrips && takenTrips.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {takenTrips.map((booking: any) => {
                const trip = booking.trips;
                if (!trip) return null;
                return (
                  <TripCard
                    key={booking.id}
                    id={trip.id}
                    title={trip.title}
                    destination={trip.destination}
                    coverImage={trip.cover_image_url}
                    durationDays={trip.duration_days}
                    priceEstimate={trip.price_estimate}
                    avgRating={trip.avg_rating}
                    totalBookings={trip.total_bookings}
                    creatorName={trip.profiles?.display_name}
                    creatorAvatar={trip.profiles?.avatar_url}
                    tags={trip.tags}
                  />
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed bg-muted/50 p-12 text-center">
              <p className="text-muted-foreground">No trips taken yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EditProfileDialog({ profile, onSaved }: { profile: any; onSaved: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [bio, setBio] = useState(profile.bio || "");
  const [website, setWebsite] = useState(profile.website || "");
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [isCreator, setIsCreator] = useState(profile.is_creator || false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const wasCreator = profile.is_creator;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ bio, website, display_name: displayName, is_creator: isCreator })
        .eq("user_id", profile.user_id);
      if (error) throw error;
      await onSaved();
      if (isCreator && !wasCreator) {
        toast.success("🎉 You're now a creator! You can publish trips and start earning commissions.");
      } else {
        toast.success("Profile updated!");
      }
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-4 gap-2">
          <Pencil className="h-3.5 w-3.5" /> Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-medium text-sm flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> Creator Mode
              </p>
              <p className="text-xs text-muted-foreground">Publish trips and earn commission from bookings</p>
            </div>
            <Switch checked={isCreator} onCheckedChange={setIsCreator} />
          </div>
          <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
