import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { NeumorphicCard } from "../components/ui/card";
import { NeumorphicInput } from "../components/ui/input";
import { NeumorphicButton } from "../components/ui/button";
import { LogIn, Eye, EyeOff } from "lucide-react";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginWithEmailPassword, signInWithGoogle } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithEmailPassword(email, password);
      addToast("Successfully logged in", "success");
      navigate("/");
    } catch (error: any) {
      addToast(error.message || "Failed to log in", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      addToast("Successfully logged in with Google", "success");
      navigate("/");
    } catch (error: any) {
      addToast(error.message || "Failed to log in with Google", "error");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh] px-4">
      <NeumorphicCard className="w-full max-w-md p-8 animate-in fade-in zoom-in-95">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-[var(--color-civic-surface-inset)] rounded-2xl shadow-[var(--shadow-neumorphic-inset)] border border-transparent mb-4">
            <LogIn className="h-8 w-8 text-[var(--color-civic-primary)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-civic-text-primary)]">Welcome Back</h1>
          <p className="text-[var(--color-civic-text-secondary)] font-medium text-sm mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[var(--color-civic-text-primary)] mb-2 uppercase tracking-widest">Email</label>
              <NeumorphicInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-civic-text-primary)] mb-2 uppercase tracking-widest">Password</label>
              <div className="relative">
                <NeumorphicInput
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-civic-text-muted)] hover:text-[var(--color-civic-text-primary)] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link to="/forgot-password" className="text-sm font-bold text-[var(--color-civic-primary)] hover:underline">
              Forgot password?
            </Link>
          </div>

          <NeumorphicButton type="submit" className="w-full justify-center" variant="primary" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </NeumorphicButton>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="h-px bg-[var(--color-civic-border)] flex-1" />
          <span className="text-xs font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">or continue with</span>
          <div className="h-px bg-[var(--color-civic-border)] flex-1" />
        </div>

        <div className="mt-6">
          <NeumorphicButton onClick={handleGoogleLogin} className="w-full justify-center gap-2 bg-[var(--color-civic-surface)]">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              <path d="M1 1h22v22H1z" fill="none"/>
            </svg>
            Google Sign-In
          </NeumorphicButton>
        </div>

        <div className="mt-8 text-center text-sm text-[var(--color-civic-text-secondary)] font-medium">
          Don't have an account?{" "}
          <Link to="/register" className="text-[var(--color-civic-primary)] font-bold hover:underline">
            Register here
          </Link>
        </div>
      </NeumorphicCard>
    </div>
  );
}
