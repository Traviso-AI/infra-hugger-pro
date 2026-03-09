import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Eye, LinkIcon, CalendarCheck, DollarSign, MapPin, Clock } from "lucide-react";
import { getDestinationCover, isGenericPlaceholder } from "@/lib/destination-covers";
import { PlatformShareButtons } from "@/components/sharing/PlatformShareButtons";
import { CopyLinkButton } from "@/components/sharing/CopyLinkButton";
import { CreatorCaptionCard } from "@/components/sharing/CreatorCaptionCard";

interface ShareTripModalProps {
  trip: any;
  creator: any;
}

const BASE_URL = "https://app.traviso.ai";

export function ShareTripModal({ trip, creator }: ShareTripModalProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const isCreator = user && trip.creator_id === user.id;

  const tripLink = `${BASE_URL}/trip/${trip.id}`;
  const refLink = `${BASE_URL}/trip/${trip.id}?ref=${creator?.username || ""}`;
  const tags = trip.tags || [];
  const tagStr = tags.slice(0, 2).join(" & ");
  const dest = trip.destination;
  const hashDest = dest?.replace(/\s+/g, "").toLowerCase() || "";

  const captions = {
    twitter: `${trip.title} in ${dest} 🌍✈️ ${trip.duration_days} days of ${tagStr}. Full itinerary on Traviso AI: ${tripLink}`,
    whatsapp: `you need to see this — ${trip.title} in ${dest} ${tripLink}`,
    sms: `${trip.title} — ${dest} ${tripLink}`,
    instagram: `${dest} done right 🌴 ${trip.title} — every restaurant, hotel and activity from my trip is now bookable. Full itinerary linked in bio.\n#${hashDest} #travel #traveltok #travisoai`,
    tiktok: `everything i did in ${dest} 🌍 ${trip.title} — hotels, restaurants, activities all in one place. link in bio 🔗\n#${hashDest} #traveltok #travel #travisoai`,
    email: {
      subject: trip.title,
      body: `Hey, thought you'd love this — ${trip.title} in ${dest}. Full day by day itinerary: ${tripLink}`,
    },
  };

  const coverImg = (!trip.cover_image_url || isGenericPlaceholder(trip.cover_image_url))
    ? getDestinationCover(dest, 600, 300, trip.id)
    : trip.cover_image_url;

  const content = (
    <div className="space-y-5 p-1">
      {/* Trip preview */}
      <div className="rounded-xl overflow-hidden border">
        <img src={coverImg} alt={trip.title} className="w-full h-32 object-cover" />
        <div className="p-3">
          <h3 className="font-display font-bold text-sm">{trip.title}</h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{dest}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{trip.duration_days} days</span>
          </div>
          {creator?.username && <p className="text-xs text-muted-foreground mt-1">by @{creator.username}</p>}
        </div>
      </div>

      {/* Tabs */}
      <ShareTabs
        isCreator={!!isCreator}
        tripLink={tripLink}
        refLink={refLink}
        tripId={trip.id}
        captions={captions}
        trip={trip}
        dest={dest}
        hashDest={hashDest}
        tags={tags}
        creatorUsername={creator?.username}
      />
    </div>
  );

  const trigger = (
    <Button
      variant="outline"
      className="w-full gap-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
      size="lg"
      onClick={() => setOpen(true)}
    >
      <Share2 className="h-4 w-4" /> Share
    </Button>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="max-h-[90dvh] px-4 pb-6">
            <div className="overflow-y-auto max-h-[80dvh] pt-4">
              {content}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {content}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ShareTabs({
  isCreator, tripLink, refLink, tripId, captions, trip, dest, hashDest, tags, creatorUsername,
}: {
  isCreator: boolean;
  tripLink: string;
  refLink: string;
  tripId: string;
  captions: any;
  trip: any;
  dest: string;
  hashDest: string;
  tags: string[];
  creatorUsername?: string;
}) {
  const [tab, setTab] = useState<"share" | "creator">("share");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b mb-4">
        <button
          className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${tab === "share" ? "border-accent text-accent" : "border-transparent text-muted-foreground"}`}
          onClick={() => setTab("share")}
        >
          Share
        </button>
        {isCreator && (
          <button
            className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${tab === "creator" ? "border-accent text-accent" : "border-transparent text-muted-foreground"}`}
            onClick={() => setTab("creator")}
          >
            Creator Tools
          </button>
        )}
      </div>

      {tab === "share" && (
        <div className="space-y-4">
          <CopyLinkButton link={tripLink} />
          <PlatformShareButtons link={tripLink} tripId={tripId} captions={captions} />
        </div>
      )}

      {tab === "creator" && isCreator && (
        <CreatorToolsTab
          tripId={tripId}
          trip={trip}
          refLink={refLink}
          dest={dest}
          hashDest={hashDest}
          tags={tags}
          creatorUsername={creatorUsername}
        />
      )}
    </div>
  );
}

function CreatorToolsTab({
  tripId, trip, refLink, dest, hashDest, tags, creatorUsername,
}: {
  tripId: string;
  trip: any;
  refLink: string;
  dest: string;
  hashDest: string;
  tags: string[];
  creatorUsername?: string;
}) {
  const { data: stats } = useQuery({
    queryKey: ["creator-trip-stats", tripId],
    queryFn: async () => {
      const [viewsRes, sharesRes, bookingsRes] = await Promise.all([
        supabase.from("trip_views").select("id", { count: "exact", head: true }).eq("trip_id", tripId),
        supabase.from("trip_shares").select("id", { count: "exact", head: true }).eq("trip_id", tripId),
        supabase.from("bookings").select("total_price").eq("trip_id", tripId).eq("status", "confirmed"),
      ]);
      const totalEarned = (bookingsRes.data || []).reduce((sum: number, b: any) => sum + (b.total_price || 0) * 0.8, 0);
      return {
        views: viewsRes.count || 0,
        clicks: sharesRes.count || 0,
        bookings: trip.total_bookings || 0,
        earned: totalEarned,
      };
    },
  });

  const fmt = (n: number) => (n === 0 ? "—" : n.toLocaleString());
  const fmtMoney = (n: number) => (n === 0 ? "—" : `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);

  const statItems = [
    { icon: Eye, label: "Views", value: fmt(stats?.views || 0) },
    { icon: LinkIcon, label: "Link Clicks", value: fmt(stats?.clicks || 0) },
    { icon: CalendarCheck, label: "Bookings", value: fmt(stats?.bookings || 0) },
    { icon: DollarSign, label: "Earned", value: fmtMoney(stats?.earned || 0) },
  ];

  const tag1 = tags[0]?.replace(/\s+/g, "").toLowerCase() || "travel";
  const tag2 = tags[1]?.replace(/\s+/g, "").toLowerCase() || "adventure";

  return (
    <div className="space-y-5">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {statItems.map((s) => (
          <div key={s.label} className="rounded-xl border p-3 text-center">
            <s.icon className="h-4 w-4 mx-auto text-accent mb-1" />
            <p className="font-display font-bold text-lg">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div>
        <h4 className="text-sm font-medium mb-2">Your Shareable Link</h4>
        <CopyLinkButton link={refLink} />
        <p className="text-xs text-muted-foreground mt-1.5">Use this link so your bookings are tracked back to you</p>
      </div>

      {/* Ready-to-post captions */}
      <div>
        <h4 className="text-sm font-medium mb-2">Ready-to-post captions</h4>
        <div className="space-y-2.5">
          <CreatorCaptionCard
            label="📸 Instagram"
            caption={`${dest} was everything 🌴 I put together every spot, restaurant and hotel from my trip into one bookable package on Traviso AI. ${trip.duration_days} days, fully planned. Link in bio if you want to do the exact same trip 🔗\n#${hashDest} #travel #${tag1} #${tag2} #travisoai`}
          />
          <CreatorCaptionCard
            label="🎵 TikTok"
            caption={`everything I did in ${dest} is now bookable 🙌 hotels, restaurants, activities — all in one place. ${trip.duration_days} days fully planned out. link in bio\n#${hashDest} #traveltok #travel #travisoai`}
          />
          <CreatorCaptionCard
            label="🐦 X / Twitter"
            caption={`just put my entire ${dest} trip on Traviso AI — ${trip.title}. ${trip.duration_days} days, every spot I went to. book the exact same trip: ${refLink}`}
          />
          <CreatorCaptionCard
            label="💬 WhatsApp / Text"
            caption={`I put my whole ${dest} trip together as a bookable package — hotels, restaurants, everything. if you want to do the same trip: ${refLink}`}
          />
        </div>
      </div>
    </div>
  );
}
