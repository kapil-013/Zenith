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
        <NeumorphicCard className="p-8 flex flex-col md:flex-row items-center gap-8 text-center md:text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

          <div className="h-32 w-32 rounded-full bg-[#e9eef5] shadow-[inset_6px_6px_12px_#b8bec5,inset_-6px_-6px_12px_#ffffff] p-2 flex-shrink-0 relative z-10 border-4 border-white/40">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center text-3xl font-bold text-slate-500 shadow-inner">
                {user.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 relative z-10">
            <h1 className="text-3xl font-black text-slate-800 mb-1">
              {user.name}
            </h1>
            <p className="text-slate-500 font-medium mb-6">{user.email}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="py-2 px-5 flex gap-2 shadow-[inset_2px_2px_4px_#b8bec5,inset_-2px_-2px_4px_#ffffff] bg-[#e9eef5] rounded-full items-center">
                <Star className="h-4 w-4 text-amber-500" />{" "}
                <span className="font-bold text-slate-700">
                  {loading ? "..." : stats.points}
                </span>{" "}
                <span className="text-sm font-medium text-slate-500">
                  Contribution Points
                </span>
              </div>
              <div className="py-2 px-5 flex gap-2 shadow-[4px_4px_8px_#b8bec5,-4px_-4px_8px_#ffffff] bg-[#e9eef5] rounded-full items-center text-sm font-medium text-slate-500">
                Role:{" "}
                <span className="font-bold text-slate-700">{user.role}</span>
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
            <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-4 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)]">
              <FileText className="h-6 w-6" />
            </div>
            <div className="text-3xl font-black text-slate-800 mb-1">
              {loading ? "-" : stats.reportsSubmitted}
            </div>
            <div className="text-sm font-medium text-slate-500">
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
            <div className="h-12 w-12 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-4 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)]">
              <CheckSquare className="h-6 w-6" />
            </div>
            <div className="text-3xl font-black text-slate-800 mb-1">
              {loading ? "-" : stats.issuesVerified}
            </div>
            <div className="text-sm font-medium text-slate-500">
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
            <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mb-4 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="text-3xl font-black text-slate-800 mb-1">
              {loading ? "-" : stats.resolvedImpact}
            </div>
            <div className="text-sm font-medium text-slate-500">
              Resolved Impact
            </div>
          </NeumorphicCard>
        </motion.div>
      </div>

      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-bold text-slate-800 px-2 mt-12 mb-6"
      >
        Civic Badges
      </motion.h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8 text-slate-500 font-medium animate-pulse">
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
                  <div className="p-4 bg-[#e9eef5] rounded-full shadow-[inset_3px_3px_6px_#b8bec5,inset_-3px_-3px_6px_#ffffff] text-amber-500 relative">
                    <div className="absolute inset-0 bg-amber-400/20 rounded-full animate-pulse" />
                    <Award className="h-8 w-8 relative z-10 drop-shadow-sm" />
                  </div>
                  <h4 className="font-bold text-slate-700 text-sm">{badge}</h4>
                </NeumorphicCard>
              </motion.div>
            ))}
            {stats.badges.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 italic bg-white/40 rounded-2xl border border-white/60">
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
