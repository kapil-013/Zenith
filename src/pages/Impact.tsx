import React, { useEffect, useState } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { Issue } from "../types";
import { NeumorphicCard, NeumorphicCardInset } from "../components/ui/card";
import { NeumorphicBadge } from "../components/ui/badge";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { hasPermission, Permission } from "../lib/auth/permissions";
import {
  BarChart3,
  TrendingUp,
  Users,
  HeartHandshake,
  BrainCircuit,
  Sparkles,
  MapPin,
  ShieldAlert,
  ArrowRight,
  Clock,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Label,
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2 as CheckCircle2Icon } from "lucide-react";
import { AIInsightCard, InsightData } from "../components/AIInsightCard";

export function Impact() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [loadingForecasts, setLoadingForecasts] = useState(false);
  const [hasGeneratedForecasts, setHasGeneratedForecasts] = useState(false);

  const { role } = useAuth();
  const { addToast } = useToast();

  const canViewPredictive =
    role && hasPermission(role, Permission.VIEW_ANALYTICS);

  useEffect(() => {
    const q = query(collection(db, "issues"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Issue[] = [];
      snapshot.forEach((d) => data.push({ id: d.id, ...d.data() } as Issue));
      setIssues(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (issues.length > 0 && !insight && !loadingInsight) {
      generateInsight(issues);
    }
  }, [issues]);

  const generateInsight = async (issuesList: any[]) => {
    setLoadingInsight(true);
    try {
      const res = await fetch("/api/generate-impact-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issues: issuesList }),
      });
      if (res.ok) {
        const data = await res.json();
        setInsight(data);
      } else {
        throw new Error("Failed to fetch");
      }
    } catch (e) {
      console.error(e);
      setInsight({
        headline: "Civic Insights (Mock)",
        summary:
          "AI analysis is currently unavailable. This is a default fallback insight.",
        hotspots: ["School Road", "Market Chowk"],
        recommendedActions: [
          "Review high priority issues manually",
          "Verify recent reports",
        ],
        riskLevel: "Medium",
      });
    } finally {
      setLoadingInsight(false);
    }
  };

  const fetchPredictiveHotspots = async () => {
    setLoadingForecasts(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        addToast("Please sign in first.", "error");
        return;
      }
      const token = await user.getIdToken();
      const res = await fetch("/api/intelligence/predict-hotspots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setForecasts(data.forecasts || []);
        setHasGeneratedForecasts(true);
        addToast("Predictive hotspots generated!", "success");
      } else {
        throw new Error("Failed to generate predictive hotspots");
      }
    } catch (error: any) {
      console.error(error);
      addToast(error.message || "Failed to generate forecasts.", "error");
    } finally {
      setLoadingForecasts(false);
    }
  };

  const resolved = issues.filter(
    (i) => i.status === "Resolved" || i.status === "Confirmed",
  ).length;
  const verified = issues.filter((i) => i.verificationCount > 0).length;
  const totalVerifications = issues.reduce(
    (acc, issue) => acc + issue.verificationCount,
    0,
  );

  const statusData = [
    { name: "Open", count: issues.filter((i) => i.status === "Open").length },
    {
      name: "Verified",
      count: issues.filter((i) => i.status === "Verified").length,
    },
    {
      name: "In Progress",
      count: issues.filter((i) => i.status === "In Progress").length,
    },
    {
      name: "Resolved",
      count: issues.filter(
        (i) => i.status === "Resolved" || i.status === "Confirmed",
      ).length,
    },
  ];

  // Average Resolution Time by Department calculation
  const resolvedIssuesWithTime = issues.filter(
    (i) =>
      (i.status === "Resolved" || i.status === "Confirmed") &&
      i.createdAt &&
      i.updatedAt &&
      i.assignedTo
  );

  const deptGroups: Record<string, { totalDays: number; count: number }> = {};
  resolvedIssuesWithTime.forEach((i) => {
    const dept = i.assignedTo;
    if (!dept) return;
    const days = (i.updatedAt - i.createdAt) / (1000 * 60 * 60 * 24);
    const positiveDays = Math.max(0.1, days);
    if (!deptGroups[dept]) {
      deptGroups[dept] = { totalDays: 0, count: 0 };
    }
    deptGroups[dept].totalDays += positiveDays;
    deptGroups[dept].count += 1;
  });

  const avgResolutionTimeData = Object.entries(deptGroups).map(([dept, data]) => ({
    department: dept,
    avgDays: parseFloat((data.totalDays / data.count).toFixed(1)),
  }));

  // Issues by Category calculation
  const categoryCounts: Record<string, number> = {};
  issues.forEach((i) => {
    const cat = i.category || "Other";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const categoryChartData = Object.entries(categoryCounts).map(([category, count]) => ({
    name: category,
    value: count,
  }));

  const categoryColors: Record<string, string> = {
    "Pothole": "#92400E",
    "Garbage Overflow": "#4D7C0F",
    "Water Leakage": "#0284C7",
    "Broken Streetlight": "#CA8A04",
    "Sewage Issue": "#7C2D12",
    "Road Blockage": "#EA580C",
    "Damaged Infrastructure": "#475569",
    "Unsafe Public Area": "#DC2626",
    "Other": "#64748B",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="text-center max-w-2xl mx-auto py-8">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex p-4 bg-[var(--color-civic-surface-inset)] rounded-full shadow-[var(--shadow-neumorphic-inset)] border border-transparent mb-6"
        >
          <BarChart3 className="h-10 w-10 text-[var(--color-civic-primary)]" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-extrabold text-[var(--color-civic-text-primary)] tracking-tight mb-4"
        >
          Community Impact
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-[var(--color-civic-text-secondary)] font-medium"
        >
          See how active citizens and responsible authorities are transforming
          your neighborhood.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <MetricCard
            title="Total Reports"
            value={issues.length}
            icon={TrendingUp}
            color="text-[var(--color-civic-primary)]"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <MetricCard
            title="Resolved Issues"
            value={resolved}
            icon={HeartHandshake}
            color="text-[var(--color-civic-status-confirmed)]"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <MetricCard
            title="Issues Verified"
            value={verified}
            icon={CheckCircle2Icon}
            color="text-[var(--color-civic-priority-medium)]"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
        >
          <MetricCard
            title="Citizen Actions"
            value={totalVerifications}
            icon={Users}
            color="text-[var(--color-civic-admin)]"
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <NeumorphicCard className="p-8 h-full">
            <h3 className="font-extrabold text-xl text-[var(--color-civic-text-primary)] mb-6">
              Resolution Pipeline
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(0,0,0,0.1)"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "var(--color-civic-text-secondary)",
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "var(--color-civic-text-secondary)",
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "var(--shadow-neumorphic)",
                      backgroundColor: "var(--color-civic-surface)",
                      color: "var(--color-civic-text-primary)",
                      fontWeight: "bold",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--color-civic-primary)"
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </NeumorphicCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
        >
          <AIInsightCard insight={insight} loading={loadingInsight} />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95 }}
        >
          <NeumorphicCard className="p-8 h-full">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-civic-text-muted)] block mb-2">
              Performance Metrics
            </span>
            <h3 className="font-extrabold text-xl text-[var(--color-civic-text-primary)] mb-6">
              Avg. Resolution Time (days)
            </h3>
            {avgResolutionTimeData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-56 text-[var(--color-civic-text-muted)] italic">
                <span>No data yet</span>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart layout="vertical" data={avgResolutionTimeData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="rgba(0,0,0,0.1)"
                    />
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "var(--color-civic-text-secondary)",
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    />
                    <YAxis
                      dataKey="department"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      width={140}
                      tick={{
                        fill: "var(--color-civic-text-secondary)",
                        fontWeight: 600,
                        fontSize: 11,
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.05)" }}
                      contentStyle={{
                        borderRadius: "16px",
                        border: "none",
                        boxShadow: "var(--shadow-neumorphic)",
                        backgroundColor: "var(--color-civic-surface)",
                        color: "var(--color-civic-text-primary)",
                        fontWeight: "bold",
                      }}
                      formatter={(value) => [`${value} days avg`]}
                    />
                    <Bar
                      dataKey="avgDays"
                      fill="var(--color-civic-department, var(--color-civic-primary))"
                      radius={[0, 6, 6, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </NeumorphicCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <NeumorphicCard className="p-8 h-full">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-civic-text-muted)] block mb-2">
              Distribution Metrics
            </span>
            <h3 className="font-extrabold text-xl text-[var(--color-civic-text-primary)] mb-6">
              Issues by Category
            </h3>
            {categoryChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-56 text-[var(--color-civic-text-muted)] italic">
                <span>No data yet</span>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="40%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={categoryColors[entry.name] || "#64748B"} />
                      ))}
                      <Label
                        value={issues.length}
                        position="center"
                        fill="var(--color-civic-text-primary)"
                        style={{ fontSize: "20px", fontWeight: "bold" }}
                      />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "16px",
                        border: "none",
                        boxShadow: "var(--shadow-neumorphic)",
                        backgroundColor: "var(--color-civic-surface)",
                        color: "var(--color-civic-text-primary)",
                        fontWeight: "bold",
                      }}
                    />
                    <Legend
                      iconType="circle"
                      layout="horizontal"
                      align="center"
                      verticalAlign="bottom"
                      wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </NeumorphicCard>
        </motion.div>
      </div>

      {canViewPredictive && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="space-y-6 pt-4"
        >
          <NeumorphicCard className="p-8 border-t-4 border-t-[var(--color-civic-admin)]">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-[var(--color-civic-border)]/60">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[var(--color-civic-admin-soft)] text-[var(--color-civic-admin)] rounded-full shadow-[var(--shadow-neumorphic-inset)]">
                  <BrainCircuit className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[var(--color-civic-text-primary)] tracking-tight">
                    Predictive Hotspots Forecast
                  </h2>
                  <p className="text-sm text-[var(--color-civic-text-secondary)] font-medium">
                    CivicForecast AI analyzes recurring patterns of the last 90
                    days to predict likely issue areas in the next 30 days.
                  </p>
                </div>
              </div>
              <button
                onClick={fetchPredictiveHotspots}
                disabled={loadingForecasts}
                className="w-full md:w-auto px-6 py-3 rounded-full font-bold text-sm tracking-wide text-white transition-all bg-[var(--color-civic-admin)] shadow-[var(--shadow-neumorphic)] hover:brightness-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
              >
                {loadingForecasts ? (
                  <>
                    <BrainCircuit className="h-4 w-4 animate-spin" />
                    Analyzing Recurrence Trends...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Forecast
                  </>
                )}
              </button>
            </div>

            {loadingForecasts ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="p-5 rounded-2xl bg-[var(--color-civic-surface-inset)] animate-pulse space-y-4"
                  >
                    <div className="h-4 bg-[var(--color-civic-border)] rounded-md w-1/3" />
                    <div className="h-6 bg-[var(--color-civic-border)] rounded-md w-2/3" />
                    <div className="h-16 bg-[var(--color-civic-border)] rounded-md w-full" />
                    <div className="h-4 bg-[var(--color-civic-border)] rounded-md w-1/2" />
                  </div>
                ))}
              </div>
            ) : forecasts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
                {forecasts.map((forecast, idx) => {
                  const isHigh = forecast.riskLevel === "High";
                  const isMedium = forecast.riskLevel === "Medium";
                  const borderColor = isHigh
                    ? "border-l-[var(--color-civic-danger)]"
                    : isMedium
                      ? "border-l-[var(--color-civic-priority-medium)]"
                      : "border-l-[var(--color-civic-primary)]";

                  const riskBadgeVariant = isHigh
                    ? "danger"
                    : isMedium
                      ? "warning"
                      : "info";

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`p-5 rounded-2xl bg-[var(--color-civic-surface-inset)] shadow-[var(--shadow-neumorphic-inset)] border-l-4 ${borderColor} relative overflow-hidden group hover:scale-[1.01] transition-all`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-black uppercase tracking-widest text-[var(--color-civic-text-muted)]">
                          {forecast.category}
                        </span>
                        <NeumorphicBadge variant={riskBadgeVariant}>
                          {forecast.riskLevel} Risk
                        </NeumorphicBadge>
                      </div>

                      <h3 className="font-extrabold text-base text-[var(--color-civic-text-primary)] mb-2 flex items-center gap-1.5 leading-tight">
                        <MapPin className="h-4 w-4 text-[var(--color-civic-text-muted)] shrink-0" />
                        <span className="truncate" title={forecast.area}>
                          {forecast.area}
                        </span>
                      </h3>

                      <p className="text-xs text-[var(--color-civic-text-secondary)] leading-relaxed font-medium mb-4 line-clamp-3">
                        {forecast.reasoning}
                      </p>

                      <div className="pt-3 border-t border-[var(--color-civic-border)]/40 flex items-center justify-between text-xs font-bold">
                        <span className="text-[var(--color-civic-text-muted)] flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Within {forecast.predictedWindowDays} days
                        </span>
                        <span className="text-[var(--color-civic-text-primary)] flex items-center gap-1">
                          <Zap className="h-3.5 w-3.5 text-amber-500" />
                          {Math.round(forecast.confidence * 100)}% Confidence
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : hasGeneratedForecasts ? (
              <div className="text-center py-12">
                <BrainCircuit className="h-12 w-12 text-[var(--color-civic-text-muted)] mx-auto mb-4 opacity-50" />
                <h3 className="font-bold text-lg text-[var(--color-civic-text-primary)] mb-2">
                  No Overlapping Recurrence Patterns Found
                </h3>
                <p className="text-sm text-[var(--color-civic-text-secondary)] font-medium max-w-md mx-auto">
                  Excellent news! Our CivicForecast AI analyzed reports from the
                  last 90 days but didn't detect any high-frequency recurring
                  issues at the same locations.
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 text-[var(--color-civic-text-muted)] mx-auto mb-4 opacity-50" />
                <h3 className="font-bold text-lg text-[var(--color-civic-text-primary)] mb-2">
                  Forecast Ready
                </h3>
                <p className="text-sm text-[var(--color-civic-text-secondary)] font-medium max-w-md mx-auto mb-6">
                  Initiate predictive analysis to forecast future hyperlocal
                  hotspots based on community recurrence frequency.
                </p>
                <button
                  onClick={fetchPredictiveHotspots}
                  className="px-6 py-2.5 rounded-full font-bold text-xs bg-[var(--color-civic-surface)] text-[var(--color-civic-text-primary)] shadow-[var(--shadow-neumorphic)] hover:scale-102 active:scale-98 transition-transform cursor-pointer"
                >
                  Analyze Recurrence Patterns
                </button>
              </div>
            )}
          </NeumorphicCard>
        </motion.div>
      )}
    </motion.div>
  );
}

function MetricCard({ title, value, icon: Icon, color }: any) {
  return (
    <NeumorphicCard className="p-6 text-center flex flex-col items-center h-full hover:scale-[1.02] transition-transform">
      <div
        className={`p-3 bg-[var(--color-civic-surface-inset)] rounded-xl shadow-[var(--shadow-neumorphic-inset)] border border-transparent mb-4 ${color}`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-sm font-bold text-[var(--color-civic-text-secondary)] uppercase tracking-widest">
        {title}
      </p>
      <p className={`text-4xl font-black mt-2 ${color}`}>{value}</p>
    </NeumorphicCard>
  );
}
