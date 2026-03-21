import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBetaMode } from "@/hooks/useBetaMode";

export function BetaGate({ children }: { children: React.ReactNode }) {
  const { user, profile, loading: authLoading } = useAuth();
  const { isBetaMode, isLoading: betaLoading } = useBetaMode();

  if (betaLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  // If beta mode is off, let everyone through
  if (!isBetaMode) return <>{children}</>;

  // If profile hasn't loaded yet, show spinner
  if (!profile && !authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  // If still loading auth, show spinner
  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  // Not logged in during beta — redirect to login
  if (!user) return <Navigate to="/login" replace />;

  // Logged in with beta access or admin — allow through
  if (profile?.is_beta || profile?.is_admin) return <>{children}</>;

  // Logged in but no beta access — waitlist
  return <Navigate to="/beta-waitlist" replace />;
}
