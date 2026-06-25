import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Issue } from "../types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { NeumorphicCard } from "../components/ui/card";
import { NeumorphicButton } from "../components/ui/button";
import { NeumorphicBadge } from "../components/ui/badge";
import { NeumorphicInput } from "../components/ui/input";
import { NeumorphicTextarea } from "../components/ui/textarea";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  LayoutDashboard,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import { loadDemoData, resetDemoData } from "../lib/seed";
import { motion, AnimatePresence } from "motion/react";
import { AIInsightCard, InsightData } from "../components/AIInsightCard";

export function Admin() {
  const { user, role } = useAuth();
  const { addToast } = useToast();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  
  // Assign Dept Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [assignDept, setAssignDept] = useState("");
  const [assignNote, setAssignNote] = useState("");

  useEffect(() => {
    const q = query(collection(db, "issues"), orderBy("priorityScore", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Issue[] = [];
      snapshot.forEach((d) => data.push({ id: d.id, ...d.data() } as Issue));
      setIssues(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (issues.length > 0 && !insight && !loadingInsight && role === "admin") {
      generateInsight(issues);
    }
  }, [issues, role]);

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

  const handleUpdateStatus = async (issueId: string, newStatus: string) => {
    if (!user) {
      addToast("Please sign in to update status.", "error");
      return;
    }
    try {
      await updateDoc(doc(db, "issues", issueId), { status: newStatus, updatedAt: Date.now() });
      await addDoc(collection(db, "status_updates"), {
        issueId,
        status: newStatus,
        note: `Admin changed status to ${newStatus}.`,
        updatedBy: user.id,
        createdAt: Date.now(),
      });
      addToast(`Status updated to ${newStatus}`, "success");
    } catch (e) {
      console.error(e);
      addToast("Failed to update status", "error");
    }
  };

  const handleAssignDeptSubmit = async () => {
    if (!selectedIssueId || !assignDept.trim() || !user) return;
    try {
      const issueRef = doc(db, "issues", selectedIssueId);
      const currentIssue = issues.find(i => i.id === selectedIssueId);
      if (!currentIssue) return;
      
      await updateDoc(issueRef, { 
        assignedTo: assignDept.trim(),
        updatedAt: Date.now()
      });
      
      await addDoc(collection(db, "status_updates"), {
        issueId: selectedIssueId,
        status: currentIssue.status,
        note: `Assigned to ${assignDept.trim()}.${assignNote ? ' Note: ' + assignNote : ''}`,
        updatedBy: user.id,
        createdAt: Date.now(),
      });
      
      addToast("Department assigned successfully", "success");
      setAssignModalOpen(false);
      setAssignDept("");
      setAssignNote("");
      setSelectedIssueId(null);
    } catch (e) {
      console.error(e);
      addToast("Failed to assign department", "error");
    }
  };

  const handleLoadDemoData = async () => {
    try {
      await loadDemoData();
      addToast("Demo data loaded successfully!", "success");
    } catch (e) {
      addToast("Failed to load demo data.", "error");
    }
  };

  const handleResetDemoData = async () => {
    try {
      await resetDemoData();
      addToast("Demo data reset successfully!", "success");
    } catch (e) {
      addToast("Failed to reset demo data.", "error");
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <NeumorphicCard className="p-12 text-center flex flex-col items-center max-w-md w-full">
          <ShieldAlert className="h-16 w-16 text-slate-400 mb-6" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Sign in Required</h2>
          <p className="text-slate-500 mb-8">Please sign in to access the command center.</p>
        </NeumorphicCard>
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <NeumorphicCard className="p-12 text-center flex flex-col items-center max-w-md w-full">
          <ShieldAlert className="h-16 w-16 text-red-400 mb-6" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Admin Access Required</h2>
          <p className="text-slate-500">You do not have permission to view the command center.</p>
        </NeumorphicCard>
      </div>
    );
  }

  const total = issues.length;
  const resolved = issues.filter(
    (i) => i.status === "Resolved" || i.status === "Confirmed",
  ).length;
  const highPriority = issues.filter(
    (i) =>
      i.priorityScore >= 61 &&
      i.status !== "Resolved" &&
      i.status !== "Confirmed",
  ).length;

  const categoryCount = issues.reduce(
    (acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const pieData = Object.keys(categoryCount).map((k) => ({
    name: k,
    value: categoryCount[k],
  }));
  const COLORS = [
    "#3b82f6",
    "#ef4444",
    "#f59e0b",
    "#10b981",
    "#6366f1",
    "#8b5cf6",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[var(--color-civic-admin-soft)] rounded-xl shadow-[var(--shadow-neumorphic-inset)] border border-transparent">
            <ShieldAlert className="h-6 w-6 text-[var(--color-civic-admin)]" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-civic-text-primary)] uppercase tracking-tight">
              Command Center
            </h1>
            <p className="text-[var(--color-civic-text-secondary)] font-bold">
              Civic Operations & Issue Tracking
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <NeumorphicButton onClick={handleLoadDemoData}>
            Load Demo Data
          </NeumorphicButton>
          <NeumorphicButton variant="admin" onClick={handleResetDemoData}>
            Reset Demo Data
          </NeumorphicButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <NeumorphicCard className="p-6 flex items-center justify-between h-full hover:scale-[1.02] transition-transform">
            <div>
              <p className="text-sm font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                Total Reports
              </p>
              <p className="text-4xl font-black text-[var(--color-civic-text-primary)] mt-2">{total}</p>
            </div>
            <div className="p-4 bg-[var(--color-civic-primary)]/10 rounded-2xl text-[var(--color-civic-primary)] shadow-sm">
              <LayoutDashboard className="h-8 w-8" />
            </div>
          </NeumorphicCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <NeumorphicCard className="p-6 flex items-center justify-between h-full hover:scale-[1.02] transition-transform">
            <div>
              <p className="text-sm font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                High Priority Queue
              </p>
              <p className="text-4xl font-black text-[var(--color-civic-danger)] mt-2">
                {highPriority}
              </p>
            </div>
            <div className="p-4 bg-[var(--color-civic-danger)]/10 rounded-2xl text-[var(--color-civic-danger)] shadow-sm">
              <AlertTriangle className="h-8 w-8" />
            </div>
          </NeumorphicCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <NeumorphicCard className="p-6 flex items-center justify-between h-full hover:scale-[1.02] transition-transform">
            <div>
              <p className="text-sm font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                Resolved / Confirmed
              </p>
              <p className="text-4xl font-black text-[var(--color-civic-status-confirmed)] mt-2">
                {resolved}
              </p>
            </div>
            <div className="p-4 bg-[var(--color-civic-status-confirmed)]/10 rounded-2xl text-[var(--color-civic-status-confirmed)] shadow-sm">
              <CheckCircle2 className="h-8 w-8" />
            </div>
          </NeumorphicCard>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <NeumorphicCard className="p-6 h-full">
            <h3 className="font-extrabold text-xl text-[var(--color-civic-text-primary)] mb-6">
              Reports by Category
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "var(--shadow-neumorphic)",
                      backgroundColor: "var(--color-civic-surface)",
                      color: "var(--color-civic-text-primary)",
                      fontWeight: "bold"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </NeumorphicCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <AIInsightCard insight={insight} loading={loadingInsight} />
        </motion.div>
      </div>

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-2xl font-extrabold text-[var(--color-civic-text-primary)] pt-4 flex items-center gap-2 tracking-tight"
      >
        <AlertTriangle className="h-6 w-6 text-[var(--color-civic-danger)]" />
        Urgent Action Queue
      </motion.h2>

      <div className="space-y-4">
        {issues
          .filter((i) => i.status !== "Resolved" && i.status !== "Confirmed")
          .map((issue, index) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.05 }}
            >
              <NeumorphicCard className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:scale-[1.01] transition-transform">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-[var(--color-civic-surface-inset)] shadow-[var(--shadow-neumorphic-inset)] flex items-center justify-center border border-transparent">
                    <span
                      className={`text-xl font-black ${issue.priorityScore >= 61 ? "text-[var(--color-civic-danger)]" : "text-[var(--color-civic-priority-medium)]"}`}
                    >
                      {issue.priorityScore}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[var(--color-civic-text-primary)] text-lg">
                      {issue.title}
                    </h4>
                    <p className="text-sm text-[var(--color-civic-text-secondary)] font-medium">{issue.address}</p>
                    <div className="flex flex-wrap gap-2 mt-2 items-center">
                      <NeumorphicBadge>{issue.category}</NeumorphicBadge>
                      <NeumorphicBadge
                        variant={
                          issue.status === "Open" ? "default" : "warning"
                        }
                      >
                        {issue.status}
                      </NeumorphicBadge>
                      {issue.assignedTo && (
                        <span className="text-xs font-bold text-[var(--color-civic-text-muted)] flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {issue.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3 min-w-[160px]">
                  <select
                    className="text-sm p-2.5 rounded-xl font-bold text-[var(--color-civic-text-primary)] bg-[var(--color-civic-surface-inset)] shadow-[var(--shadow-neumorphic-inset)] focus:outline-none focus:ring-2 focus:ring-[var(--color-civic-admin)]/50 border border-transparent appearance-none"
                    value={issue.status}
                    onChange={(e) =>
                      handleUpdateStatus(issue.id, e.target.value)
                    }
                  >
                    <option value="Open">Open</option>
                    <option value="Verified">Verified</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                  <NeumorphicButton
                    size="sm"
                    variant="admin"
                    className="w-full"
                    onClick={() => {
                      setSelectedIssueId(issue.id);
                      setAssignDept(issue.assignedTo || issue.suggestedDepartment || "");
                      setAssignNote("");
                      setAssignModalOpen(true);
                    }}
                  >
                    Assign Dept
                  </NeumorphicButton>
                </div>
              </NeumorphicCard>
            </motion.div>
          ))}
      </div>
      
      {/* Assign Dept Modal */}
      <AnimatePresence>
        {assignModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md"
            >
              <NeumorphicCard className="p-6 relative border-t-4 border-[var(--color-civic-admin)]">
                <button
                  onClick={() => setAssignModalOpen(false)}
                  className="absolute top-4 right-4 text-[var(--color-civic-text-muted)] hover:text-[var(--color-civic-text-primary)] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                <h3 className="text-xl font-extrabold text-[var(--color-civic-text-primary)] mb-6">Assign Department</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-[var(--color-civic-text-secondary)] mb-2 uppercase tracking-widest">
                      Department / Team Name
                    </label>
                    <NeumorphicInput
                      value={assignDept}
                      onChange={(e) => setAssignDept(e.target.value)}
                      placeholder="e.g. Public Works, Sanitation Dept"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[var(--color-civic-text-secondary)] mb-2 uppercase tracking-widest">
                      Note (Optional)
                    </label>
                    <NeumorphicTextarea
                      value={assignNote}
                      onChange={(e) => setAssignNote(e.target.value)}
                      placeholder="Additional instructions for the team..."
                      rows={3}
                    />
                  </div>
                  <div className="pt-4 flex gap-4">
                    <NeumorphicButton className="flex-1" onClick={() => setAssignModalOpen(false)}>
                      Cancel
                    </NeumorphicButton>
                    <NeumorphicButton variant="admin" className="flex-1" onClick={handleAssignDeptSubmit} disabled={!assignDept.trim()}>
                      Save Assignment
                    </NeumorphicButton>
                  </div>
                </div>
              </NeumorphicCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
