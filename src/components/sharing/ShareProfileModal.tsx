import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Share2, Eye, CalendarCheck, DollarSign, Trophy, Copy, Check } from "lucide-react";
import { PlatformShareButtons } from "@/components/sharing/PlatformShareButtons";
import { CopyLinkButton } from "@/components/sharing/CopyLinkButton";
import { CreatorCaptionCard } from "@/components/sharing/CreatorCaptionCard";

interface ShareProfileModalProps {
  profile: any;
  tripsCreatedCount: number;
  tripsTakenCount: number;
  rank?: number | null;
}

const BASE_URL = "https://app.traviso.ai";

export function ShareProfileModal({ profile, tripsCreatedCount, tripsTakenCount, rank }: ShareProfileModalProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const isCreator = profile.is_creator && user?.id === profile.user_id;

  const profileLink = `${BASE_URL}/profile/${profile.username}`;

  const captions = {
    twitter: `follow ${profile.display_name} on Traviso AI — ${tripsCreatedCount} bookable trips from someone who's actually been there 🌍 ${profileLink}`,
    whatsapp: `check out my travel profile — all my trips are bookable: ${profileLink}`,
    sms: `check out my travel profile — all my trips are bookable: ${profileLink}`,
    instagram: `follow my travel journey 🌍 all my trips are bookable on Traviso AI — link in bio\n#travel #travisoai #travelcreator`,
    tiktok: `all my trips are now bookable 🌴 every destination I've been to, fully planned out. link in bio\n#traveltok #travisoai #travel`,
    email: {
      subject: `${profile.display_name}'s Travel Profile`,
      body: `Check out ${profile.display_name}'s travel profile on Traviso AI — ${tripsCreatedCount} bookable trips: ${profileLink}`,
    },
  };

  const content = (
    <div className="space-y-5 p-1">
      {/* Profile preview */}
      <div className="flex flex-col items-center text-center p-4 rounded-xl border">
        <Avatar className="h-16 w-16 mb-2">
          <AvatarImage src={profile.avatar_url || ""} />
          <AvatarFallback className="bg-accent text-accent-foreground text-xl">
            {profile.display_name?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <p className="font-display font-bold">{profile.display_name}</p>
        <p className="text-xs text-muted-foreground">@{profile.username}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span>{tripsCreatedCount} Trips Created</span>
          <span>{tripsTakenCount} Trips Taken</span>
        </div>
      </div>

      {/* Tabs */}
      <ProfileShareTabs
        isCreator={!!isCreator}
        profileLink={profileLink}
        profile={profile}
        captions={captions}
        tripsCreatedCount={tripsCreatedCount}
        rank={rank}
      />
    </div>
  );

  const trigger = (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => setOpen(true)}
    >
      <Share2 className="h-3.5 w-3.5" /> Share Profile
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

function ProfileShareTabs({
  isCreator, profileLink, profile, captions, tripsCreatedCount, rank,
}: {
  isCreator: boolean;
  profileLink: string;
  profile: any;
  captions: any;
  tripsCreatedCount: number;
  rank?: number | null;
}) {
  const [tab, setTab] = useState<"share" | "creator">("share");

  return (
    <div>
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
          <CopyLinkButton link={profileLink} />
          <PlatformShareButtons link={profileLink} captions={captions} />
        </div>
      )}

      {tab === "creator" && isCreator && (
        <ProfileCreatorTools profile={profile} tripsCreatedCount={tripsCreatedCount} rank={rank} />
      )}
    </div>
  );
}

function ProfileCreatorTools({ profile, tripsCreatedCount, rank }: { profile: any; tripsCreatedCount: number; rank?: number | null }) {
  const [bioCopied, setBioCopied] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["creator-profile-stats", profile.user_id],
    queryFn: async () => {
      const [viewsRes, bookingsRes] = await Promise.all([
        supabase.from("profile_views").select("id", { count: "exact", head: true }).eq("profile_id", profile.user_id),
        supabase.from("bookings").select("total_price, trips!inner(creator_id)").eq("trips.creator_id", profile.user_id).eq("status", "confirmed"),
      ]);
      const totalBookings = bookingsRes.data?.length || 0;
      const totalEarned = (bookingsRes.data || []).reduce((sum: number, b: any) => sum + (b.total_price || 0) * 0.8, 0);
      return {
        views: viewsRes.count || 0,
        bookings: totalBookings,
        earned: totalEarned,
      };
    },
  });

  const fmt = (n: number) => (n === 0 ? "—" : n.toLocaleString());
  const fmtMoney = (n: number) => (n === 0 ? "—" : `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);

  const bioLink = `🌍 Book my trips → app.traviso.ai/profile/${profile.username}`;

  const handleCopyBio = async () => {
    await navigator.clipboard.writeText(bioLink);
    setBioCopied(true);
    setTimeout(() => setBioCopied(false), 2000);
  };

  const statItems = [
    { icon: Eye, label: "Profile Views", value: fmt(stats?.views || 0) },
    { icon: CalendarCheck, label: "Total Bookings", value: fmt(stats?.bookings || 0) },
    { icon: DollarSign, label: "Total Earned", value: fmtMoney(stats?.earned || 0) },
    { icon: Trophy, label: "Leaderboard", value: rank ? `#${rank}` : "—" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {statItems.map((s) => (
          <div key={s.label} className="rounded-xl border p-3 text-center">
            <s.icon className="h-4 w-4 mx-auto text-accent mb-1" />
            <p className="font-display font-bold text-lg">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bio link */}
      <div className="rounded-lg border p-3 space-y-2">
        <p className="text-xs text-muted-foreground">Add this to your Instagram/TikTok bio</p>
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium flex-1 truncate">{bioLink}</p>
          <button
            onClick={handleCopyBio}
            className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors shrink-0"
          >
            {bioCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {bioCopied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
