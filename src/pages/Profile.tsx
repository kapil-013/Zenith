import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { NeumorphicCard } from "../components/ui/card";
import { db } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "../context/ToastContext";
import { NeumorphicInput } from "../components/ui/input";
import {
  Award,
  Star,
  Activity,
  CheckCircle2,
  FileText,
  CheckSquare,
  ShieldCheck,
  Shield,
  TrendingUp,
  Users,
  Target,
  Clock,
  Zap,
  Phone,
  Mail,
  Settings,
  Save,
  Bell,
} from "lucide-react";
import { motion } from "motion/react";
import { useUserStats } from "../hooks/useUserStats";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { AIBriefingWidget } from "../components/ui/intelligence/AIBriefingWidget";
import { NeumorphicButton } from "../components/ui/button";

export function Profile() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const {
    stats,
    civicScore,
    trustScore,
    currentLevel,
    currentTitle,
    achievements,
    nextLevel,
    loading,
  } = useUserStats();

  const [phone, setPhone] = useState(user?.phone || "");
  const [emailNotif, setEmailNotif] = useState(
    user?.preferences?.notificationPreferences?.email !== false
  );
  const [smsNotif, setSmsNotif] = useState(
    user?.preferences?.notificationPreferences?.sms === true
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setPhone(user.phone || "");
      setEmailNotif(user.preferences?.notificationPreferences?.email !== false);
      setSmsNotif(user.preferences?.notificationPreferences?.sms === true);
    }
  }, [user]);

  const handleSaveSettings = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        phone: phone.trim() || null,
        "preferences.notificationPreferences": {
          email: emailNotif,
          sms: smsNotif,
        },
      });
      addToast("Profile settings updated successfully!", "success");
    } catch (error: any) {
      console.error(error);
      addToast("Failed to update profile settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!user)
    return (
      <div className="p-12 text-center text-[var(--color-civic-text-secondary)] font-medium">
        Please sign in to view your profile.
      </div>
    );

  const getTrustColor = (score: number) => {
    if (score >= 80) return "text-[var(--color-civic-success)]";
    if (score >= 50) return "text-[var(--color-civic-warning)]";
    return "text-[var(--color-civic-danger)]";
  };

  const progressToNextLevel = nextLevel
    ? (civicScore / nextLevel.minScore) * 100
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-8 py-8 px-4"
    >
      {/* Top Section: Profile Identity */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <NeumorphicCard className="p-8 flex flex-col lg:flex-row items-center gap-8 text-center lg:text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-civic-primary-soft)] rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none opacity-50" />

          {/* Avatar */}
          <div className="h-32 w-32 rounded-full bg-[var(--color-civic-surface-inset)] shadow-[var(--shadow-neumorphic-inset)] p-2 flex-shrink-0 relative z-10 border border-transparent">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[var(--color-civic-surface)] flex items-center justify-center text-4xl font-black text-[var(--color-civic-primary)] shadow-[var(--shadow-neumorphic)]">
                {user.name.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 relative z-10 space-y-4">
            <div>
              <h1 className="text-4xl font-black text-[var(--color-civic-text-primary)] tracking-tight">
                {user.name}
              </h1>
              <p className="text-lg text-[var(--color-civic-text-secondary)] font-medium mt-1">
                {currentTitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <div className="px-4 py-2 bg-[var(--color-civic-surface-inset)] shadow-[var(--shadow-neumorphic-inset)] rounded-full flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--color-civic-primary)]" />
                <span className="text-sm font-bold text-[var(--color-civic-text-secondary)]">
                  Member since
                </span>
                <span className="text-sm font-bold text-[var(--color-civic-text-primary)]">
                  {format(user.createdAt, "MMM yyyy")}
                </span>
              </div>
              <div className="px-4 py-2 bg-[var(--color-civic-surface-inset)] shadow-[var(--shadow-neumorphic-inset)] rounded-full flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--color-civic-text-secondary)]" />
                <span className="text-sm font-bold text-[var(--color-civic-text-secondary)] uppercase tracking-wider">
                  Role
                </span>
                <span className="text-sm font-bold text-[var(--color-civic-text-primary)] capitalize">
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          {/* Main Reputation Scores - Only for Citizens */}
          {user.role === "citizen" && (
            <div className="flex gap-4 relative z-10 w-full lg:w-auto mt-4 lg:mt-0 justify-center">
              <div className="flex flex-col items-center p-4 bg-[var(--color-civic-surface-inset)] shadow-[var(--shadow-neumorphic-inset)] rounded-2xl min-w-[120px]">
                <div className="text-[var(--color-civic-text-muted)] text-xs font-bold uppercase tracking-widest mb-1">
                  Civic Score
                </div>
                <div className="text-3xl font-black text-[var(--color-civic-primary)]">
                  {loading ? "..." : civicScore}
                </div>
              </div>
              <div className="flex flex-col items-center p-4 bg-[var(--color-civic-surface-inset)] shadow-[var(--shadow-neumorphic-inset)] rounded-2xl min-w-[120px]">
                <div className="text-[var(--color-civic-text-muted)] text-xs font-bold uppercase tracking-widest mb-1">
                  Trust Score
                </div>
                <div
                  className={`text-3xl font-black ${getTrustColor(trustScore)}`}
                >
                  {loading ? "..." : trustScore}
                </div>
              </div>
            </div>
          )}
        </NeumorphicCard>
      </motion.div>

      {/* Civic Level Progress - Citizen Only */}
      {user.role === "citizen" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <NeumorphicCard className="p-6">
            <div className="flex justify-between items-end mb-2">
              <div>
                <div className="text-sm font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest mb-1">
                  Current Level
                </div>
                <div className="text-xl font-bold text-[var(--color-civic-text-primary)]">
                  {currentLevel}
                </div>
              </div>
              {nextLevel && (
                <div className="text-right">
                  <div className="text-sm font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest mb-1">
                    Next Level
                  </div>
                  <div className="text-xl font-bold text-[var(--color-civic-text-secondary)]">
                    {nextLevel.name}
                  </div>
                </div>
              )}
            </div>

            <div className="h-4 w-full bg-[var(--color-civic-surface-inset)] shadow-[var(--shadow-neumorphic-inset)] rounded-full overflow-hidden mt-4 relative">
              {nextLevel && (
                <div
                  className="h-full bg-gradient-to-r from-[var(--color-civic-primary)] to-[var(--color-civic-primary-soft)] transition-all duration-1000 ease-out rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0, progressToNextLevel))}%`,
                  }}
                />
              )}
            </div>

            {nextLevel && (
              <div className="mt-2 text-right text-xs font-bold text-[var(--color-civic-text-secondary)]">
                {civicScore} / {nextLevel.minScore} pts
              </div>
            )}
          </NeumorphicCard>
        </motion.div>
      )}

      {/* Impact Metrics - Contextual based on role */}
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-black text-[var(--color-civic-text-primary)] px-2 mt-8 mb-4 tracking-tight flex items-center gap-2"
      >
        <TrendingUp className="w-6 h-6 text-[var(--color-civic-primary)]" />
        {user.role === "citizen"
          ? "Civic Impact"
          : user.role === "department"
            ? "Department Performance"
            : "Platform Overview"}
      </motion.h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {user.role === "citizen" ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <NeumorphicCard className="p-6 flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 rounded-full bg-[var(--color-civic-primary)]/10 text-[var(--color-civic-primary)] flex items-center justify-center mb-3 shadow-[var(--shadow-neumorphic-inset)]">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="text-2xl font-black text-[var(--color-civic-text-primary)] mb-1">
                  {loading ? "-" : stats.issuesReported}
                </div>
                <div className="text-xs font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                  Reports Submitted
                </div>
              </NeumorphicCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <NeumorphicCard className="p-6 flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 rounded-full bg-[var(--color-civic-status-verified)]/10 text-[var(--color-civic-status-verified)] flex items-center justify-center mb-3 shadow-[var(--shadow-neumorphic-inset)]">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <div className="text-2xl font-black text-[var(--color-civic-text-primary)] mb-1">
                  {loading ? "-" : stats.issuesVerified}
                </div>
                <div className="text-xs font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                  Issues Verified
                </div>
              </NeumorphicCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <NeumorphicCard className="p-6 flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 rounded-full bg-[var(--color-civic-status-confirmed)]/10 text-[var(--color-civic-status-confirmed)] flex items-center justify-center mb-3 shadow-[var(--shadow-neumorphic-inset)]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="text-2xl font-black text-[var(--color-civic-text-primary)] mb-1">
                  {loading ? "-" : stats.successfulResolutions}
                </div>
                <div className="text-xs font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                  Successful Resolutions
                </div>
              </NeumorphicCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <NeumorphicCard className="p-6 flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 rounded-full bg-[var(--color-civic-priority-high)]/10 text-[var(--color-civic-priority-high)] flex items-center justify-center mb-3 shadow-[var(--shadow-neumorphic-inset)]">
                  <Users className="h-5 w-5" />
                </div>
                <div className="text-2xl font-black text-[var(--color-civic-text-primary)] mb-1">
                  {loading ? "-" : stats.estimatedCitizensImpacted}
                </div>
                <div className="text-xs font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                  Est. Citizens Impacted
                </div>
              </NeumorphicCard>
            </motion.div>
          </>
        ) : user.role === "department" ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <NeumorphicCard className="p-6 flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 rounded-full bg-[var(--color-civic-primary)]/10 text-[var(--color-civic-primary)] flex items-center justify-center mb-3 shadow-[var(--shadow-neumorphic-inset)]">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <div className="text-2xl font-black text-[var(--color-civic-text-primary)] mb-1">
                  124
                </div>
                <div className="text-xs font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                  Cases Completed
                </div>
              </NeumorphicCard>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <NeumorphicCard className="p-6 flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 rounded-full bg-[var(--color-civic-warning)]/10 text-[var(--color-civic-warning)] flex items-center justify-center mb-3 shadow-[var(--shadow-neumorphic-inset)]">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="text-2xl font-black text-[var(--color-civic-text-primary)] mb-1">
                  2.4 days
                </div>
                <div className="text-xs font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                  Avg Response Time
                </div>
              </NeumorphicCard>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <NeumorphicCard className="p-6 flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 rounded-full bg-[var(--color-civic-danger)]/10 text-[var(--color-civic-danger)] flex items-center justify-center mb-3 shadow-[var(--shadow-neumorphic-inset)]">
                  <Activity className="h-5 w-5" />
                </div>
                <div className="text-2xl font-black text-[var(--color-civic-text-primary)] mb-1">
                  32
                </div>
                <div className="text-xs font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                  Current Workload
                </div>
              </NeumorphicCard>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <NeumorphicCard className="p-6 flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 rounded-full bg-[var(--color-civic-success)]/10 text-[var(--color-civic-success)] flex items-center justify-center mb-3 shadow-[var(--shadow-neumorphic-inset)]">
                  <Star className="h-5 w-5" />
                </div>
                <div className="text-2xl font-black text-[var(--color-civic-text-primary)] mb-1">
                  94%
                </div>
                <div className="text-xs font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                  Citizen Satisfaction
                </div>
              </NeumorphicCard>
            </motion.div>
          </>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <NeumorphicCard className="p-6 flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 rounded-full bg-[var(--color-civic-primary)]/10 text-[var(--color-civic-primary)] flex items-center justify-center mb-3 shadow-[var(--shadow-neumorphic-inset)]">
                  <Users className="h-5 w-5" />
                </div>
                <div className="text-2xl font-black text-[var(--color-civic-text-primary)] mb-1">
                  8
                </div>
                <div className="text-xs font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                  {user.role === "super_admin"
                    ? "Admins Managed"
                    : "Departments"}
                </div>
              </NeumorphicCard>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <NeumorphicCard className="p-6 flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 rounded-full bg-[var(--color-civic-status-confirmed)]/10 text-[var(--color-civic-status-confirmed)] flex items-center justify-center mb-3 shadow-[var(--shadow-neumorphic-inset)]">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <div className="text-2xl font-black text-[var(--color-civic-text-primary)] mb-1">
                  2,400+
                </div>
                <div className="text-xs font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                  Platform KPIs
                </div>
              </NeumorphicCard>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <NeumorphicCard className="p-6 flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 rounded-full bg-[var(--color-civic-warning)]/10 text-[var(--color-civic-warning)] flex items-center justify-center mb-3 shadow-[var(--shadow-neumorphic-inset)]">
                  <Target className="h-5 w-5" />
                </div>
                <div className="text-2xl font-black text-[var(--color-civic-text-primary)] mb-1">
                  12
                </div>
                <div className="text-xs font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                  Escalations
                </div>
              </NeumorphicCard>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <NeumorphicCard className="p-6 flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 rounded-full bg-[var(--color-civic-success)]/10 text-[var(--color-civic-success)] flex items-center justify-center mb-3 shadow-[var(--shadow-neumorphic-inset)]">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="text-2xl font-black text-[var(--color-civic-text-primary)] mb-1">
                  Healthy
                </div>
                <div className="text-xs font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                  Audit Status
                </div>
              </NeumorphicCard>
            </motion.div>
          </>
        )}
      </div>

      {/* Account & Notification Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.52 }}
      >
        <NeumorphicCard className="p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-[var(--color-civic-border)]/60 pb-4">
            <Settings className="w-6 h-6 text-[var(--color-civic-primary)]" />
            <h2 className="text-xl font-extrabold text-[var(--color-civic-text-primary)] tracking-tight">
              Account & Notification Settings
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Phone Input */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-[var(--color-civic-text-secondary)] flex items-center gap-2">
                <Phone className="w-4 h-4 text-[var(--color-civic-text-muted)]" />
                Phone Number (Optional)
              </label>
              <NeumorphicInput
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-[var(--color-civic-text-muted)] leading-normal font-medium">
                Used for urgent SMS notifications regarding your reported or verified issues.
              </p>
            </div>

            {/* Notification Toggles */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-[var(--color-civic-text-secondary)] flex items-center gap-2">
                <Bell className="w-4 h-4 text-[var(--color-civic-text-muted)]" />
                Delivery Channels
              </label>

              <div className="space-y-3">
                {/* Email Checkbox */}
                <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-civic-surface-inset)] shadow-[var(--shadow-neumorphic-inset)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={emailNotif}
                    onChange={(e) => setEmailNotif(e.target.checked)}
                    className="h-4 w-4 rounded text-[var(--color-civic-primary)] focus:ring-[var(--color-civic-primary)]/40 border-[var(--color-civic-border)]"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[var(--color-civic-text-primary)] flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[var(--color-civic-text-muted)]" />
                      Email Notifications
                    </span>
                    <span className="text-[10px] text-[var(--color-civic-text-muted)] font-medium">
                      Receive summaries, status updates, and reports via Email.
                    </span>
                  </div>
                </label>

                {/* SMS Checkbox */}
                <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-civic-surface-inset)] shadow-[var(--shadow-neumorphic-inset)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={smsNotif}
                    onChange={(e) => setSmsNotif(e.target.checked)}
                    className="h-4 w-4 rounded text-[var(--color-civic-primary)] focus:ring-[var(--color-civic-primary)]/40 border-[var(--color-civic-border)] animate-none"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[var(--color-civic-text-primary)] flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[var(--color-civic-text-muted)]" />
                      SMS Notifications (Requires Phone)
                    </span>
                    <span className="text-[10px] text-[var(--color-civic-text-muted)] font-medium">
                      Opt-in to get real-time SMS updates for high-priority items.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-[var(--color-civic-border)]/40">
            <NeumorphicButton
              variant="primary"
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving Changes..." : "Save Settings"}
            </NeumorphicButton>
          </div>
        </NeumorphicCard>
      </motion.div>

      {/* Daily Briefing / AI Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="mt-12 h-[450px]"
      >
        <AIBriefingWidget />
      </motion.div>

      {/* Role Request CTA - Only for Citizens */}
      {user.role === "citizen" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.58 }}
          className="mt-12"
        >
          <NeumorphicCard className="p-8 border-l-4 border-[var(--color-civic-primary)] flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-black text-[var(--color-civic-text-primary)] mb-2">
                Want to do more for your community?
              </h3>
              <p className="text-[var(--color-civic-text-secondary)] font-medium">
                Apply for official access to manage and resolve civic issues.
              </p>
            </div>
            <Link to="/apply-for-role">
              <NeumorphicButton variant="primary">
                Apply to manage a department
              </NeumorphicButton>
            </Link>
          </NeumorphicCard>
        </motion.div>
      )}

      {/* Badges Section - Only for Citizens */}
      {user.role === "citizen" && (
        <>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="text-2xl font-black text-[var(--color-civic-text-primary)] px-2 mt-12 mb-4 tracking-tight flex items-center gap-2"
          >
            <Award className="w-6 h-6 text-[var(--color-civic-primary)]" />
            Achievements
          </motion.h2>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {loading ? (
              <div className="col-span-full text-center py-8 text-[var(--color-civic-text-secondary)] font-medium animate-pulse">
                Loading achievements...
              </div>
            ) : (
              <>
                {achievements.map((badge, i) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.05 }}
                  >
                    <NeumorphicCard className="p-5 text-center flex flex-col items-center justify-center gap-3 h-full group hover:bg-[var(--color-civic-surface-inset)] transition-colors">
                      <div className="p-4 bg-[var(--color-civic-surface-inset)] group-hover:bg-[var(--color-civic-surface)] rounded-full shadow-[var(--shadow-neumorphic-inset)] group-hover:shadow-[var(--shadow-neumorphic)] text-[var(--color-civic-priority-medium)] relative transition-all duration-300">
                        <Award className="h-6 w-6 relative z-10 drop-shadow-sm" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[var(--color-civic-text-primary)] text-sm mb-1">
                          {badge.name}
                        </h4>
                        <p className="text-[10px] text-[var(--color-civic-text-muted)] leading-tight">
                          {badge.description}
                        </p>
                      </div>
                    </NeumorphicCard>
                  </motion.div>
                ))}
                {achievements.length === 0 && (
                  <div className="col-span-full py-12 text-center text-[var(--color-civic-text-secondary)] font-medium bg-[var(--color-civic-surface-inset)] rounded-2xl shadow-[var(--shadow-neumorphic-inset)]">
                    No achievements unlocked yet. Start reporting or verifying
                    issues!
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
