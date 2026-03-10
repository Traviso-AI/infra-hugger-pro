import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBetaMode } from "@/hooks/useBetaMode";

export function BetaGate({ children }: { children: React.ReactNode }) {
  const { profile, loading: authLoading } = useAuth();
  const { isBetaMode, isLoading: betaLoading } = useBetaMode();

  if (authLoading || betaLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  // If beta mode is off, let everyone through
  if (!isBetaMode) return <>{children}</>;

  // If beta mode is on, check if user has beta access
  if (profile?.is_beta || profile?.is_admin) return <>{children}</>;

  // Not approved — redirect to waitlist
  return <Navigate to="/beta-waitlist" replace />;
}
