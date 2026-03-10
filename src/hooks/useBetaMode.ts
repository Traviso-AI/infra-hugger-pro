import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useBetaMode() {
  const { data: isBetaMode, isLoading } = useQuery({
    queryKey: ["app-settings", "beta_mode"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "beta_mode")
        .single();
      return data?.value === "true";
    },
    staleTime: 30_000,
  });

  return { isBetaMode: isBetaMode ?? false, isLoading };
}
