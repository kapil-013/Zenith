import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { NeumorphicCard } from "../components/ui/card";
import { NeumorphicInput } from "../components/ui/input";
import { NeumorphicButton } from "../components/ui/button";
import { UserPlus, Eye, EyeOff } from "lucide-react";

export function Register() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { registerCitizen } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      addToast("Passwords do not match", "error");
      return;
    }
    setLoading(true);
    try {
      await registerCitizen(name, email, password);
      addToast("Successfully registered", "success");
      navigate("/");
    } catch (error: any) {
      addToast(error.message || "Failed to register", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[70vh] px-4 my-8">
      <NeumorphicCard className="w-full max-w-md p-8 animate-in fade-in zoom-in-95">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-[var(--color-civic-surface-inset)] rounded-2xl shadow-[var(--shadow-neumorphic-inset)] border border-transparent mb-4">
            <UserPlus className="h-8 w-8 text-[var(--color-civic-primary)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-civic-text-primary)]">
            {t("Register_Title")}
          </h1>
          <p className="text-[var(--color-civic-text-secondary)] font-medium text-sm mt-2">
            {t("Register_Sub")}
          </p>
        </div>

        <div className="bg-[var(--color-civic-surface-inset)] shadow-[var(--shadow-neumorphic-inset)] rounded-xl p-3 mb-6">
          <p className="text-xs text-[var(--color-civic-text-secondary)] font-medium text-center">
            {t("Register_Hint")}
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[var(--color-civic-text-primary)] mb-2 uppercase tracking-widest">
                {t("Register_Name")}
              </label>
              <NeumorphicInput
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-civic-text-primary)] mb-2 uppercase tracking-widest">
                {t("Register_Email")}
              </label>
              <NeumorphicInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-civic-text-primary)] mb-2 uppercase tracking-widest">
                {t("Register_Password")}
              </label>
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
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-civic-text-primary)] mb-2 uppercase tracking-widest">
                {t("Register_ConfirmPassword")}
              </label>
              <NeumorphicInput
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <NeumorphicButton
            type="submit"
            className="w-full justify-center"
            variant="primary"
            disabled={loading}
          >
            {loading ? t("Register_ButtonLoading") : t("Register_Button")}
          </NeumorphicButton>
        </form>

        <div className="mt-8 text-center text-sm text-[var(--color-civic-text-secondary)] font-medium">
          {t("Register_AlreadyAccount")}{" "}
          <Link
            to="/login"
            className="text-[var(--color-civic-primary)] font-bold hover:underline"
          >
            {t("Register_SignIn")}
          </Link>
        </div>
      </NeumorphicCard>
    </div>
  );
}
