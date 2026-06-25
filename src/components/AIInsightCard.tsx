import React from "react";
import { NeumorphicCard } from "./ui/card";
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
          <BrainCircuit className="h-10 w-10 text-blue-400 mb-4 animate-bounce" />
          <p className="text-slate-500 font-medium">
            CivicVision AI is analyzing data...
          </p>
        </div>
      </NeumorphicCard>
    );
  }

  if (!insight) return null;

  return (
    <NeumorphicCard className="p-6 h-full flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-blue-200/50 transition-colors duration-700" />

      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
        <BrainCircuit className="h-24 w-24" />
      </div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600 shadow-[inset_1px_1px_2px_#ffffff,inset_-1px_-1px_2px_#b8bec5]">
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
          className="shadow-sm"
        >
          {insight.riskLevel} Risk
        </NeumorphicBadge>
      </div>

      <div className="bg-white/40 p-5 rounded-2xl shadow-[inset_2px_2px_5px_rgba(0,0,0,0.02)] border border-white/60 mb-5 relative z-10 flex-grow">
        <h4 className="font-bold text-slate-800 text-lg mb-2 leading-tight">
          {insight.headline}
        </h4>
        <p className="text-slate-600 text-sm leading-relaxed mb-4">
          {insight.summary}
        </p>

        {insight.hotspots && insight.hotspots.length > 0 && (
          <div className="mb-4">
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Priority Hotspots
            </h5>
            <div className="flex flex-wrap gap-2">
              {insight.hotspots.map((h, i) => (
                <span
                  key={i}
                  className="text-xs font-medium px-2 py-1 bg-red-50 text-red-700 rounded-md border border-red-100"
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
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" /> Recommended Actions
              </h5>
              <ul className="space-y-1.5">
                {insight.recommendedActions.slice(0, 2).map((a, i) => (
                  <li
                    key={i}
                    className="text-sm text-slate-700 flex items-start gap-2"
                  >
                    <ArrowRight className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <span className="leading-snug">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
      </div>
    </NeumorphicCard>
  );
}
