import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, Globe } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function BetaModeSwitch() {
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingValue, setPendingValue] = useState<string | null>(null);

  const { data: betaMode } = useQuery({
    queryKey: ["app-settings", "beta_mode"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "beta_mode")
        .single();
      return data?.value === "true";
    },
  });

  const isOn = betaMode ?? true;

  const handleToggle = (newValue: string) => {
    setPendingValue(newValue);
    setShowConfirm(true);
  };

  const confirmToggle = async () => {
    if (!pendingValue) return;
    const { error } = await supabase
      .from("app_settings")
      .update({ value: pendingValue })
      .eq("key", "beta_mode");

    if (error) {
      toast.error("Failed to update beta mode");
    } else {
      toast.success(pendingValue === "true" ? "Beta mode re-enabled" : "App is now live!");
      queryClient.invalidateQueries({ queryKey: ["app-settings", "beta_mode"] });
    }
    setShowConfirm(false);
    setPendingValue(null);
  };

  return (
    <>
      <Card className={isOn ? "border-orange-400/50 bg-orange-50 dark:bg-orange-950/20" : "border-green-400/50 bg-green-50 dark:bg-green-950/20"}>
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {isOn ? (
              <Shield className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            ) : (
              <Globe className="h-6 w-6 text-green-600 dark:text-green-400" />
            )}
            <div>
              <p className="font-bold text-base">
                {isOn ? "Beta Mode is ON — App is in private beta" : "App is LIVE — Open to everyone"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isOn ? "Only whitelisted users can sign up and access the app" : "Anyone can sign up and use the app freely"}
              </p>
            </div>
          </div>
          <Button
            variant={isOn ? "default" : "outline"}
            className={isOn ? "bg-orange-600 hover:bg-orange-700 text-white" : "border-green-600 text-green-700 hover:bg-green-100 dark:text-green-400"}
            onClick={() => handleToggle(isOn ? "false" : "true")}
          >
            {isOn ? "Open App to Public" : "Re-enable Beta Mode"}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingValue === "false"
                ? "This will immediately allow anyone to sign up and access the app. There is no undo without manually re-enabling beta mode."
                : "This will restrict sign-ups and app access to only whitelisted beta users. Existing non-beta users will be redirected to the waitlist."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggle}
              className={pendingValue === "false" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-accent text-accent-foreground hover:bg-accent/90"}
            >
              {pendingValue === "false" ? "Yes, Go Live" : "Yes, Enable Beta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
