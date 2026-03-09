import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, MessageCircle, ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { formatDistanceToNow } from "date-fns";

interface GroupTrip {
  trip_id: string;
  role: "organizer" | "member";
  trip: {
    id: string;
    title: string;
    destination: string;
    cover_image_url: string | null;
    duration_days: number;
  };
  memberCount: number;
  unreadMessages: number;
  lastMessage?: { content: string; created_at: string; sender_name: string } | null;
}

export function MyGroups() {
  const { user } = useAuth();

  const { data: groupTrips, isLoading } = useQuery({
    queryKey: ["my-groups", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Fetch trips where user is organizer
      const { data: organizedGroups } = await supabase
        .from("group_organizers")
        .select("trip_id")
        .eq("user_id", user.id);

      // Fetch trips where user is collaborator (accepted)
      const { data: collabGroups } = await supabase
        .from("trip_collaborators")
        .select("trip_id")
        .eq("user_id", user.id)
        .not("accepted_at", "is", null);

      const organizerTripIds = (organizedGroups || []).map((g) => g.trip_id);
      const collabTripIds = (collabGroups || []).map((g) => g.trip_id);
      const allTripIds = [...new Set([...organizerTripIds, ...collabTripIds])];

      if (allTripIds.length === 0) return [];

      // Fetch trip details
      const { data: trips } = await supabase
        .from("trips")
        .select("id, title, destination, cover_image_url, duration_days")
        .in("id", allTripIds);

      if (!trips || trips.length === 0) return [];

      // Fetch member counts and last messages for each trip
      const results: GroupTrip[] = [];

      for (const trip of trips) {
        const isOrganizer = organizerTripIds.includes(trip.id);

        // Count members (organizers + accepted collaborators)
        const [orgCount, collabCount] = await Promise.all([
          supabase.from("group_organizers").select("id", { count: "exact", head: true }).eq("trip_id", trip.id),
          supabase.from("trip_collaborators").select("id", { count: "exact", head: true }).eq("trip_id", trip.id).not("accepted_at", "is", null),
        ]);

        // Get last message
        const { data: lastMsgData } = await supabase
          .from("group_messages")
          .select("content, created_at, user_id")
          .eq("trip_id", trip.id)
          .order("created_at", { ascending: false })
          .limit(1);

        let lastMessage = null;
        if (lastMsgData && lastMsgData.length > 0) {
          const msg = lastMsgData[0];
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", msg.user_id)
            .single();
          lastMessage = {
            content: msg.content,
            created_at: msg.created_at,
            sender_name: senderProfile?.display_name || "Someone",
          };
        }

        results.push({
          trip_id: trip.id,
          role: isOrganizer ? "organizer" : "member",
          trip,
          memberCount: (orgCount.count || 0) + (collabCount.count || 0),
          unreadMessages: 0,
          lastMessage,
        });
      }

      return results;
    },
    enabled: !!user,
  });

  if (isLoading) return null;
  if (!groupTrips || groupTrips.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-accent" /> My Group Plans
      </h2>
      <div className="space-y-3">
        {groupTrips.map((group) => (
          <Link key={group.trip_id} to={`/trip/${group.trip_id}?tab=group`}>
            <Card className="transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-[1.01] hover:border-l-4 hover:border-l-accent">
              <CardContent className="flex items-center gap-4 p-4">
                {/* Cover thumbnail */}
                <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted shrink-0">
                  {group.trip.cover_image_url ? (
                    <img
                      src={group.trip.cover_image_url}
                      alt={group.trip.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-medium truncate">{group.trip.title}</h3>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {group.role === "organizer" ? "Organizer" : "Member"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {group.trip.destination} · {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
                  </p>
                  {group.lastMessage && (
                    <p className="text-xs text-muted-foreground mt-1 truncate flex items-center gap-1">
                      <MessageCircle className="h-3 w-3 shrink-0" />
                      <span className="font-medium">{group.lastMessage.sender_name}:</span>{" "}
                      {group.lastMessage.content}
                      <span className="shrink-0 ml-auto text-[10px]">
                        {formatDistanceToNow(new Date(group.lastMessage.created_at), { addSuffix: true })}
                      </span>
                    </p>
                  )}
                </div>

                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
