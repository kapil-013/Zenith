import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Issue, Verification } from "../types";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { NeumorphicCard } from "../components/ui/card";
import { NeumorphicBadge } from "../components/ui/badge";
import { NeumorphicButton } from "../components/ui/button";
import { StatusTimeline } from "../components/StatusTimeline";
import { AIExplainabilityWidget } from "../components/ui/intelligence/AIExplainabilityWidget";
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Building,
  ArrowLeft,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn, calculatePriorityScore } from "../lib/utils";
import { motion } from "motion/react";
import { dispatcher } from "../lib/events/dispatcher";
import { WorkflowActionPanel } from "../components/WorkflowActionPanel";
import { UserRole } from "../lib/auth/permissions";

export function IssueDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, signInWithGoogle } = useAuth();
  const { addToast } = useToast();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [userActions, setUserActions] = useState<Verification[]>([]);
  const [allVerifications, setAllVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchIssue() {
      if (!id) return;
      const docRef = doc(db, "issues", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setIssue({ id: docSnap.id, ...docSnap.data() } as Issue);
      }

      const allQ = query(
        collection(db, "verifications"),
        where("issueId", "==", id),
      );
      const allSnap = await getDocs(allQ);
      setAllVerifications(allSnap.docs.map((d) => d.data() as Verification));

      if (user) {
        const q = query(
          collection(db, "verifications"),
          where("issueId", "==", id),
          where("userId", "==", user.id),
        );
        const verifSnap = await getDocs(q);
        if (!verifSnap.empty) {
          const actions = verifSnap.docs.map(
            (d) =>
              ({
                id: d.id,
                ...d.data(),
              }) as Verification,
          );
          setUserActions(actions);
        }
      }
      setLoading(false);
    }
    fetchIssue();
  }, [id, user]);

  const handleTransition = async (
    nextStatus: string,
    note: string,
    attachments: string[],
  ) => {
    if (!user || !issue) return;
    setLoading(true);
    try {
      const issueRef = doc(db, "issues", issue.id);

      const updates: any = {
        status: nextStatus,
        currentStatus: nextStatus,
      };

      if (nextStatus === "Assigned to Department") {
        updates.assignedBy = user.id;
        updates.assignedAt = Date.now();
      } else if (nextStatus === "Work Completed") {
        updates.completedAt = Date.now();
      } else if (nextStatus === "Closed" || nextStatus === "Resolved") {
        updates.closedAt = Date.now();
      }

      await updateDoc(issueRef, updates);

      await addDoc(collection(db, "status_updates"), {
        issueId: issue.id,
        status: nextStatus,
        note: note,
        attachments: attachments,
        actorRole: user.role,
        updatedBy: user.id,
        createdAt: Date.now(),
      });

      await dispatcher.dispatch({
        type: "IssueStatusChanged",
        actorId: user.id,
        actorRole: user.role,
        affectedIssueId: issue.id,
        affectedUsers: [issue.createdBy],
        metadata: { newStatus: nextStatus },
      });

      if (nextStatus === "Assigned to Department") {
        await dispatcher.dispatch({
          type: "IssueAssigned",
          actorId: user.id,
          actorRole: user.role,
          affectedIssueId: issue.id,
          affectedUsers: [issue.createdBy],
          departmentId:
            issue.assignedTo ||
            issue.suggestedDepartment ||
            "General Civic Helpdesk",
        });
      }

      addToast("Status updated successfully", "success");
      setIssue((prev) => (prev ? { ...prev, ...updates } : prev));
    } catch (e) {
      console.error(e);
      addToast("Failed to update status", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    type: "verify" | "dispute" | "confirm_resolved",
  ) => {
    if (!user) {
      addToast("Please sign in first", "error");
      return;
    }
    if (!issue) return;
    if (userActions.some((a) => a.type === type)) {
      addToast("You have already performed this action.", "error");
      return;
    }

    try {
      await addDoc(collection(db, "verifications"), {
        issueId: issue.id,
        userId: user.id,
        type,
        createdAt: Date.now(),
      });

      const issueRef = doc(db, "issues", issue.id);
      const userRef = doc(db, "users", user.id);

      if (type === "verify") {
        const nextStatus =
          issue.currentStatus === "Reported" || issue.status === "Open"
            ? "Community Verified"
            : issue.currentStatus || issue.status;
        const { score, reasons } = calculatePriorityScore({
          ...issue,
          verificationCount: (issue.verificationCount || 0) + 1,
          status: nextStatus,
        });

        await updateDoc(issueRef, {
          verificationCount: increment(1),
          status: nextStatus,
          currentStatus: nextStatus,
          priorityScore: score,
          priorityReasons: reasons,
        });

        await updateDoc(userRef, { points: increment(3) });

        // Status update for verified
        if (issue.currentStatus === "Reported" || issue.status === "Open") {
          await addDoc(collection(db, "status_updates"), {
            issueId: issue.id,
            status: "Community Verified",
            note: "Issue verified by community member.",
            actorRole: user.role,
            updatedBy: user.id,
            createdAt: Date.now(),
          });
        }

        await dispatcher.dispatch({
          type: "IssueVerified",
          actorId: user.id,
          actorRole: user.role,
          affectedIssueId: issue.id,
          affectedUsers: [issue.createdBy],
        });
      } else if (type === "dispute") {
        await updateDoc(issueRef, { disputeCount: increment(1) });
      } else if (type === "confirm_resolved") {
        await updateDoc(issueRef, {
          confirmedResolvedCount: increment(1),
          status: "Closed",
          currentStatus: "Closed",
          closedAt: Date.now(),
        });
        await updateDoc(userRef, { points: increment(10) });
        await addDoc(collection(db, "status_updates"), {
          issueId: issue.id,
          status: "Closed",
          note: "Resolution confirmed by community member. Case Closed.",
          actorRole: user.role,
          updatedBy: user.id,
          createdAt: Date.now(),
        });

        await dispatcher.dispatch({
          type: "CitizenConfirmedResolution",
          actorId: user.id,
          actorRole: user.role,
          affectedIssueId: issue.id,
          affectedUsers: [issue.createdBy],
          departmentId: issue.assignedTo || undefined,
        });
      }

      addToast("Thank you for your civic contribution!", "success");

      const newAction: Verification = {
        id: Math.random().toString(),
        issueId: issue.id,
        userId: user.id,
        type,
        createdAt: Date.now(),
      };
      setUserActions((prev) => [...prev, newAction]);

      setIssue((prev) => {
        if (!prev) return prev;
        const newIssue = { ...prev };
        if (type === "verify") {
          const nextStatus =
            newIssue.currentStatus === "Reported" || newIssue.status === "Open"
              ? "Community Verified"
              : newIssue.currentStatus || newIssue.status;
          const { score, reasons } = calculatePriorityScore({
            ...newIssue,
            verificationCount: (newIssue.verificationCount || 0) + 1,
            status: nextStatus,
          });
          newIssue.verificationCount = (newIssue.verificationCount || 0) + 1;
          newIssue.status = nextStatus;
          newIssue.currentStatus = nextStatus;
          newIssue.priorityScore = score;
          newIssue.priorityReasons = reasons;
        } else if (type === "dispute") {
          newIssue.disputeCount = (newIssue.disputeCount || 0) + 1;
        } else if (type === "confirm_resolved") {
          newIssue.confirmedResolvedCount =
            (newIssue.confirmedResolvedCount || 0) + 1;
          newIssue.status = "Closed";
          newIssue.currentStatus = "Closed";
        }
        return newIssue;
      });
    } catch (e) {
      console.error(e);
      addToast("Failed to submit action", "error");
    }
  };

  if (loading)
    return (
      <div className="p-12 text-center text-slate-500 font-medium">
        Loading issue details...
      </div>
    );
  if (!issue)
    return (
      <div className="p-12 text-center text-xl font-bold text-slate-700">
        Issue not found
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      <Link to="/issues">
        <NeumorphicButton
          size="sm"
          variant="ghost"
          className="mb-4 gap-2 hover:-translate-x-1 transition-transform"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Map
        </NeumorphicButton>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          <NeumorphicCard className="overflow-hidden shadow-[var(--shadow-neumorphic)] border-t-4 border-[var(--color-civic-primary)]">
            {issue.imageUrl && (
              <div className="w-full h-80 bg-[var(--color-civic-surface-inset)] relative overflow-hidden group">
                <img
                  src={issue.imageUrl}
                  alt={issue.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
              </div>
            )}
            <div className="p-6 md:p-8 space-y-6 relative">
              {issue.imageUrl && (
                <div className="absolute -top-12 right-6">
                  <div className="w-16 h-16 rounded-full bg-[var(--color-civic-surface)] shadow-[var(--shadow-neumorphic)] flex items-center justify-center text-2xl font-extrabold text-[var(--color-civic-primary)] border-4 border-[var(--color-civic-surface-inset)]">
                    {issue.category.charAt(0)}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-2">
                <NeumorphicBadge variant="info">
                  {issue.category}
                </NeumorphicBadge>
                <NeumorphicBadge
                  variant={
                    issue.severity === "Critical"
                      ? "danger"
                      : issue.severity === "High"
                        ? "danger"
                        : issue.severity === "Medium"
                          ? "warning"
                          : "default"
                  }
                >
                  Severity: {issue.severity}
                </NeumorphicBadge>
                <NeumorphicBadge
                  variant={
                    ["Resolved", "Confirmed", "Closed"].includes(
                      issue.currentStatus || issue.status,
                    )
                      ? "success"
                      : [
                            "In Progress",
                            "Work Started",
                            "Work In Progress",
                            "Inspection Scheduled",
                            "Inspection Completed",
                            "Temporary Fix Applied",
                          ].includes(issue.currentStatus || issue.status)
                        ? "info"
                        : [
                              "Verified",
                              "Community Verified",
                              "Waiting for Citizen Confirmation",
                            ].includes(issue.currentStatus || issue.status)
                          ? "warning"
                          : "default"
                  }
                >
                  Status: {issue.currentStatus || issue.status}
                </NeumorphicBadge>
              </div>

              <h1 className="text-3xl font-extrabold text-[var(--color-civic-text-primary)] leading-tight tracking-tight">
                {issue.title}
              </h1>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-[var(--color-civic-text-secondary)] font-bold">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-[var(--color-civic-primary)]" />
                  <span className="font-bold">{issue.address}</span>
                </div>
                <div className="hidden sm:block text-[var(--color-civic-text-muted)]">
                  |
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 shrink-0 text-[var(--color-civic-text-muted)]" />
                  <span className="capitalize">{issue.locationType}</span>
                </div>
              </div>

              {[
                "Verified",
                "Community Verified",
                "Assigned to Department",
                "In Progress",
                "Work Started",
                "Work In Progress",
                "Inspection Scheduled",
                "Inspection Completed",
                "Temporary Fix Applied",
              ].includes(issue.currentStatus || issue.status) ? (
                <div className="bg-[var(--color-civic-primary)]/10 border border-[var(--color-civic-primary)]/20 text-[var(--color-civic-primary)] px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
                  <Users className="h-5 w-5 shrink-0" />
                  This issue is community verified and pending authority
                  resolution.
                </div>
              ) : ["Confirmed", "Closed"].includes(
                  issue.currentStatus || issue.status,
                ) ? (
                <div className="bg-[var(--color-civic-status-confirmed)]/10 border border-[var(--color-civic-status-confirmed)]/20 text-[var(--color-civic-status-confirmed)] px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  Confirmed fixed by residents. Civic impact achieved!
                </div>
              ) : null}

              <div className="bg-[var(--color-civic-surface-inset)] rounded-xl p-5 shadow-[var(--shadow-neumorphic-inset)] text-[var(--color-civic-text-secondary)] leading-relaxed font-medium border border-transparent">
                {issue.description}
              </div>

              <div className="border-t border-[var(--color-civic-surface-inset)] pt-6 space-y-4">
                <h3 className="font-extrabold flex items-center gap-2 text-lg text-[var(--color-civic-text-primary)] tracking-tight">
                  <ShieldAlert className="h-5 w-5 text-[var(--color-civic-admin)]" />
                  CivicVision AI Analysis
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                      Citizen Summary
                    </span>
                    <p className="text-sm font-medium text-[var(--color-civic-text-primary)]">
                      {issue.citizenSummary}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                      Suggested Department
                    </span>
                    <p className="text-sm font-bold text-[var(--color-civic-text-primary)]">
                      {issue.suggestedDepartment}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                      Risk Assessment
                    </span>
                    <p className="text-sm font-medium text-[var(--color-civic-text-primary)]">
                      {issue.riskReason}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                      Recommended Action
                    </span>
                    <p className="text-sm font-medium text-[var(--color-civic-text-primary)]">
                      {issue.recommendedAction}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200/50 pt-6">
                <StatusTimeline
                  issueId={issue.id}
                  currentStatus={issue.currentStatus || issue.status}
                />
              </div>

              {user && (
                <WorkflowActionPanel
                  issueId={issue.id}
                  currentStatus={issue.currentStatus || issue.status}
                  onTransition={handleTransition}
                  loading={loading}
                />
              )}
            </div>
          </NeumorphicCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <NeumorphicCard className="p-6 text-center hover:shadow-[var(--shadow-neumorphic-floating)] transition-shadow border-transparent">
            <h3 className="text-sm font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest mb-4">
              Priority Score
            </h3>
            <div className="relative inline-flex items-center justify-center w-32 h-32 rounded-full shadow-[var(--shadow-neumorphic-inset)] bg-[var(--color-civic-surface-inset)] mb-4 border-4 border-transparent">
              <span
                className={cn(
                  "text-5xl font-black tracking-tighter",
                  issue.priorityScore >= 81
                    ? "text-[var(--color-civic-danger)]"
                    : issue.priorityScore >= 61
                      ? "text-[var(--color-civic-priority-medium)]"
                      : issue.priorityScore >= 31
                        ? "text-[var(--color-civic-priority-medium)]"
                        : "text-[var(--color-civic-status-confirmed)]",
                )}
              >
                {issue.priorityScore}
              </span>
            </div>

            <div className="space-y-2 mt-4 text-left bg-[var(--color-civic-surface-inset)] p-4 rounded-xl shadow-[var(--shadow-neumorphic-inset)] border border-transparent">
              {issue.priorityReasons?.map((reason, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-[var(--color-civic-text-secondary)] font-bold"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-[var(--color-civic-primary)] shrink-0" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>

            <AIExplainabilityWidget
              issue={issue}
              verifications={allVerifications}
            />
          </NeumorphicCard>

          <NeumorphicCard className="p-6 relative overflow-hidden border-t-4 border-[var(--color-civic-primary)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-civic-primary)] to-[var(--color-civic-admin)] opacity-50"></div>
            <h3 className="font-extrabold text-lg text-[var(--color-civic-text-primary)] mb-4 flex items-center gap-2 tracking-tight">
              <Users className="h-5 w-5 text-[var(--color-civic-primary)]" />
              Community Action
            </h3>

            <div className="bg-[var(--color-civic-surface-inset)] p-4 rounded-xl shadow-[var(--shadow-neumorphic-inset)] mb-6 border border-transparent">
              <p className="text-sm font-bold text-[var(--color-civic-text-secondary)] italic text-center">
                "{issue.verificationQuestion}"
              </p>
            </div>

            <div className="flex justify-between items-center mb-6 px-2 text-center">
              <div className="flex-1">
                <p className="text-2xl font-black text-[var(--color-civic-primary)]">
                  {issue.verificationCount}
                </p>
                <p className="text-[10px] font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                  Verifications
                </p>
              </div>
              <div className="w-px h-8 bg-[var(--color-civic-surface-inset)] shadow-[var(--shadow-neumorphic-inset)]"></div>
              <div className="flex-1">
                <p className="text-2xl font-black text-[var(--color-civic-danger)]">
                  {issue.disputeCount}
                </p>
                <p className="text-[10px] font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest">
                  Disputes
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {userActions.some((a) => a.type === "verify") && (
                <NeumorphicBadge
                  variant="success"
                  className="w-full justify-center py-2.5 text-sm font-bold"
                >
                  You verified this issue.
                </NeumorphicBadge>
              )}
              {userActions.some((a) => a.type === "dispute") && (
                <NeumorphicBadge
                  variant="danger"
                  className="w-full justify-center py-2.5 text-sm font-bold"
                >
                  You disputed this issue.
                </NeumorphicBadge>
              )}
              {userActions.some((a) => a.type === "confirm_resolved") && (
                <NeumorphicBadge
                  variant="success"
                  className="w-full justify-center py-2.5 text-sm font-bold"
                >
                  You confirmed resolution.
                </NeumorphicBadge>
              )}

              {!userActions.some(
                (a) => a.type === "verify" || a.type === "dispute",
              ) && (
                <>
                  <NeumorphicButton
                    className="w-full font-bold hover:-translate-y-0.5 transition-transform"
                    variant="primary"
                    onClick={() => handleAction("verify")}
                  >
                    Verify Issue (+2 pts)
                  </NeumorphicButton>
                  <NeumorphicButton
                    className="w-full hover:-translate-y-0.5 transition-transform"
                    variant="danger"
                    onClick={() => handleAction("dispute")}
                  >
                    Dispute as Fake/Spam
                  </NeumorphicButton>
                </>
              )}

              {["Resolved", "Waiting for Citizen Confirmation"].includes(
                issue.currentStatus || issue.status,
              ) &&
                !userActions.some((a) => a.type === "confirm_resolved") && (
                  <NeumorphicButton
                    className="w-full mt-4 font-bold animate-pulse hover:animate-none"
                    variant="success"
                    onClick={() => handleAction("confirm_resolved")}
                  >
                    Confirm Actually Fixed (+10 pts)
                  </NeumorphicButton>
                )}
            </div>
          </NeumorphicCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
