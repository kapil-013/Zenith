import React, { useEffect, useState } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Issue } from "../types";
import { NeumorphicCard } from "../components/ui/card";
import { BarChart3, TrendingUp, Users, HeartHandshake } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "motion/react";
import { CheckCircle2 as CheckCircle2Icon } from "lucide-react";
import { AIInsightCard, InsightData } from "../components/AIInsightCard";

export function Impact() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

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
          className="inline-flex p-4 bg-[#e9eef5] rounded-full shadow-[inset_2px_2px_4px_#b8bec5,inset_-2px_-2px_4px_#ffffff] mb-6"
        >
          <BarChart3 className="h-10 w-10 text-blue-600" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold text-slate-800 mb-4"
        >
          Community Impact
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-slate-600"
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
            color="text-blue-500"
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
            color="text-green-500"
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
            color="text-amber-500"
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
            color="text-indigo-500"
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
            <h3 className="font-bold text-lg text-slate-800 mb-6">
              Resolution Pipeline
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#cbd5e1"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b" }}
                  />
                  <Tooltip
                    cursor={{ fill: "#e2e8f0", opacity: 0.4 }}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "6px 6px 12px #b8bec5, -6px -6px 12px #ffffff",
                      backgroundColor: "#e9eef5",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#3b82f6"
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
    </motion.div>
  );
}

function MetricCard({ title, value, icon: Icon, color }: any) {
  return (
    <NeumorphicCard className="p-6 text-center flex flex-col items-center h-full hover:scale-[1.02] transition-transform">
      <div
        className={`p-3 bg-[#e9eef5] rounded-xl shadow-[inset_2px_2px_4px_#b8bec5,inset_-2px_-2px_4px_#ffffff] mb-4 ${color}`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
        {title}
      </p>
      <p className={`text-4xl font-black mt-2 ${color}`}>{value}</p>
    </NeumorphicCard>
  );
}
