import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Compass } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBetaMode } from "@/hooks/useBetaMode";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [betaBlocked, setBetaBlocked] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { isBetaMode } = useBetaMode();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBetaBlocked(false);
    setLoading(true);

    try {
      // Beta gate: check whitelist before creating account
      if (isBetaMode) {
        const { data: whitelistEntry } = await supabase
          .from("beta_whitelist")
          .select("id")
          .eq("email", email.toLowerCase().trim())
          .maybeSingle();

        if (!whitelistEntry) {
          setBetaBlocked(true);
          setLoading(false);
          return;
        }
      }

      await signUp(email, password, fullName);

      // If beta mode, mark whitelist entry as signed up and set is_beta on profile
      if (isBetaMode) {
        // These will be handled after profile creation via the trigger,
        // but we also update whitelist immediately
        await supabase
          .from("beta_whitelist")
          .update({ has_signed_up: true })
          .eq("email", email.toLowerCase().trim());
      }

      toast.success("Account created! Check your email to confirm.");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error("Google sign-in failed");
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <Compass className="h-5 w-5 text-accent" />
          </div>
          <CardTitle className="font-display text-2xl">Join Traviso</CardTitle>
          <CardDescription>Create your account and start exploring</CardDescription>
        </CardHeader>
        <CardContent>
          {betaBlocked && (
            <div className="mb-5 rounded-lg border border-accent/30 bg-accent/5 p-4 text-center">
              <p className="text-sm text-foreground">
                Traviso AI is currently in private beta. You can join the waitlist at{" "}
                <span className="font-medium">traviso.ai</span> — we'll send you an invite the moment a spot opens up.
              </p>
              <a href="https://traviso.ai" target="_blank" rel="noopener noreferrer">
                <Button className="mt-3 bg-accent text-accent-foreground hover:bg-accent/90" size="sm">
                  Join the Waitlist
                </Button>
              </a>
            </div>
          )}
          <Button
            variant="outline"
            className="w-full mb-4"
            onClick={handleGoogleSignIn}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </Button>
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Jane Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-accent hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
