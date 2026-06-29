import React, { useState, useEffect } from "react";
import { NeumorphicCard } from "../card";
import {
  Sparkles,
  Activity,
  AlertTriangle,
  TrendingUp,
  Users,
  ShieldAlert,
  CheckCircle,
  BrainCircuit,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { CivicIntelligence } from "../../../lib/ai/intelligence";
import { AIInsight, Issue, Verification } from "../../../types";
import { motion, AnimatePresence } from "motion/react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";

export function AIBriefingWidget() {
  const { role, user } = useAuth();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"briefing" | "recommendations">(
    "briefing",
  );

  useEffect(() => {
    async function fetchInsights() {
      if (!user) return;

      try {
        setLoading(true);
        const issuesQuery = query(collection(db, "issues"));
        const iDocs = await getDocs(issuesQuery);
        const issues = iDocs.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Issue,
        );

        const vQuery = query(collection(db, "verifications"));
        const vDocs = await getDocs(vQuery);
        const verifications = vDocs.docs.map((d) => d.data() as Verification);

        const contextData = CivicIntelligence.buildContext(
          role,
          issues,
          verifications,
        );
        const generatedInsights = await CivicIntelligence.generateInsights(
          role,
          contextData,
        );
        setInsights(generatedInsights);
      } catch (error) {
        console.error("Failed to load insights", error);
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, [role, user]);

  const getIcon = (type: string) => {
    switch (type) {
      case "operational":
        return <Activity className="w-5 h-5 text-blue-500" />;
      case "risk":
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case "recommendation":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "prediction":
        return <BrainCircuit className="w-5 h-5 text-purple-500" />;
      case "trend":
        return <TrendingUp className="w-5 h-5 text-indigo-500" />;
      case "anomaly":
        return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case "community":
        return <Users className="w-5 h-5 text-teal-500" />;
      default:
        return (
          <Sparkles className="w-5 h-5 text-[var(--color-civic-primary)]" />
        );
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "text-red-600 bg-red-100";
      case "High":
        return "text-orange-600 bg-orange-100";
      case "Medium":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-slate-600 bg-slate-100";
    }
  };

  const getTitle = () => {
    switch (role) {
      case "super_admin":
        return "Platform Intelligence Report";
      case "admin":
        return "Morning Operations Brief";
      case "department":
        return "Today's Work Summary";
      default:
        return "Weekly Community Impact";
    }
  };

  if (loading) {
    return (
      <NeumorphicCard className="p-6 h-full flex flex-col items-center justify-center min-h-[300px]">
        <div className="relative">
          <div className="absolute inset-0 bg-[var(--color-civic-primary)]/20 rounded-full blur-xl animate-pulse" />
          <BrainCircuit className="w-10 h-10 text-[var(--color-civic-primary)] animate-bounce relative z-10" />
        </div>
        <p className="mt-4 text-[var(--color-civic-text-secondary)] font-bold text-sm uppercase tracking-widest animate-pulse">
          CivicVision Synthesizing Context...
        </p>
      </NeumorphicCard>
    );
  }

  if (insights.length === 0) return null;

  return (
    <NeumorphicCard className="p-0 overflow-hidden flex flex-col h-full border-t-4 border-[var(--color-civic-primary)]">
      <div className="p-5 bg-[var(--color-civic-surface)] border-b border-[var(--color-civic-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[var(--color-civic-primary-soft)] rounded-full shadow-[var(--shadow-neumorphic-inset)]">
            <Sparkles className="w-5 h-5 text-[var(--color-civic-primary)]" />
          </div>
          <h2 className="text-lg font-black text-[var(--color-civic-text-primary)]">
            {getTitle()}
          </h2>
        </div>
        <div className="flex bg-[var(--color-civic-surface-inset)] rounded-full p-1 shadow-[var(--shadow-neumorphic-inset)]">
          <button
            onClick={() => setActiveTab("briefing")}
            className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
              activeTab === "briefing"
                ? "bg-[var(--color-civic-surface)] shadow-[var(--shadow-neumorphic)] text-[var(--color-civic-text-primary)]"
                : "text-[var(--color-civic-text-muted)] hover:text-[var(--color-civic-text-secondary)]"
            }`}
          >
            Insights
          </button>
          <button
            onClick={() => setActiveTab("recommendations")}
            className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
              activeTab === "recommendations"
                ? "bg-[var(--color-civic-surface)] shadow-[var(--shadow-neumorphic)] text-[var(--color-civic-text-primary)]"
                : "text-[var(--color-civic-text-muted)] hover:text-[var(--color-civic-text-secondary)]"
            }`}
          >
            Actions
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 overflow-y-auto max-h-[400px] space-y-4">
        <AnimatePresence mode="popLayout">
          {insights
            .filter((i) =>
              activeTab === "briefing"
                ? i.type !== "recommendation"
                : i.type === "recommendation" || i.suggestedAction,
            )
            .map((insight, idx) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 rounded-2xl bg-[var(--color-civic-surface-inset)] shadow-[var(--shadow-neumorphic-inset)] relative overflow-hidden group"
              >
                <div className="flex gap-3 relative z-10">
                  <div className="mt-1">{getIcon(insight.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-[var(--color-civic-text-primary)] text-sm">
                        {insight.title}
                      </h3>
                      {insight.priority !== "Low" && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPriorityColor(insight.priority)}`}
                        >
                          {insight.priority}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-civic-text-secondary)] leading-relaxed font-medium">
                      {insight.summary}
                    </p>

                    <div className="mt-2 text-[11px] text-[var(--color-civic-text-muted)] border-t border-[var(--color-civic-border)] pt-2 hidden group-hover:block transition-all">
                      <span className="font-bold text-[var(--color-civic-text-secondary)]">
                        AI Reasoning:{" "}
                      </span>
                      {insight.detailedReasoning}
                    </div>

                    {activeTab === "recommendations" &&
                      insight.suggestedAction && (
                        <div className="mt-3 p-2 bg-[var(--color-civic-surface)] rounded-lg shadow-[var(--shadow-neumorphic)] flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="text-xs font-bold text-[var(--color-civic-text-primary)]">
                            {insight.suggestedAction}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              </motion.div>
            ))}
          {insights.filter((i) =>
            activeTab === "briefing"
              ? i.type !== "recommendation"
              : i.type === "recommendation" || i.suggestedAction,
          ).length === 0 && (
            <div className="text-center py-8 text-[var(--color-civic-text-muted)] font-medium text-sm">
              No new {activeTab} at this time.
            </div>
          )}
        </AnimatePresence>
      </div>
    </NeumorphicCard>
  );
}
