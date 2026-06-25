import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { NeumorphicCard } from "../components/ui/card";
import { NeumorphicInput } from "../components/ui/input";
import { NeumorphicButton } from "../components/ui/button";
import { KeyRound, ArrowLeft } from "lucide-react";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
  const { addToast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      addToast("Password reset link sent to your email", "success");
    } catch (error: any) {
      addToast(error.message || "Failed to send reset email", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh] px-4">
      <NeumorphicCard className="w-full max-w-md p-8 animate-in fade-in zoom-in-95 shadow-[var(--shadow-neumorphic-floating)] border border-transparent">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-[var(--color-civic-surface)] rounded-2xl shadow-[var(--shadow-neumorphic)] border border-[var(--color-civic-surface-inset)] mb-4">
            <KeyRound className="h-8 w-8 text-[var(--color-civic-primary)]" />
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--color-civic-text-primary)] tracking-tight">Reset Password</h1>
          <p className="text-[var(--color-civic-text-secondary)] font-medium text-sm mt-2">
            Enter your email to receive a password reset link
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleReset} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[var(--color-civic-text-secondary)] mb-2">Email</label>
              <NeumorphicInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@example.com"
                required
              />
            </div>

            <NeumorphicButton type="submit" className="w-full justify-center font-bold" variant="primary" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </NeumorphicButton>
          </form>
        ) : (
          <div className="bg-[var(--color-civic-status-confirmed)]/10 text-[var(--color-civic-status-confirmed)] p-4 rounded-xl shadow-sm border border-[var(--color-civic-status-confirmed)]/20 text-center font-bold">
            If an account exists with {email}, you will receive a password reset link shortly.
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/login" className="inline-flex items-center text-sm text-[var(--color-civic-text-muted)] font-bold hover:text-[var(--color-civic-text-primary)] transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Sign In
          </Link>
        </div>
      </NeumorphicCard>
    </div>
  );
}
