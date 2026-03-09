import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users, UserPlus, ThumbsUp, ThumbsDown, DollarSign, Copy, Check,
  Eye, Pencil, Link2, ChevronDown, ChevronUp, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Collaborator {
  id: string;
  trip_id: string;
  user_id: string | null;
  email: string | null;
  role: string;
  invite_token: string;
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
// Main Group Planning Panel — Owner & Collaborator view
// =============================================
export function GroupPlanningPanel({
  tripId,
  isOwner,
  isCollaborator,
}: {
  tripId: string;
  isOwner: boolean;
  isCollaborator: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("members");

  // Don't render at all if user is neither owner nor collaborator
  if (!isOwner && !isCollaborator) return null;

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
              {isOwner ? "Invite friends & split costs" : "You're a collaborator"}
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
                <TabsList className="w-full grid grid-cols-2 h-9 mb-3">
                  <TabsTrigger value="members" className="text-xs gap-1.5">
                    <Users className="h-3 w-3" /> Members
                  </TabsTrigger>
                  <TabsTrigger value="costs" className="text-xs gap-1.5">
                    <DollarSign className="h-3 w-3" /> Split Costs
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="mt-0">
                  <MembersTab tripId={tripId} isOwner={isOwner} />
                </TabsContent>

                <TabsContent value="costs" className="mt-0">
                  <CostsTab tripId={tripId} isOwner={isOwner} />
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
// Members Tab — Invite & manage collaborators
// =============================================
function MembersTab({ tripId, isOwner }: { tripId: string; isOwner: boolean }) {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);

  const fetchCollaborators = async () => {
    const { data } = await supabase
      .from("trip_collaborators")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at");
    setCollaborators((data as Collaborator[]) || []);
  };

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
    const { data, error } = await supabase
      .from("trip_collaborators")
      .insert({ trip_id: tripId, email: email.trim(), role, invited_by: user.id })
      .select()
      .single();
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Already invited" : "Failed to invite");
    } else {
      toast.success(`Invited ${email.trim()}`);
      setEmail("");
      const token = (data as any)?.invite_token;
      if (token) {
        const link = `${window.location.origin}/trip/${tripId}?invite=${token}`;
        setInviteLink(link);
      }
    }
    setLoading(false);
  };

  const handleGenerateLink = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("trip_collaborators")
      .insert({ trip_id: tripId, role: "editor", invited_by: user.id })
      .select()
      .single();
    if (error) {
      toast.error("Failed to create invite link");
    } else {
      const token = (data as any)?.invite_token;
      const link = `${window.location.origin}/trip/${tripId}?invite=${token}`;
      setInviteLink(link);
      toast.success("Invite link created!");
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
    await supabase.from("trip_collaborators").delete().eq("id", id);
    toast.success("Removed");
  };

  const joinedCount = collaborators.filter(c => c.accepted_at).length;
  const pendingCount = collaborators.filter(c => !c.accepted_at).length;

  return (
    <div className="space-y-3">
      {/* Status summary */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-accent" />
          {joinedCount} joined
        </span>
        {pendingCount > 0 && (
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Member list */}
      {collaborators.length > 0 ? (
        <div className="space-y-1.5">
          {collaborators.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-muted/40">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-6 w-6 rounded-full bg-accent/15 flex items-center justify-center text-[10px] font-medium text-accent shrink-0">
                  {c.email ? c.email[0].toUpperCase() : "?"}
                </div>
                <span className="truncate text-xs">{c.email || "Link invite"}</span>
                {c.role === "editor" ? (
                  <Pencil className="h-3 w-3 text-muted-foreground shrink-0" />
                ) : (
                  <Eye className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {c.accepted_at ? (
                  <Badge className="text-[9px] bg-accent/15 text-accent border-0 px-1.5">Joined</Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] px-1.5">Pending</Badge>
                )}
                {isOwner && (
                  <button
                    onClick={() => removeCollaborator(c.id)}
                    className="p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground mb-1">No members yet</p>
          <p className="text-[11px] text-muted-foreground/70">Invite friends to plan together</p>
        </div>
      )}

      {/* Invite actions — only for owner */}
      {isOwner && (
        <>
          {!showInviteForm ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => setShowInviteForm(true)}
            >
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              Invite Someone
            </Button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2.5 pt-1 border-t"
            >
              {/* Email invite */}
              <div className="flex gap-1.5">
                <Input
                  placeholder="friend@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-xs h-8"
                  onKeyDown={(e) => e.key === "Enter" && handleInviteByEmail()}
                />
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="w-20 text-[10px] h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={handleInviteByEmail}
                  disabled={loading || !email.trim()}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 h-8 px-2.5"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Or generate link */}
              <button
                onClick={handleGenerateLink}
                disabled={loading}
                className="w-full flex items-center justify-center gap-1.5 text-[11px] text-accent hover:text-accent/80 transition-colors py-1"
              >
                <Link2 className="h-3 w-3" />
                Or generate a shareable link
              </button>

              {/* Show invite link */}
              {inviteLink && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 p-2 bg-muted rounded-lg">
                  <Input value={inviteLink} readOnly className="text-[10px] h-7 bg-transparent border-0 font-mono" />
                  <Button size="sm" variant="ghost" className="shrink-0 h-7 w-7 p-0" onClick={copyLink}>
                    {copied ? <Check className="h-3 w-3 text-accent" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </motion.div>
              )}

              <button
                onClick={() => { setShowInviteForm(false); setInviteLink(null); }}
                className="w-full text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

// =============================================
// Costs Tab — Split payments
// =============================================
function CostsTab({ tripId, isOwner }: { tripId: string; isOwner: boolean }) {
  const { user } = useAuth();
  const [splits, setSplits] = useState<PaymentSplit[]>([]);
  const [totalCost, setTotalCost] = useState("");

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

  const handleGenerateSplits = async () => {
    if (!user) return;
    const total = parseFloat(totalCost);
    if (isNaN(total) || total <= 0) { toast.error("Enter a valid total"); return; }

    const { data: collabs } = await supabase
      .from("trip_collaborators")
      .select("user_id, email")
      .eq("trip_id", tripId)
      .not("accepted_at", "is", null);

    const participants = [
      { user_id: user.id, display_name: "You (organizer)" },
      ...(collabs || []).filter((c: any) => c.user_id).map((c: any) => ({
        user_id: c.user_id,
        display_name: c.email || "Member",
      })),
    ];

    if (participants.length < 2) {
      toast.error("Need at least 2 people to split costs. Invite friends first!");
      return;
    }

    const perPerson = Math.round((total / participants.length) * 100) / 100;

    await supabase.from("payment_splits").delete().eq("trip_id", tripId);

    const inserts = participants.map((p) => ({
      trip_id: tripId,
      user_id: p.user_id,
      display_name: p.display_name,
      amount: perPerson,
      is_paid: false,
    }));

    const { error } = await supabase.from("payment_splits").insert(inserts);
    if (error) toast.error("Failed to create splits");
    else {
      toast.success(`Split $${total} between ${participants.length} people`);
      setTotalCost("");
    }
  };

  const togglePaid = async (splitId: string, currentPaid: boolean) => {
    await supabase.from("payment_splits").update({ is_paid: !currentPaid }).eq("id", splitId);
  };

  const totalAmount = splits.reduce((sum, s) => sum + s.amount, 0);
  const paidAmount = splits.filter((s) => s.is_paid).reduce((sum, s) => sum + s.amount, 0);
  const paidPercent = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  return (
    <div className="space-y-3">
      {splits.length > 0 ? (
        <>
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">
                ${paidAmount.toFixed(0)} of ${totalAmount.toFixed(0)} collected
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
                    disabled={!isOwner && s.user_id !== user?.id}
                  >
                    {s.is_paid ? "Paid ✓" : "Mark Paid"}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Recalculate option for owner */}
          {isOwner && (
            <div className="flex gap-2 pt-1">
              <Input
                type="number"
                placeholder="New total ($)"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                className="text-xs h-8"
              />
              <Button
                size="sm"
                onClick={handleGenerateSplits}
                variant="outline"
                className="h-8 text-xs shrink-0"
              >
                Recalculate
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          {isOwner ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Split trip costs evenly</p>
                <p className="text-[11px] text-muted-foreground/70">
                  Enter total cost — it'll be divided among all joined members
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Total cost ($)"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
                  className="text-xs h-9"
                />
                <Button
                  size="sm"
                  onClick={handleGenerateSplits}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 h-9 px-4"
                >
                  Split
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              The trip organizer hasn't set up cost splitting yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================
// Activity Vote Buttons — shown inline on activities
// =============================================
export function ActivityVoteButtons({ activityId, tripId }: { activityId: string; tripId: string }) {
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

  // Don't show if no votes and not logged in
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

// Legacy exports for backward compatibility
export const InviteCollaboratorsPanel = GroupPlanningPanel;
export const PaymentSplitPanel = () => null;
