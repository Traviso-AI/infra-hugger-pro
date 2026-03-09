import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Users, UserPlus, ThumbsUp, ThumbsDown, DollarSign, Copy, Check,
  Link2, ChevronDown, ChevronUp, X, Wallet, MessageCircle, Send,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Collaborator {
  id: string;
  trip_id: string;
  user_id: string | null;
  email: string | null;
  role: string;
  invite_token: string;
  invited_by: string;
  accepted_at: string | null;
  created_at: string;
}

interface PaymentSplit {
  id: string;
  user_id: string;
  display_name: string | null;
  amount: number;
  is_paid: boolean;
}

// =============================================
// Main Group Planning Panel — Open to ALL logged-in users
// =============================================
export function GroupPlanningPanel({
  tripId,
  bookedPrice,
}: {
  tripId: string;
  bookedPrice?: number | null;
}) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("members");
  const [isInGroup, setIsInGroup] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [groupSize, setGroupSize] = useState(0);

  // Check if user is an organizer, or already a collaborator
  useEffect(() => {
    if (!user) return;
    (async () => {
      // Check if user is a group organizer for this trip
      const { data: orgRow } = await supabase
        .from("group_organizers")
        .select("id")
        .eq("trip_id", tripId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (orgRow) {
        setIsOrganizer(true);
        setIsInGroup(true);
      }

      // Check if user is an accepted collaborator
      const { data: collab } = await supabase
        .from("trip_collaborators")
        .select("id")
        .eq("trip_id", tripId)
        .eq("user_id", user.id)
        .not("accepted_at", "is", null)
        .maybeSingle();
      if (collab) setIsInGroup(true);

      // Check if any organizer exists (for group size display)
      const { count: orgCount } = await supabase
        .from("group_organizers")
        .select("id", { count: "exact", head: true })
        .eq("trip_id", tripId);

      const { count: collabCount } = await supabase
        .from("trip_collaborators")
        .select("id", { count: "exact", head: true })
        .eq("trip_id", tripId)
        .not("accepted_at", "is", null);
      setGroupSize((orgCount || 0) + (collabCount || 0));
    })();
  }, [tripId, user]);

  if (!user) return null;

  const handleStartGroup = async () => {
    // Record this user as the group organizer
    const { error } = await supabase
      .from("group_organizers")
      .insert({ trip_id: tripId, user_id: user.id });
    if (error && error.code === "23505") {
      // Already organizer — just open
    } else if (error) {
      toast.error("Failed to start group");
      return;
    }
    setIsOrganizer(true);
    setIsInGroup(true);
    setIsExpanded(true);
    toast.success("Group created! Invite friends to plan together.");
  };

  // Not in group yet — show CTA
  if (!isInGroup) {
    return (
      <Card className="overflow-hidden">
        <div className="p-4 text-center space-y-3">
          <div className="flex justify-center">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-accent" />
            </div>
          </div>
          <div>
            <p className="font-display text-sm font-semibold">Plan with Friends</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {groupSize > 0
                ? `${groupSize} people are already planning this trip`
                : "Create a group to vote on activities & split costs"}
            </p>
          </div>
          <Button
            size="sm"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={handleStartGroup}
          >
            <Users className="mr-1.5 h-3.5 w-3.5" />
            Start a Group
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Compact header — always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
            <Users className="h-4 w-4 text-accent" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold">Group Planning</p>
            <p className="text-[11px] text-muted-foreground">
              Invite friends & coordinate
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t px-4 pb-4 pt-2">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-3 h-9 mb-3">
                  <TabsTrigger value="members" className="text-xs gap-1.5">
                    <Users className="h-3 w-3" /> Members
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="text-xs gap-1.5">
                    <MessageCircle className="h-3 w-3" /> Chat
                  </TabsTrigger>
                  <TabsTrigger value="costs" className="text-xs gap-1.5">
                    <DollarSign className="h-3 w-3" /> Costs
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="mt-0">
                  <MembersTab tripId={tripId} isOwner={isOrganizer} />
                </TabsContent>

                <TabsContent value="chat" className="mt-0">
                  <GroupChatTab tripId={tripId} />
                </TabsContent>

                <TabsContent value="costs" className="mt-0">
                  <CostsTab tripId={tripId} isOwner={isOrganizer} bookedPrice={bookedPrice} />
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// =============================================
// Members Tab
// =============================================
function MembersTab({ tripId, isOwner }: { tripId: string; isOwner: boolean }) {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [organizerName, setOrganizerName] = useState<string | null>(null);
  const [organizerIsMe, setOrganizerIsMe] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchCollaborators = async () => {
    const { data } = await supabase
      .from("trip_collaborators")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at");
    setCollaborators((data as Collaborator[]) || []);
  };

  // Fetch the group organizer's name
  useEffect(() => {
    (async () => {
      const { data: org } = await supabase
        .from("group_organizers")
        .select("user_id")
        .eq("trip_id", tripId)
        .order("created_at")
        .limit(1)
        .maybeSingle();
      if (!org) return;
      if (org.user_id === user?.id) {
        setOrganizerIsMe(true);
        setOrganizerName("You");
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", org.user_id)
          .maybeSingle();
        setOrganizerName(profile?.display_name || "Organizer");
      }
    })();
  }, [tripId, user]);

  useEffect(() => {
    fetchCollaborators();
    const channel = supabase
      .channel(`collab-${tripId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_collaborators", filter: `trip_id=eq.${tripId}` }, () => {
        fetchCollaborators();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tripId]);

  const handleInviteByEmail = async () => {
    if (!email.trim() || !user) return;
    setLoading(true);
    try {
      const trimmed = email.trim().toLowerCase();

      // Try insert — unique constraint will catch duplicates
      const { error } = await supabase
        .from("trip_collaborators")
        .insert({ trip_id: tripId, email: trimmed, role: "editor", invited_by: user.id });

      if (error) {
        // Duplicate — just fetch existing
        if (error.code === "23505") {
          const { data: existing } = await supabase
            .from("trip_collaborators")
            .select("invite_token")
            .eq("trip_id", tripId)
            .eq("email", trimmed)
            .maybeSingle();
          if (existing?.invite_token) {
            setInviteLink(`${window.location.origin}/trip/${tripId}?invite=${existing.invite_token}`);
          }
          toast("Already invited — share the link below", { icon: "📋" });
          setEmail("");
          setLoading(false);
          return;
        }
        console.error("Invite insert error:", error);
        toast.error("Failed to invite");
        setLoading(false);
        return;
      }

      // Fetch token for the new invite
      const { data: created } = await supabase
        .from("trip_collaborators")
        .select("invite_token")
        .eq("trip_id", tripId)
        .eq("email", trimmed)
        .maybeSingle();

      if (created?.invite_token) {
        setInviteLink(`${window.location.origin}/trip/${tripId}?invite=${created.invite_token}`);
      }
      toast.success(`Invited ${trimmed} — share the link below`);
      setEmail("");
      await fetchCollaborators();
    } catch (e) {
      console.error("Invite error:", e);
      toast.error("Something went wrong");
    }
    setLoading(false);
  };

  const handleGenerateLink = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("trip_collaborators")
        .insert({ trip_id: tripId, role: "editor", invited_by: user.id });
      if (error) {
        console.error("Generate link error:", error);
        toast.error("Failed to create invite link");
        setLoading(false);
        return;
      }
      const { data: created } = await supabase
        .from("trip_collaborators")
        .select("invite_token")
        .eq("trip_id", tripId)
        .eq("invited_by", user.id)
        .is("email", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (created?.invite_token) {
        setInviteLink(`${window.location.origin}/trip/${tripId}?invite=${created.invite_token}`);
        toast.success("Invite link created!");
      } else {
        toast.error("Couldn't retrieve link — try again");
      }
      await fetchCollaborators();
    } catch (e) {
      console.error("Generate link error:", e);
      toast.error("Something went wrong");
    }
    setLoading(false);
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const removeCollaborator = async (id: string) => {
    const { error } = await supabase.from("trip_collaborators").delete().eq("id", id);
    if (error) {
      console.error("Remove error:", error);
      toast.error("Failed to remove");
      return;
    }
    toast.success("Removed");
    await fetchCollaborators();
  };

  const joinedCount = collaborators.filter(c => c.accepted_at).length;
  const pendingCount = collaborators.filter(c => !c.accepted_at).length;

  return (
    <div className="space-y-3">
      {/* Status summary */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-accent" />
          {joinedCount + 1} in group {/* +1 for organizer */}
        </span>
        {pendingCount > 0 && (
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Member list */}
      <div className="space-y-1.5">
        {/* Trip creator / organizer — always first */}
        <div className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-accent/5 border border-accent/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-medium text-accent shrink-0">
              👑
            </div>
            <span className="truncate text-xs font-medium">
              {organizerName || "Organizer"}
            </span>
          </div>
          <Badge className="text-[9px] bg-accent/15 text-accent border-0 px-1.5">Organizer</Badge>
        </div>

        {collaborators.map((c) => {
          const canRemove = isOwner || c.invited_by === user?.id;
          // Determine display name
          const displayName = c.user_id === user?.id
            ? "You"
            : c.email || "Link invite";
          return (
            <div key={c.id} className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-muted/40">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-6 w-6 rounded-full bg-accent/15 flex items-center justify-center text-[10px] font-medium text-accent shrink-0">
                  {c.email ? c.email[0].toUpperCase() : displayName[0]?.toUpperCase() || "?"}
                </div>
                <span className="truncate text-xs">{displayName}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {c.accepted_at ? (
                  <Badge className="text-[9px] bg-accent/15 text-accent border-0 px-1.5">Joined</Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] px-1.5">Pending</Badge>
                )}
                {canRemove && (
                  <button
                    onClick={() => removeCollaborator(c.id)}
                    className="p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Invite actions — always visible */}
      <div className="space-y-2 pt-1 border-t">
        <div className="flex gap-1.5">
          <Input
            placeholder="friend@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-xs h-8"
            onKeyDown={(e) => e.key === "Enter" && handleInviteByEmail()}
          />
          <Button
            size="sm"
            onClick={handleInviteByEmail}
            disabled={loading || !email.trim()}
            className="bg-accent text-accent-foreground hover:bg-accent/90 h-8 px-2.5"
          >
            <UserPlus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={handleGenerateLink}
          disabled={loading}
        >
          <Link2 className="mr-1.5 h-3.5 w-3.5" />
          Generate Invite Link
        </Button>

        {inviteLink && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 p-2 bg-muted rounded-lg">
            <Input value={inviteLink} readOnly className="text-[10px] h-7 bg-transparent border-0 font-mono" />
            <Button size="sm" variant="ghost" className="shrink-0 h-7 w-7 p-0" onClick={copyLink}>
              {copied ? <Check className="h-3 w-3 text-accent" /> : <Copy className="h-3 w-3" />}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Explain what collaborators can do */}
      <div className="rounded-lg bg-muted/30 p-3 space-y-1.5">
        <p className="text-[11px] font-medium text-foreground/80">What can group members do?</p>
        <ul className="text-[10px] text-muted-foreground space-y-0.5">
          <li>👍 Vote on activities (thumbs up/down)</li>
          <li>💬 Chat with your group in real-time</li>
          <li>💰 Split costs after someone books</li>
        </ul>
      </div>
    </div>
  );
}

// =============================================
// Costs Tab — Split AFTER booking (uses actual booked price)
// =============================================
function CostsTab({
  tripId,
  isOwner,
  bookedPrice,
}: {
  tripId: string;
  isOwner: boolean;
  bookedPrice?: number | null;
}) {
  const { user } = useAuth();
  const [splits, setSplits] = useState<PaymentSplit[]>([]);
  const [customTotal, setCustomTotal] = useState("");
  const [hasBooking, setHasBooking] = useState(false);
  const [bookingAmount, setBookingAmount] = useState<number | null>(null);

  // Check if current user has booked this trip
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id, total_price")
        .eq("trip_id", tripId)
        .eq("user_id", user.id)
        .eq("status", "confirmed")
        .maybeSingle();
      if (data) {
        setHasBooking(true);
        setBookingAmount(data.total_price);
      }
    })();
  }, [tripId, user]);

  const fetchSplits = async () => {
    const { data } = await supabase
      .from("payment_splits")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at");
    setSplits((data as PaymentSplit[]) || []);
  };

  useEffect(() => {
    fetchSplits();
    const channel = supabase
      .channel(`splits-${tripId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "payment_splits", filter: `trip_id=eq.${tripId}` }, () => {
        fetchSplits();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tripId]);

  const handleSplitCost = async (total: number) => {
    if (!user) return;

    const { data: collabs } = await supabase
      .from("trip_collaborators")
      .select("user_id, email")
      .eq("trip_id", tripId)
      .not("accepted_at", "is", null);

    // Include the booker + all joined collaborators
    const participants = [
      { user_id: user.id, display_name: "You (paid)" },
      ...(collabs || []).filter((c: any) => c.user_id && c.user_id !== user.id).map((c: any) => ({
        user_id: c.user_id,
        display_name: c.email || "Member",
      })),
    ];

    if (participants.length < 2) {
      toast.error("Need at least 2 people in the group to split costs.");
      return;
    }

    const perPerson = Math.round((total / participants.length) * 100) / 100;

    await supabase.from("payment_splits").delete().eq("trip_id", tripId);

    const inserts = participants.map((p, i) => ({
      trip_id: tripId,
      user_id: p.user_id,
      display_name: p.display_name,
      amount: perPerson,
      is_paid: i === 0, // First person (booker) is auto-marked as paid
    }));

    const { error } = await supabase.from("payment_splits").insert(inserts);
    if (error) toast.error("Failed to create splits");
    else {
      toast.success(`Split $${total.toFixed(0)} between ${participants.length} people`);
      setCustomTotal("");
    }
  };

  const togglePaid = async (splitId: string, currentPaid: boolean) => {
    await supabase.from("payment_splits").update({ is_paid: !currentPaid }).eq("id", splitId);
  };

  const totalAmount = splits.reduce((sum, s) => sum + s.amount, 0);
  const paidAmount = splits.filter((s) => s.is_paid).reduce((sum, s) => sum + s.amount, 0);
  const paidPercent = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  // No booking yet — explain the flow
  if (!hasBooking && splits.length === 0) {
    return (
      <div className="text-center py-5 space-y-3">
        <div className="flex justify-center">
          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium">Book first, split after</p>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-[220px] mx-auto">
            One person books the trip, then splits the actual cost with the group. Everyone settles up via Venmo, Zelle, etc.
          </p>
        </div>
        <div className="rounded-lg bg-muted/40 p-2.5">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="h-5 w-5 rounded-full bg-accent/15 flex items-center justify-center text-[8px] font-bold text-accent">1</span>
            Someone books the trip
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1.5">
            <span className="h-5 w-5 rounded-full bg-accent/15 flex items-center justify-center text-[8px] font-bold text-accent">2</span>
            Split the real price with the group
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1.5">
            <span className="h-5 w-5 rounded-full bg-accent/15 flex items-center justify-center text-[8px] font-bold text-accent">3</span>
            Track who's paid you back
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* If user booked but no splits yet — show split button */}
      {hasBooking && splits.length === 0 && bookingAmount && (
        <div className="text-center py-3 space-y-3">
          <p className="text-xs text-muted-foreground">
            You booked this trip for <span className="font-semibold text-foreground">${bookingAmount.toLocaleString()}</span>
          </p>
          <Button
            size="sm"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => handleSplitCost(bookingAmount)}
          >
            <DollarSign className="mr-1.5 h-3.5 w-3.5" />
            Split ${bookingAmount.toLocaleString()} with Group
          </Button>
          <p className="text-[10px] text-muted-foreground">
            Or enter a custom amount:
          </p>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Custom amount ($)"
              value={customTotal}
              onChange={(e) => setCustomTotal(e.target.value)}
              className="text-xs h-8"
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs shrink-0"
              onClick={() => {
                const val = parseFloat(customTotal);
                if (!isNaN(val) && val > 0) handleSplitCost(val);
                else toast.error("Enter a valid amount");
              }}
            >
              Split
            </Button>
          </div>
        </div>
      )}

      {/* Existing splits */}
      {splits.length > 0 && (
        <>
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">
                ${paidAmount.toFixed(0)} of ${totalAmount.toFixed(0)} settled
              </span>
              <span className="font-medium text-accent">{paidPercent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${paidPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Split list */}
          <div className="space-y-1.5">
            {splits.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-muted/40">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 ${
                    s.is_paid ? "bg-accent/15 text-accent" : "bg-muted-foreground/10 text-muted-foreground"
                  }`}>
                    {s.display_name ? s.display_name[0].toUpperCase() : "?"}
                  </div>
                  <span className="truncate text-xs">{s.display_name || "Member"}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-medium">${s.amount.toFixed(0)}</span>
                  <Button
                    variant={s.is_paid ? "default" : "outline"}
                    size="sm"
                    className={`h-6 px-2 text-[10px] ${s.is_paid ? "bg-accent text-accent-foreground" : ""}`}
                    onClick={() => togglePaid(s.id, s.is_paid)}
                    disabled={s.user_id !== user?.id && !isOwner}
                  >
                    {s.is_paid ? "Paid ✓" : "Mark Paid"}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Info text */}
          <p className="text-[10px] text-muted-foreground text-center">
            Settle up via Venmo, Zelle, or cash — then mark as paid
          </p>

          {/* Recalculate for the person who booked */}
          {hasBooking && (
            <div className="flex gap-2 pt-1 border-t">
              <Input
                type="number"
                placeholder="New total ($)"
                value={customTotal}
                onChange={(e) => setCustomTotal(e.target.value)}
                className="text-xs h-8"
              />
              <Button
                size="sm"
                onClick={() => {
                  const val = parseFloat(customTotal);
                  if (!isNaN(val) && val > 0) handleSplitCost(val);
                  else toast.error("Enter a valid amount");
                }}
                variant="outline"
                className="h-8 text-xs shrink-0"
              >
                Recalculate
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// =============================================
// Activity Vote Buttons — shown for ANY group member
// =============================================
export function ActivityVoteButtons({ activityId }: { activityId: string }) {
  const { user } = useAuth();
  const [votes, setVotes] = useState({ up: 0, down: 0 });
  const [userVote, setUserVote] = useState<number | null>(null);

  const fetchVotes = async () => {
    const { data } = await supabase
      .from("activity_votes")
      .select("vote, user_id")
      .eq("activity_id", activityId);
    if (data) {
      setVotes({
        up: data.filter((v: any) => v.vote === 1).length,
        down: data.filter((v: any) => v.vote === -1).length,
      });
      const myVote = data.find((v: any) => v.user_id === user?.id);
      setUserVote(myVote ? myVote.vote : null);
    }
  };

  useEffect(() => {
    fetchVotes();
    const channel = supabase
      .channel(`votes-${activityId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_votes", filter: `activity_id=eq.${activityId}` }, () => {
        fetchVotes();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activityId, user?.id]);

  const handleVote = async (vote: number) => {
    if (!user) { toast.error("Sign in to vote"); return; }
    if (userVote === vote) {
      await supabase.from("activity_votes").delete().eq("activity_id", activityId).eq("user_id", user.id);
      setUserVote(null);
    } else {
      await supabase.from("activity_votes").upsert(
        { activity_id: activityId, user_id: user.id, vote },
        { onConflict: "activity_id,user_id" }
      );
      setUserVote(vote);
    }
  };

  const total = votes.up + votes.down;
  const net = votes.up - votes.down;

  if (total === 0 && !user) return null;

  return (
    <div className="flex items-center gap-0.5 bg-muted/50 rounded-full px-1 py-0.5">
      <button
        onClick={() => handleVote(1)}
        className={`p-1 rounded-full transition-colors ${userVote === 1 ? "text-accent bg-accent/10" : "text-muted-foreground hover:text-foreground"}`}
        title="Upvote"
      >
        <ThumbsUp className="h-3 w-3" />
      </button>
      {total > 0 && (
        <span className={`text-[10px] font-medium min-w-[14px] text-center ${net > 0 ? "text-accent" : net < 0 ? "text-destructive" : "text-muted-foreground"}`}>
          {net > 0 ? `+${net}` : net}
        </span>
      )}
      <button
        onClick={() => handleVote(-1)}
        className={`p-1 rounded-full transition-colors ${userVote === -1 ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:text-foreground"}`}
        title="Downvote"
      >
        <ThumbsDown className="h-3 w-3" />
      </button>
    </div>
  );
}

// Legacy exports
export const InviteCollaboratorsPanel = GroupPlanningPanel;
export const PaymentSplitPanel = () => null;
