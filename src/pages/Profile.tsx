import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [website, setWebsite] = useState(profile?.website || "");
  const [instagram, setInstagram] = useState(profile?.instagram || "");
  const [twitter, setTwitter] = useState(profile?.twitter || "");
  const [isCreator, setIsCreator] = useState(profile?.is_creator || false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!profile) return;
    const wasCreator = profile.is_creator;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          username,
          bio,
          website,
          instagram,
          twitter,
          is_creator: isCreator,
        })
        .eq("user_id", profile.user_id);

      if (error) throw error;
      await refreshProfile();
      if (isCreator && !wasCreator) {
        toast.success("🎉 You're now a creator! You can publish trips and start earning commissions.");
      } else {
        toast.success("Profile updated!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8 md:py-12">
      <h1 className="font-display text-3xl font-bold mb-8">Edit Profile</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Personal Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-accent text-accent-foreground text-xl">
                  {displayName?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="@username" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Social Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yoursite.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@handle" />
              </div>
              <div className="space-y-2">
                <Label>Twitter / X</Label>
                <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="@handle" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Creator Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Enable Creator Profile</p>
                <p className="text-xs text-muted-foreground">Publish trips and earn commission from bookings</p>
              </div>
              <Switch checked={isCreator} onCheckedChange={setIsCreator} />
            </div>
          </CardContent>
        </Card>

        <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}
