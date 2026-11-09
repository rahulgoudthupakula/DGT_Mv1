import { login, developmentDatabase, ApiError } from "@/lib/backend";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Store, Eye, EyeOff } from "lucide-react";

export const LoginPage = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword,setShowPassword]=useState(false);
  const [error, setError] = useState("");

  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }
    setBusy(true);
    try { await login(email, password); setPassword(""); onLogin(); }
    catch (error) { setError(error instanceof ApiError && error.status===401 ? "Email or password is incorrect. Please try again." : error instanceof Error ? error.message : "Unable to sign in. Please try again."); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Store className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">DGT Project</CardTitle>
          <p className="text-sm text-muted-foreground">{developmentDatabase ? "Development · Store 1 & Store 2 (dgt_test)" : "Connected to real dgt"} · Sign in again after refreshing</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative"><Input
                id="password"
                type={showPassword?"text":"password"}
                autoComplete="current-password"
                className="pr-12"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              /><button type="button" className="absolute right-3 top-2.5" aria-label={showPassword?"Hide password":"Show password"} aria-pressed={showPassword} onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff className="h-5 w-5"/>:<Eye className="h-5 w-5"/>}</button></div>
            </div>
            {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign In"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">New to DGT? <Link to="/signup" className="text-primary font-medium underline-offset-4 hover:underline focus-visible:underline">Create an account</Link></p>
        </CardContent>
      </Card>
    </div>
  );
};
