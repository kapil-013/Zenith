import React from "react";
import { useAuth } from "../context/AuthContext";
import { NeumorphicCard } from "../components/ui/card";
import { NeumorphicBadge } from "../components/ui/badge";
import {
  Award,
  Star,
  Activity,
  CheckCircle2,
  FileText,
  CheckSquare,
  ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { useUserStats } from "../hooks/useUserStats";

export function Profile() {
  const { user } = useAuth();
  const { stats, loading } = useUserStats();

  if (!user)
    return (
      <div className="p-12 text-center text-slate-500 font-medium">
        Please sign in to view your profile.
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <NeumorphicCard className="p-8 flex flex-col md:flex-row items-center gap-8 text-center md:text-left relative overflow-hidden border-t-4 border-[var(--color-civic-primary)]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-civic-primary-soft)] rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none opacity-50" />

          <div className="h-32 w-32 rounded-full bg-[var(--color-civic-surface-inset)] shadow-[var(--shadow-neumorphic-inset)] p-2 flex-shrink-0 relative z-10 border border-transparent">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[var(--color-civic-surface)] flex items-center justify-center text-3xl font-extrabold text-[var(--color-civic-primary)] shadow-[var(--shadow-neumorphic)]">
                {user.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 relative z-10">
            <h1 className="text-3xl font-extrabold text-[var(--color-civic-text-primary)] mb-1 tracking-tight">
              {user.name}
            </h1>
            <p className="text-[var(--color-civic-text-secondary)] font-medium mb-6">{user.email}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="py-2 px-5 flex gap-2 shadow-[var(--shadow-neumorphic-inset)] bg-[var(--color-civic-surface-inset)] rounded-full items-center">
                <Star className="h-4 w-4 text-[var(--color-civic-priority-medium)]" />{" "}
                <span className="font-bold text-[var(--color-civic-text-primary)]">
                  {loading ? "..." : stats.points}
                </span>{" "}
                <span className="text-sm font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                  Contribution Points
                </span>
              </div>
              <div className="py-2 px-5 flex gap-2 shadow-[var(--shadow-neumorphic-inset)] bg-[var(--color-civic-surface-inset)] rounded-full items-center text-sm font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                Role:{" "}
                <span className="font-bold text-[var(--color-civic-text-primary)]">{user.role}</span>
              </div>
            </div>
          </div>
        </NeumorphicCard>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <NeumorphicCard className="p-6 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-[var(--color-civic-primary-soft)] text-[var(--color-civic-primary)] flex items-center justify-center mb-4 shadow-[var(--shadow-neumorphic-inset)] border border-transparent">
              <FileText className="h-6 w-6" />
            </div>
            <div className="text-3xl font-extrabold text-[var(--color-civic-text-primary)] mb-1">
              {loading ? "-" : stats.reportsSubmitted}
            </div>
            <div className="text-sm font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
              Reports Submitted
            </div>
          </NeumorphicCard>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <NeumorphicCard className="p-6 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-[var(--color-civic-status-confirmed)]/10 text-[var(--color-civic-status-confirmed)] flex items-center justify-center mb-4 shadow-[var(--shadow-neumorphic-inset)] border border-transparent">
              <CheckSquare className="h-6 w-6" />
            </div>
            <div className="text-3xl font-extrabold text-[var(--color-civic-text-primary)] mb-1">
              {loading ? "-" : stats.issuesVerified}
            </div>
            <div className="text-sm font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
              Issues Verified
            </div>
          </NeumorphicCard>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <NeumorphicCard className="p-6 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-[var(--color-civic-admin)]/10 text-[var(--color-civic-admin)] flex items-center justify-center mb-4 shadow-[var(--shadow-neumorphic-inset)] border border-transparent">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="text-3xl font-extrabold text-[var(--color-civic-text-primary)] mb-1">
              {loading ? "-" : stats.resolvedImpact}
            </div>
            <div className="text-sm font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
              Resolved Impact
            </div>
          </NeumorphicCard>
        </motion.div>
      </div>

      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-extrabold text-[var(--color-civic-text-primary)] px-2 mt-12 mb-6 tracking-tight"
      >
        Civic Badges
      </motion.h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8 text-[var(--color-civic-text-secondary)] font-medium animate-pulse">
            Loading badges...
          </div>
        ) : (
          <>
            {stats.badges.map((badge, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
              >
                <NeumorphicCard className="p-6 text-center flex flex-col items-center justify-center gap-4 h-full hover:-translate-y-2 transition-transform duration-300">
                  <div className="p-4 bg-[var(--color-civic-surface-inset)] rounded-full shadow-[var(--shadow-neumorphic-inset)] text-[var(--color-civic-priority-medium)] relative">
                    <div className="absolute inset-0 bg-[var(--color-civic-priority-medium)]/10 rounded-full animate-pulse" />
                    <Award className="h-8 w-8 relative z-10 drop-shadow-sm" />
                  </div>
                  <h4 className="font-bold text-[var(--color-civic-text-primary)] text-sm">{badge}</h4>
                </NeumorphicCard>
              </motion.div>
            ))}
            {stats.badges.length === 0 && (
              <div className="col-span-full py-12 text-center text-[var(--color-civic-text-secondary)] font-medium bg-[var(--color-civic-surface-inset)] rounded-2xl shadow-[var(--shadow-neumorphic-inset)]">
                No badges earned yet. Start verifying issues to earn
                recognition!
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
