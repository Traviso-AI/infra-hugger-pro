import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Search } from "lucide-react";

export function AdminAllUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const toggleBeta = async (userId: string, current: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_beta: !current })
      .eq("user_id", userId);

    if (error) {
      toast.error("Failed to update");
      return;
    }
    toast.success(current ? "Beta access revoked" : "Beta access granted");
    queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
  };

  const filtered = profiles?.filter(
    (p: any) =>
      (p.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.username || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">All Users</CardTitle>
        <p className="text-sm text-muted-foreground">
          {profiles?.length || 0} total users
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by email, name, or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filtered?.map((p: any) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-lg border p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {p.display_name || "No name"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {p.email || "No email"} · Joined{" "}
                  {new Date(p.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {p.is_admin && (
                  <Badge className="bg-purple-600/10 text-purple-600 dark:text-purple-400 border-purple-600/20">
                    Admin
                  </Badge>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Beta</span>
                  <Switch
                    checked={p.is_beta || false}
                    onCheckedChange={() => toggleBeta(p.user_id, p.is_beta || false)}
                  />
                </div>
              </div>
            </div>
          ))}
          {filtered?.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No users found
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
