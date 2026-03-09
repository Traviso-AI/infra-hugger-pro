import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Profile() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  // Redirect to public profile page using username or user_id as fallback
  const identifier = profile?.username || profile?.user_id;
  if (identifier) {
    return <Navigate to={`/profile/${identifier}`} replace />;
  }

  return <Navigate to="/login" replace />;
}
