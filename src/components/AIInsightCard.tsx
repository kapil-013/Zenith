import React from "react";
import { NeumorphicCard, NeumorphicCardInset } from "./ui/card";
import { NeumorphicBadge } from "./ui/badge";
import { BrainCircuit, MapPin, ArrowRight, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";

export interface InsightData {
  headline: string;
  summary: string;
  hotspots: string[];
  recommendedActions: string[];
  riskLevel: "Low" | "Medium" | "High";
}

export function AIInsightCard({
  insight,
  loading,
}: {
  insight: InsightData | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <NeumorphicCard className="p-6 h-full flex flex-col justify-center items-center relative overflow-hidden min-h-[300px]">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <BrainCircuit className="h-32 w-32" />
        </div>
        <div className="animate-pulse flex flex-col items-center">
          <BrainCircuit className="h-10 w-10 text-[var(--color-civic-admin)] mb-4 animate-bounce" />
          <p className="text-[var(--color-civic-text-secondary)] font-bold">
            CivicVision AI is analyzing data...
          </p>
        </div>
      </NeumorphicCard>
    );
  }

  if (!insight) return null;

  return (
    <NeumorphicCard className="p-6 h-full flex flex-col relative overflow-hidden group border-t-4 border-t-[var(--color-civic-admin)]">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-civic-admin-soft)] rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:opacity-80 transition-opacity duration-700 opacity-40" />

      <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
        <BrainCircuit className="h-24 w-24 text-[var(--color-civic-admin)]" />
      </div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="font-extrabold text-lg text-[var(--color-civic-text-primary)] flex items-center gap-2 tracking-tight">
          <div className="p-1.5 bg-[var(--color-civic-admin-soft)] rounded-lg text-[var(--color-civic-admin)] shadow-[var(--shadow-neumorphic-inset)] border border-transparent">
            <BrainCircuit className="h-4 w-4" />
          </div>
          CivicVision AI Insight
        </h3>
        <NeumorphicBadge
          variant={
            insight.riskLevel === "High"
              ? "danger"
              : insight.riskLevel === "Medium"
                ? "warning"
                : "info"
          }
        >
          {insight.riskLevel} Risk
        </NeumorphicBadge>
      </div>

      <NeumorphicCardInset className="p-5 mb-5 relative z-10 flex-grow border-transparent">
        <h4 className="font-bold text-[var(--color-civic-text-primary)] text-lg mb-2 leading-tight">
          {insight.headline}
        </h4>
        <p className="text-[var(--color-civic-text-secondary)] font-medium text-sm leading-relaxed mb-4">
          {insight.summary}
        </p>

        {insight.hotspots && insight.hotspots.length > 0 && (
          <div className="mb-4">
            <h5 className="text-xs font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest mb-2 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Priority Hotspots
            </h5>
            <div className="flex flex-wrap gap-2">
              {insight.hotspots.map((h, i) => (
                <span
                  key={i}
                  className="text-xs font-bold px-2 py-1 bg-[var(--color-civic-danger)]/10 text-[var(--color-civic-danger)] rounded-md border border-[var(--color-civic-danger)]/20 shadow-sm"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}

        {insight.recommendedActions &&
          insight.recommendedActions.length > 0 && (
            <div>
              <h5 className="text-xs font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest mb-2 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" /> Recommended Actions
              </h5>
              <ul className="space-y-1.5">
                {insight.recommendedActions.slice(0, 2).map((a, i) => (
                  <li
                    key={i}
                    className="text-sm text-[var(--color-civic-text-primary)] font-medium flex items-start gap-2"
                  >
                    <ArrowRight className="h-4 w-4 text-[var(--color-civic-admin)] shrink-0 mt-0.5" />
                    <span className="leading-snug">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
      </NeumorphicCardInset>
    </NeumorphicCard>
  );
}
