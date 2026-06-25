import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, updateDoc, doc, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Issue } from "../types";
import { NeumorphicCard } from "../components/ui/card";
import { IssueCard } from "../components/IssueCard";
import { LayoutDashboard } from "lucide-react";
import { useToast } from "../context/ToastContext";

export function DepartmentDashboard() {
  const { user, departmentName } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchAssigned = async () => {
      if (!departmentName) return;
      try {
        // Find issues assigned to this department, OR suggested for this department if not specifically assigned?
        // Wait, instructions say: "Issue cards/table filtered by assignedTo or suggestedDepartment matching departmentName"
        const q1 = query(collection(db, "issues"), where("assignedTo", "==", departmentName));
        const q2 = query(collection(db, "issues"), where("suggestedDepartment", "==", departmentName));
        
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        const combined = new Map<string, Issue>();
        snap1.forEach(d => combined.set(d.id, { id: d.id, ...d.data() } as Issue));
        snap2.forEach(d => combined.set(d.id, { id: d.id, ...d.data() } as Issue));
        
        setIssues(Array.from(combined.values()).sort((a, b) => b.priorityScore - a.priorityScore));
      } catch (error) {
        console.error(error);
        addToast("Failed to fetch assigned issues", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchAssigned();
  }, [departmentName]);

  const stats = {
    total: issues.length,
    inProgress: issues.filter(i => i.status === "In Progress").length,
    resolved: issues.filter(i => i.status === "Resolved" || i.status === "Confirmed").length,
    urgent: issues.filter(i => i.priorityScore >= 81).length,
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[var(--color-civic-text-primary)] tracking-tight flex items-center gap-2">
          <LayoutDashboard className="h-8 w-8 text-[var(--color-civic-department)]" />
          {departmentName} Dashboard
        </h1>
        <p className="text-[var(--color-civic-text-secondary)] font-medium mt-2">Manage and update issues assigned to your department.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Assigned", value: stats.total, color: "text-[var(--color-civic-primary)]" },
          { label: "In Progress", value: stats.inProgress, color: "text-[var(--color-civic-status-inprogress)]" },
          { label: "Resolved", value: stats.resolved, color: "text-[var(--color-civic-status-confirmed)]" },
          { label: "Urgent", value: stats.urgent, color: "text-[var(--color-civic-danger)]" }
        ].map((stat, i) => (
          <NeumorphicCard key={i} className="p-4 text-center">
            <div className="text-sm font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">{stat.label}</div>
            <div className={`text-3xl font-black mt-1 ${stat.color}`}>{stat.value}</div>
          </NeumorphicCard>
        ))}
      </div>

      <h2 className="text-xl font-extrabold text-[var(--color-civic-text-primary)] mt-8 mb-4 tracking-tight">Assigned Issues</h2>
      
      {loading ? (
        <div className="text-center py-8 text-[var(--color-civic-text-secondary)] font-medium">Loading...</div>
      ) : issues.length === 0 ? (
        <NeumorphicCard className="p-8 text-center text-[var(--color-civic-text-secondary)] font-medium bg-[var(--color-civic-surface-inset)] shadow-[var(--shadow-neumorphic-inset)] border border-transparent">
          No issues assigned to this department yet.
        </NeumorphicCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {issues.map(issue => (
            <IssueCard key={issue.id} issue={issue} onClick={() => window.location.href = `/issues/${issue.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
