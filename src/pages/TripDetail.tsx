import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Star, Users, ArrowLeft } from "lucide-react";
import { TripSidebar } from "@/components/trips/TripSidebar";
import { TripItinerary } from "@/components/trips/TripItinerary";
import { TripReviews } from "@/components/trips/TripReviews";
import { GroupPlanningPanel } from "@/components/trips/GroupPlanning";
import { TripPhotoGallery } from "@/components/trips/TripPhotoGallery";
import { ActivityMap } from "@/components/trips/ActivityMap";
import { LiveTripTracker } from "@/components/trips/LiveTripTracker";
import { ViralSignupBanner } from "@/components/sharing/ViralSignupBanner";
import { TripDetailSkeleton } from "@/components/skeletons/TripDetailSkeleton";
import { isGenericPlaceholder } from "@/lib/destination-covers";
import { usePageSEO } from "@/hooks/usePageSEO";
import { toast } from "sonner";
import { useEffect, useMemo } from "react";

export default function TripDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Store referral
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) sessionStorage.setItem("traviso_referral", ref);
  }, [searchParams]);

  // Accept invite
  useEffect(() => {
    const inviteToken = searchParams.get("invite");
    if (!inviteToken || !user || !id) return;
    (async () => {
      const { data: org } = await supabase
        .from("group_organizers")
        .select("id, trip_id")
        .eq("trip_id", id)
        .eq("invite_token", inviteToken)
        .maybeSingle();
      if (!org) return;

      const { data: existing } = await supabase
        .from("trip_collaborators")
        .select("id")
        .eq("trip_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (existing) {
        await supabase
          .from("trip_collaborators")
          .update({ accepted_at: new Date().toISOString() })
          .eq("id", existing.id)
          .is("accepted_at", null);
        toast.success("You're already in this group!");
        return;
      }

      const { error } = await supabase
        .from("trip_collaborators")
        .insert({
          trip_id: id,
          user_id: user.id,
          invited_by: org.id,
          role: "editor",
          accepted_at: new Date().toISOString(),
        });
      if (!error) toast.success("You've joined this trip group!");
    })();
  }, [searchParams, user, id]);

  // Track view (dedup handled by DB trigger)
  useEffect(() => {
    if (!id) return;
    const ref = searchParams.get("ref");
    supabase.from("trip_views").insert({
      trip_id: id,
      viewer_id: user?.id || null,
      referral_source: ref || null,
    }).then(() => {});
  }, [id]);

  const { data: trip, isLoading } = useQuery({
    queryKey: ["trip", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("trips")
        .select("*, profiles!trips_creator_id_profiles_fkey(display_name, avatar_url, username, bio)")
        .eq("id", id)
        .single();
      return data;
    },
    enabled: !!id,
  });

  const { data: isGroupOrganizer } = useQuery({
    queryKey: ["trip-organizer", id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("group_organizers")
        .select("id")
        .eq("trip_id", id!)
        .eq("user_id", user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!id && !!user,
  });

  const { data: isCollaborator } = useQuery({
    queryKey: ["trip-collaborator", id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("trip_collaborators")
        .select("id")
        .eq("trip_id", id!)
        .eq("user_id", user.id)
        .not("accepted_at", "is", null)
        .maybeSingle();
      return !!data;
    },
    enabled: !!id && !!user,
  });

  const { data: days } = useQuery({
    queryKey: ["trip-days", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("trip_days")
        .select("*, trip_activities(*)")
        .eq("trip_id", id!)
        .order("day_number");
      return data || [];
    },
    enabled: !!id,
  });

  const { data: reviews } = useQuery({
    queryKey: ["trip-reviews", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*, profiles!reviews_user_id_profiles_fkey(display_name, avatar_url)")
        .eq("trip_id", id!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const activityImages = useMemo(() => {
    if (!days) return [];
    return days.flatMap((day: any) =>
      (day.trip_activities || []).filter((a: any) => a.image_url).map((a: any) => a.image_url as string)
    );
  }, [days]);

  const allActivities = useMemo(() => {
    if (!days) return [];
    return days.flatMap((day: any) =>
      (day.trip_activities || []).map((a: any) => ({ ...a, day_number: day.day_number }))
    );
  }, [days]);

  const canVote = !!isGroupOrganizer || !!isCollaborator;

  usePageSEO({
    title: trip ? `${trip.title} — ${trip.destination}` : "Loading trip...",
    description: trip?.description || (trip ? `${trip.duration_days}-day trip to ${trip.destination}. Book on Traviso AI.` : undefined),
    image: trip?.cover_image_url || undefined,
    url: trip ? `${window.location.origin}/trip/${trip.id}` : undefined,
  });

  if (isLoading) return <TripDetailSkeleton />;

  if (!trip) return (
    <div className="container py-16 text-center">
      <h1 className="font-display text-2xl font-bold">Trip not found</h1>
    </div>
  );

  const handleBook = () => {
    if (!user) { toast.error("Please sign in to book this trip"); navigate("/login"); return; }
    navigate(`/booking/${trip.id}`);
  };

  const creator = trip.profiles as any;

  return (
    <div>
      <TripPhotoGallery
        coverImage={(!trip.cover_image_url || isGenericPlaceholder(trip.cover_image_url)) ? undefined : trip.cover_image_url}
        destination={trip.destination}
        tripId={trip.id}
        activityImages={activityImages}
      />

      <div className="container -mt-16 relative pb-16">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground hover:text-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="order-first lg:order-last">
            <TripSidebar trip={trip} creator={creator} onBook={handleBook} searchParams={searchParams} user={user} />
            {user && <div className="mt-6"><GroupPlanningPanel tripId={trip.id} autoExpand={searchParams.get("tab") === "group"} /></div>}
          </div>

          <div className="lg:col-span-2 space-y-8 order-last lg:order-first">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {trip.tags?.map((tag: string) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
              </div>
              <h1 className="font-display text-3xl font-bold md:text-4xl">{trip.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-accent" /> {trip.destination}</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {trip.duration_days} days</span>
                {trip.avg_rating > 0 && <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-sunset text-sunset" /> {trip.avg_rating}</span>}
                {trip.total_bookings > 0 ? (
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {trip.total_bookings} booked</span>
                ) : (
                  <Badge variant="secondary" className="text-xs">New</Badge>
                )}
              </div>
              {trip.description && <p className="mt-4 text-muted-foreground leading-relaxed">{trip.description}</p>}
            </div>

            <TripItinerary days={days || []} canVote={canVote} />

            {allActivities.length > 0 && <ActivityMap activities={allActivities} destination={trip.destination} />}

            <TripReviews tripId={trip.id} creatorId={trip.creator_id} userId={user?.id} reviews={reviews || []} />
          </div>
        </div>
      </div>
      <ViralSignupBanner />
    </div>
  );
}
