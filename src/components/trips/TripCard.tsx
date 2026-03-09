import { Link, useNavigate } from "react-router-dom";
import { MapPin, Star, Users, Clock, Heart, FolderPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getDestinationCover, getDestinationCoverFallback, isGenericPlaceholder } from "@/lib/destination-covers";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { AddToCollectionModal } from "@/components/collections/AddToCollectionModal";

interface TripCardProps {
  id: string;
  title: string;
  destination: string;
  coverImage?: string | null;
  durationDays: number;
  priceEstimate?: number | null;
  avgRating?: number | null;
  totalBookings?: number | null;
  creatorName?: string;
  creatorAvatar?: string | null;
  creatorUsername?: string | null;
  creatorId?: string | null;
  tags?: string[] | null;
  maxTags?: number;
}

export function TripCard({
  id, title, destination, coverImage, durationDays, priceEstimate,
  avgRating, totalBookings, creatorName, creatorAvatar, creatorUsername, creatorId, tags,
  maxTags = 3,
}: TripCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);

  const { data: isFavorited } = useQuery({
    queryKey: ["favorite", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user!.id)
        .eq("trip_id", id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Please sign in to save trips");
      return;
    }
    try {
      if (isFavorited) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("trip_id", id);
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, trip_id: id });
      }
      queryClient.invalidateQueries({ queryKey: ["favorite", id] });
      queryClient.invalidateQueries({ queryKey: ["my-favorites"] });
    } catch {
      toast.error("Failed to update favorite");
    }
  };

  return (
    <div onClick={() => navigate(`/trip/${id}`)} className="group block cursor-pointer">
      <div className="overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg hover:-translate-y-1">
        <div className="aspect-[4/3] overflow-hidden bg-muted relative">
          <img
            src={(!coverImage || isGenericPlaceholder(coverImage)) ? getDestinationCover(destination, 800, 600, id) : coverImage}
            alt={title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
            onError={(e) => { e.currentTarget.src = getDestinationCoverFallback(destination); }}
          />
          <div className="absolute top-2 right-2 flex gap-1">
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCollectionModalOpen(true); }}
              >
                <FolderPlus className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={toggleFavorite}
            >
              <Heart className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
            </Button>
          </div>
        </div>
        <div className="p-3 sm:p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent" />
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{destination}</span>
          </div>
          <h3 className="font-display text-base sm:text-lg font-semibold leading-tight mb-1.5 sm:mb-2 line-clamp-1">{title}</h3>
          <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 flex-wrap">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {durationDays}d</span>
            {avgRating != null && avgRating > 0 && (
              <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-sunset text-sunset" /> {avgRating.toFixed(1)}</span>
            )}
            {totalBookings != null && totalBookings > 0 ? (
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {totalBookings}</span>
            ) : (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">New</Badge>
            )}
          </div>
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {tags.slice(0, maxTags).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between">
            {creatorName && (
              <Link
                to={creatorUsername ? `/profile/${creatorUsername}` : creatorId ? `/profile/${creatorId}` : "#"}
                className="flex items-center gap-2 hover:opacity-80"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent">
                  {creatorName[0]}
                </div>
                <span className="text-xs text-muted-foreground hover:underline">{creatorName}</span>
              </Link>
            )}
            <span className="text-sm font-semibold text-accent">Get Price →</span>
          </div>
        </div>
      </div>
      {user && <AddToCollectionModal tripId={id} open={collectionModalOpen} onOpenChange={setCollectionModalOpen} />}
    </div>
  );
}
