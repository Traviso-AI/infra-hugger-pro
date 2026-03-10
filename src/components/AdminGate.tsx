import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  // Wait for both auth AND profile to be resolved
  if (loading || (user && !profile)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!profile?.is_admin) return <Navigate to="/" replace />;

  return <>{children}</>;
}
