import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Send, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function BetaWhitelist() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [emailInput, setEmailInput] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);

  const { data: whitelist } = useQuery({
    queryKey: ["admin-beta-whitelist"],
    queryFn: async () => {
      const { data } = await supabase
        .from("beta_whitelist")
        .select("*")
        .order("invited_at", { ascending: false });
      return data || [];
    },
  });

  const invitedCount = whitelist?.length || 0;
  const signedUpCount = whitelist?.filter((w: any) => w.has_signed_up).length || 0;

  const handleSendInvites = async () => {
    const emails = emailInput
      .split(/[,\n]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && e.includes("@"));

    if (!emails.length) {
      toast.error("Enter at least one valid email");
      return;
    }

    setSending(true);
    try {
      const rows = emails.map((email) => ({
        email,
        invited_by: user?.email || null,
      }));

      // Insert into whitelist (skip duplicates)
      const { error } = await supabase.from("beta_whitelist").upsert(rows, {
        onConflict: "email",
        ignoreDuplicates: true,
      });

      if (error) throw error;

      // For any emails that already have profiles, set is_beta = true
      for (const email of emails) {
        await supabase
          .from("profiles")
          .update({ is_beta: true })
          .eq("email", email);
      }

      toast.success(`${emails.length} email(s) added to whitelist`);
      setEmailInput("");
      queryClient.invalidateQueries({ queryKey: ["admin-beta-whitelist"] });
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to add emails");
    } finally {
      setSending(false);
    }
  };

  const handleRemove = async (entry: any) => {
    // Remove from whitelist
    await supabase.from("beta_whitelist").delete().eq("id", entry.id);
    // Remove beta access from profile if they have one
    if (entry.has_signed_up) {
      await supabase
        .from("profiles")
        .update({ is_beta: false })
        .eq("email", entry.email);
    }
    toast.success("Removed from whitelist");
    queryClient.invalidateQueries({ queryKey: ["admin-beta-whitelist"] });
    queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
  };

  const filtered = whitelist?.filter((w: any) =>
    w.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Beta Whitelist</CardTitle>
        <p className="text-sm text-muted-foreground">
          {invitedCount} invited, {signedUpCount} have signed up
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add emails */}
        <div className="space-y-2">
          <Textarea
            placeholder="Enter emails — one per line or comma-separated"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            rows={3}
            className="text-sm"
          />
          <Button
            onClick={handleSendInvites}
            disabled={sending || !emailInput.trim()}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Send className="mr-2 h-4 w-4" />
            {sending ? "Adding..." : "Send Invites"}
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search whitelist..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filtered?.map((entry: any) => (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-2 rounded-lg border p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{entry.email}</p>
                <p className="text-xs text-muted-foreground">
                  Invited {new Date(entry.invited_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={entry.has_signed_up ? "default" : "secondary"}>
                  {entry.has_signed_up ? "Signed Up" : "Pending"}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRemove(entry)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {filtered?.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {search ? "No matches" : "No one on the whitelist yet"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
