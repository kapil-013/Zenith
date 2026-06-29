import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  MapPin,
  CheckCircle,
} from "lucide-react";
import { NeumorphicBadge } from "../components/ui/badge";
import { motion } from "motion/react";
import { collection, query, orderBy, getDocs, where } from "firebase/firestore";
import { db } from "../lib/firebase";

export function Home() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<{
    totalIssues: number;
    resolvedIssues: number;
    activeCitizens: number;
    latestIssue: any | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const issuesQuery = query(collection(db, "issues"), orderBy("createdAt", "desc"));
        const issuesSnap = await getDocs(issuesQuery);
        
        let totalIssues = issuesSnap.size;
        let resolvedIssues = 0;
        let latestIssue = null;
        
        if (!issuesSnap.empty) {
          const firstDoc = issuesSnap.docs[0];
          latestIssue = { id: firstDoc.id, ...firstDoc.data() };
          
          issuesSnap.forEach((doc) => {
            const data = doc.data();
            const status = data.currentStatus || data.status;
            if (status === "Resolved" || status === "Confirmed") {
              resolvedIssues++;
            }
          });
        }
        
        const usersQuery = query(collection(db, "users"), where("role", "==", "citizen"));
        const usersSnap = await getDocs(usersQuery);
        const activeCitizens = usersSnap.size;
        
        setStats({
          totalIssues,
          resolvedIssues,
          activeCitizens,
          latestIssue,
        });
      } catch (error) {
        console.error("Error fetching homepage stats:", error);
        setStats({
          totalIssues: 0,
          resolvedIssues: 0,
          activeCitizens: 0,
          latestIssue: null,
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
  }, []);

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
              <SparklesIcon className="w-3 h-3 mr-1 inline" /> {t("HomeHeroTag")}
            </NeumorphicBadge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[var(--color-civic-text-primary)] tracking-tight leading-tight"
          >
            {t("HomeHeadlinePart1")}{" "}
            <span className="text-[var(--color-civic-primary)]">{t("HomeHeadlinePart2")}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-[var(--color-civic-text-secondary)] max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium"
          >
            {t("HomeSubheadline")}
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
                {t("HomeCTA_Report")}
              </NeumorphicButton>
            </Link>
            <Link to="/issues">
              <NeumorphicButton
                size="lg"
                variant="secondary"
                className="gap-2 w-full sm:w-auto"
              >
                <MapIcon className="h-5 w-5 text-[var(--color-civic-primary)]" />
                {t("HomeCTA_Explore")}
              </NeumorphicButton>
            </Link>
          </motion.div>
        </div>

        {/* Right Side: Live Stats Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-md mx-auto lg:ml-auto"
        >
          {loading ? (
            <NeumorphicCard className="p-8 animate-pulse">
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-[var(--color-civic-surface-inset)]/40 rounded-xl"></div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-[var(--color-civic-border)]/60">
                <div className="h-4 w-24 bg-[var(--color-civic-surface-inset)]/40 rounded mb-3"></div>
                <div className="h-16 bg-[var(--color-civic-surface-inset)]/40 rounded-xl"></div>
              </div>
            </NeumorphicCard>
          ) : (
            <NeumorphicCard className="p-8 relative overflow-hidden transform hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-[var(--color-civic-primary)]">
              <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                {/* Issues Reported */}
                <NeumorphicCardInset className="p-4 flex flex-col justify-between rounded-xl border-transparent">
                  <div className="flex justify-between items-start">
                    <MapPin className="h-5 w-5 text-[var(--color-civic-primary)]" />
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl md:text-3xl font-extrabold text-[var(--color-civic-text-primary)] leading-none mb-1">
                      {stats?.totalIssues ?? 0}
                    </div>
                    <div className="text-[10px] text-[var(--color-civic-text-muted)] font-bold uppercase tracking-wider">
                      Issues Reported
                    </div>
                  </div>
                </NeumorphicCardInset>

                {/* Resolved */}
                <NeumorphicCardInset className="p-4 flex flex-col justify-between rounded-xl border-transparent">
                  <div className="flex justify-between items-start">
                    <CheckCircle className="h-5 w-5 text-[var(--color-civic-secondary)]" />
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl md:text-3xl font-extrabold text-[var(--color-civic-text-primary)] leading-none mb-1">
                      {stats?.resolvedIssues ?? 0}
                    </div>
                    <div className="text-[10px] text-[var(--color-civic-text-muted)] font-bold uppercase tracking-wider">
                      Resolved
                    </div>
                  </div>
                </NeumorphicCardInset>

                {/* Active Citizens */}
                <NeumorphicCardInset className="p-4 flex flex-col justify-between rounded-xl border-transparent">
                  <div className="flex justify-between items-start">
                    <Users className="h-5 w-5 text-[var(--color-civic-admin)]" />
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl md:text-3xl font-extrabold text-[var(--color-civic-text-primary)] leading-none mb-1">
                      {stats?.activeCitizens ?? 0}
                    </div>
                    <div className="text-[10px] text-[var(--color-civic-text-muted)] font-bold uppercase tracking-wider">
                      Active Citizens
                    </div>
                  </div>
                </NeumorphicCardInset>

                {/* Resolution Rate */}
                <NeumorphicCardInset className="p-4 flex flex-col justify-between rounded-xl border-transparent">
                  <div className="flex justify-between items-start">
                    <TrendingUp className="h-5 w-5 text-[var(--color-civic-department)]" />
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl md:text-3xl font-extrabold text-[var(--color-civic-text-primary)] leading-none mb-1">
                      {stats && stats.totalIssues > 0
                        ? ((stats.resolvedIssues / stats.totalIssues) * 100).toFixed(0) + "%"
                        : "0%"}
                    </div>
                    <div className="text-[10px] text-[var(--color-civic-text-muted)] font-bold uppercase tracking-wider">
                      Resolution Rate
                    </div>
                  </div>
                </NeumorphicCardInset>
              </div>

              {/* Latest Report Section */}
              <div className="mt-6 pt-6 border-t border-[var(--color-civic-border)]/60 relative z-10">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-civic-text-muted)] block mb-3">
                  Latest Report
                </span>
                {stats?.latestIssue ? (
                  <NeumorphicCardInset className="p-4 rounded-xl border-transparent flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-[var(--color-civic-text-primary)] leading-tight">
                        {stats.latestIssue.title.length > 40
                          ? stats.latestIssue.title.substring(0, 40) + "..."
                          : stats.latestIssue.title}
                      </h4>
                      <div className="flex flex-wrap gap-2 items-center">
                        <NeumorphicBadge variant="primary" className="text-[9px] px-2 py-0.5">
                          {stats.latestIssue.category}
                        </NeumorphicBadge>
                        <NeumorphicBadge
                          variant={
                            stats.latestIssue.status === "Resolved" ||
                            stats.latestIssue.status === "Confirmed"
                              ? "success"
                              : stats.latestIssue.status === "In Progress"
                              ? "primary"
                              : "warning"
                          }
                          className="text-[9px] px-2 py-0.5"
                        >
                          {stats.latestIssue.status}
                        </NeumorphicBadge>
                      </div>
                    </div>
                    <Link
                      to="/issues"
                      className="text-xs font-bold text-[var(--color-civic-primary)] hover:underline shrink-0 flex items-center gap-1 self-end sm:self-center"
                    >
                      View →
                    </Link>
                  </NeumorphicCardInset>
                ) : (
                  <div className="text-sm text-[var(--color-civic-text-muted)] italic">
                    No reports submitted yet.
                  </div>
                )}
              </div>
            </NeumorphicCard>
          )}
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
