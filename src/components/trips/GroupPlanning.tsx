import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, UserPlus, ThumbsUp, ThumbsDown, DollarSign, Copy, Check, Crown, Eye, Pencil, Link2 } from "lucide-react";
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
  profiles?: { display_name: string | null; avatar_url: string | null } | null;
}

interface ActivityVote {
  activity_id: string;
  upvotes: number;
  downvotes: number;
  userVote: number | null;
}

interface PaymentSplit {
  id: string;
  user_id: string;
  display_name: string | null;
  amount: number;
  is_paid: boolean;
}

// ---- Invite Collaborators Panel ----
export function InviteCollaboratorsPanel({ tripId, isOwner }: { tripId: string; isOwner: boolean }) {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
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
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const removeCollaborator = async (id: string) => {
    await supabase.from("trip_collaborators").delete().eq("id", id);
    toast.success("Removed");
  };

  const RoleIcon = ({ r }: { r: string }) => r === "editor" ? <Pencil className="h-3 w-3" /> : <Eye className="h-3 w-3" />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display flex items-center gap-2">
          <Users className="h-4 w-4 text-accent" />
          Group Planning
          <Badge variant="outline" className="ml-auto text-[10px]">{collaborators.length} invited</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Collaborator list */}
        {collaborators.length > 0 && (
          <div className="space-y-2">
            {collaborators.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg bg-muted/40">
                <div className="flex items-center gap-2 min-w-0">
                  <RoleIcon r={c.role} />
                  <span className="truncate">{c.email || "Link invite"}</span>
                  {c.accepted_at ? (
                    <Badge variant="default" className="text-[9px] bg-accent text-accent-foreground px-1">Joined</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] px-1">Pending</Badge>
                  )}
                </div>
                {isOwner && (
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive" onClick={() => removeCollaborator(c.id)}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Invite form */}
        {isOwner && (
          <>
            <div className="flex gap-2">
              <Input
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleInviteByEmail()}
              />
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-24 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleInviteByEmail} disabled={loading || !email.trim()} className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0">
                <UserPlus className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] text-muted-foreground uppercase">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleGenerateLink} disabled={loading}>
              <Link2 className="mr-1.5 h-3.5 w-3.5" />
              Generate Invite Link
            </Button>

            {inviteLink && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <Input value={inviteLink} readOnly className="text-xs h-8 bg-transparent border-0" />
                  <Button size="sm" variant="ghost" className="shrink-0 h-8" onClick={copyLink}>
                    {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Activity Vote Buttons ----
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

  const net = votes.up - votes.down;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleVote(1)}
        className={`p-1 rounded transition-colors ${userVote === 1 ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>
      {net !== 0 && (
        <span className={`text-xs font-medium ${net > 0 ? "text-accent" : "text-destructive"}`}>
          {net > 0 ? `+${net}` : net}
        </span>
      )}
      <button
        onClick={() => handleVote(-1)}
        className={`p-1 rounded transition-colors ${userVote === -1 ? "text-destructive" : "text-muted-foreground hover:text-foreground"}`}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ---- Payment Split Panel ----
export function PaymentSplitPanel({ tripId, isOwner }: { tripId: string; isOwner: boolean }) {
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

    // Get collaborators + owner
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

    const perPerson = Math.round((total / participants.length) * 100) / 100;

    // Delete existing splits
    await supabase.from("payment_splits").delete().eq("trip_id", tripId);

    // Insert new splits
    const inserts = participants.map((p) => ({
      trip_id: tripId,
      user_id: p.user_id,
      display_name: p.display_name,
      amount: perPerson,
      is_paid: false,
    }));

    const { error } = await supabase.from("payment_splits").insert(inserts);
    if (error) toast.error("Failed to create splits");
    else toast.success(`Split $${total} between ${participants.length} people`);
  };

  const togglePaid = async (splitId: string, currentPaid: boolean) => {
    await supabase.from("payment_splits").update({ is_paid: !currentPaid }).eq("id", splitId);
  };

  const totalAmount = splits.reduce((sum, s) => sum + s.amount, 0);
  const paidAmount = splits.filter((s) => s.is_paid).reduce((sum, s) => sum + s.amount, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-accent" />
          Split Payments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {splits.length > 0 ? (
          <>
            <div className="space-y-2">
              {splits.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{s.display_name || "Member"}</span>
                    <span className="font-medium text-accent">${s.amount.toFixed(2)}</span>
                  </div>
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
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
              <span>Collected: ${paidAmount.toFixed(2)} / ${totalAmount.toFixed(2)}</span>
              <span>{splits.filter((s) => s.is_paid).length}/{splits.length} paid</span>
            </div>
          </>
        ) : isOwner ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Enter total trip cost to split evenly among all accepted collaborators.</p>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Total cost ($)"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                className="text-sm"
              />
              <Button size="sm" onClick={handleGenerateSplits} className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0">
                Split
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">No payment splits yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
