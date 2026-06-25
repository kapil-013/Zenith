import React from "react";
import { Link } from "react-router-dom";
import { NeumorphicCard, NeumorphicCardInset } from "../components/ui/card";
import { NeumorphicButton } from "../components/ui/button";
import {
  ShieldAlert,
  Users,
  TrendingUp,
  Map as MapIcon,
  ArrowRight,
  Activity,
  AlertTriangle,
  PlusCircle,
} from "lucide-react";
import { NeumorphicBadge } from "../components/ui/badge";
import { motion } from "motion/react";

export function Home() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center min-h-[85vh] py-12"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full max-w-6xl mb-24">
        {/* Left Side: Text and CTAs */}
        <div className="space-y-6 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <NeumorphicBadge variant="primary" className="mb-2 uppercase tracking-widest text-[10px]">
              <SparklesIcon className="w-3 h-3 mr-1 inline" /> AI-powered civic accountability
            </NeumorphicBadge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[var(--color-civic-text-primary)] tracking-tight leading-tight"
          >
            Turn local problems into{" "}
            <span className="text-[var(--color-civic-primary)]">community action.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-[var(--color-civic-text-secondary)] max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium"
          >
            Report issues with evidence, let Gemini prioritize them, and track transparent resolution with your community.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs font-bold text-[var(--color-civic-text-muted)] mb-8 uppercase tracking-widest"
          >
            <span className="text-[var(--color-civic-primary)]">Report</span>
            <ArrowRight className="h-3 w-3" />
            <span className="text-[var(--color-civic-admin)]">AI Review</span>
            <ArrowRight className="h-3 w-3" />
            <span className="text-[var(--color-civic-primary)]">Verify</span>
            <ArrowRight className="h-3 w-3" />
            <span className="text-[var(--color-civic-department)]">Action</span>
            <ArrowRight className="h-3 w-3" />
            <span className="text-[var(--color-civic-status-confirmed)]">Impact</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4"
          >
            <Link to="/report">
              <NeumorphicButton
                size="lg"
                variant="primary"
                className="gap-2 w-full sm:w-auto"
              >
                <PlusCircle className="h-5 w-5" />
                Report an Issue
              </NeumorphicButton>
            </Link>
            <Link to="/issues">
              <NeumorphicButton
                size="lg"
                variant="secondary"
                className="gap-2 w-full sm:w-auto"
              >
                <MapIcon className="h-5 w-5 text-[var(--color-civic-primary)]" />
                Explore Live Map
              </NeumorphicButton>
            </Link>
          </motion.div>
        </div>

        {/* Right Side: Hero Mock Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-md mx-auto lg:ml-auto"
        >
          <NeumorphicCard className="p-8 relative overflow-hidden transform hover:-translate-y-2 transition-all duration-500 border-l-4 border-l-[var(--color-civic-danger)]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--color-civic-danger)] rounded-full blur-3xl -mr-20 -mt-20 opacity-10 pointer-events-none"></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <h3 className="font-bold text-xl text-[var(--color-civic-text-primary)]">
                  Dangerous Pothole
                </h3>
                <p className="text-sm text-[var(--color-civic-text-secondary)] font-medium mt-1">
                  Main Street, Sector 4
                </p>
              </div>
              <NeumorphicBadge variant="danger" className="text-xs px-3 py-1 shadow-md">
                Urgent
              </NeumorphicBadge>
            </div>

            <div className="space-y-4 relative z-10">
              <NeumorphicCardInset className="flex items-center gap-4 text-sm text-[var(--color-civic-text-primary)] p-3 rounded-xl border-transparent">
                <AlertTriangle className="h-5 w-5 text-[var(--color-cat-pothole)]" />
                <span className="font-medium">
                  Category: <span className="font-bold">Pothole</span>
                </span>
              </NeumorphicCardInset>
              <NeumorphicCardInset className="flex items-center gap-4 text-sm text-[var(--color-civic-text-primary)] p-3 rounded-xl border-transparent">
                <Users className="h-5 w-5 text-[var(--color-civic-primary)]" />
                <span className="font-medium">
                  <span className="font-bold text-[var(--color-civic-primary)]">18 citizens</span>{" "}
                  verified
                </span>
              </NeumorphicCardInset>
              <NeumorphicCardInset className="flex items-center gap-4 text-sm text-[var(--color-civic-text-primary)] p-3 rounded-xl border-transparent">
                <Activity className="h-5 w-5 text-[var(--color-civic-department)]" />
                <span className="font-medium">
                  Status:{" "}
                  <span className="font-bold text-[var(--color-civic-department)]">In Progress</span>
                </span>
              </NeumorphicCardInset>
              <NeumorphicCardInset className="flex items-center gap-4 text-sm text-[var(--color-civic-text-primary)] p-3 rounded-xl border-transparent">
                <ShieldAlert className="h-5 w-5 text-[var(--color-civic-admin)]" />
                <span className="font-medium">
                  Assigned to <span className="font-bold">Road Maintenance</span>
                </span>
              </NeumorphicCardInset>
            </div>

            <div className="mt-8 flex items-center justify-between pt-6 border-t border-[var(--color-civic-border)]/60 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[var(--color-civic-surface-inset)] shadow-[var(--shadow-neumorphic-inset)] flex items-center justify-center border border-[var(--color-civic-danger)]/20">
                  <span className="text-xl font-black text-[var(--color-civic-danger)]">87</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-[var(--color-civic-text-muted)] uppercase font-bold tracking-widest">
                    Priority Score
                  </span>
                  <span className="text-sm font-bold text-[var(--color-civic-text-primary)]">
                    Critical Severity
                  </span>
                </div>
              </div>
            </div>
          </NeumorphicCard>
        </motion.div>
      </div>

      {/* Feature Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <FeatureCard
            icon={ShieldAlert}
            color="text-[var(--color-civic-admin)]"
            title="AI Issue Detection"
            description="Upload a photo and let our Gemini-powered AI analyze severity, category, and department."
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <FeatureCard
            icon={Users}
            color="text-[var(--color-civic-primary)]"
            title="Community Verification"
            description="Citizens verify local problems to ensure authentic reporting and prevent spam."
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <FeatureCard
            icon={Activity}
            color="text-[var(--color-civic-department)]"
            title="Transparent Tracking"
            description="Track the exact status of your reports from Open to Confirmed Resolved."
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <FeatureCard
            icon={TrendingUp}
            color="text-[var(--color-civic-status-confirmed)]"
            title="Civic Impact Dashboard"
            description="See insights on local problem hotspots and department resolution times."
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: any;
  title: string;
  description: string;
  color?: string;
}) {
  return (
    <NeumorphicCard className="p-6 flex flex-col items-start gap-4 h-full hover:-translate-y-1 transition-transform">
      <div className="p-3 bg-[var(--color-civic-surface-inset)] rounded-xl shadow-[var(--shadow-neumorphic-inset)] border border-transparent">
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <h3 className="font-bold text-lg text-[var(--color-civic-text-primary)]">{title}</h3>
      <p className="text-sm text-[var(--color-civic-text-secondary)] font-medium leading-relaxed">{description}</p>
    </NeumorphicCard>
  );
}
