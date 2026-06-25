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

export function IssueDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, signInWithGoogle } = useAuth();
  const { addToast } = useToast();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [userActions, setUserActions] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchIssue() {
      if (!id) return;
      const docRef = doc(db, "issues", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setIssue({ id: docSnap.id, ...docSnap.data() } as Issue);
      }

      if (user) {
        const q = query(
          collection(db, "verifications"),
          where("issueId", "==", id),
          where("userId", "==", user.id),
        );
        const verifSnap = await getDocs(q);
        if (!verifSnap.empty) {
          const actions = verifSnap.docs.map(d => ({
            id: d.id,
            ...d.data(),
          } as Verification));
          setUserActions(actions);
        }
      }
      setLoading(false);
    }
    fetchIssue();
  }, [id, user]);

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

      if (type === "verify") {
        const { score, reasons } = calculatePriorityScore({
          ...issue,
          verificationCount: (issue.verificationCount || 0) + 1,
          status: issue.status === "Open" ? "Verified" : issue.status,
        });

        await updateDoc(issueRef, {
          verificationCount: increment(1),
          status: issue.status === "Open" ? "Verified" : issue.status,
          priorityScore: score,
          priorityReasons: reasons,
        });

        // Status update for verified
        if (issue.status === "Open") {
          await addDoc(collection(db, "status_updates"), {
            issueId: issue.id,
            status: "Verified",
            note: "Issue verified by community member.",
            updatedBy: user.id,
            createdAt: Date.now(),
          });
        }
      } else if (type === "dispute") {
        await updateDoc(issueRef, { disputeCount: increment(1) });
      } else if (type === "confirm_resolved") {
        await updateDoc(issueRef, {
          confirmedResolvedCount: increment(1),
          status: "Confirmed",
        });
        await addDoc(collection(db, "status_updates"), {
          issueId: issue.id,
          status: "Confirmed",
          note: "Resolution confirmed by community member.",
          updatedBy: user.id,
          createdAt: Date.now(),
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
      setUserActions(prev => [...prev, newAction]);
      
      setIssue(prev => {
        if (!prev) return prev;
        const newIssue = { ...prev };
        if (type === "verify") {
          const { score, reasons } = calculatePriorityScore({
            ...newIssue,
            verificationCount: (newIssue.verificationCount || 0) + 1,
            status: newIssue.status === "Open" ? "Verified" : newIssue.status,
          });
          newIssue.verificationCount = (newIssue.verificationCount || 0) + 1;
          newIssue.status = newIssue.status === "Open" ? "Verified" : newIssue.status;
          newIssue.priorityScore = score;
          newIssue.priorityReasons = reasons;
        } else if (type === "dispute") {
          newIssue.disputeCount = (newIssue.disputeCount || 0) + 1;
        } else if (type === "confirm_resolved") {
          newIssue.confirmedResolvedCount = (newIssue.confirmedResolvedCount || 0) + 1;
          newIssue.status = "Confirmed";
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
          <NeumorphicCard className="overflow-hidden shadow-[12px_12px_24px_#b8bec5,-12px_-12px_24px_#ffffff]">
            {issue.imageUrl && (
              <div className="w-full h-80 bg-slate-200 relative overflow-hidden group">
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
                  <div className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center text-2xl border-4 border-[#e9eef5]">
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
                    issue.status === "Resolved" || issue.status === "Confirmed"
                      ? "success"
                      : issue.status === "In Progress"
                        ? "info"
                        : issue.status === "Verified"
                          ? "warning"
                          : "default"
                  }
                >
                  Status: {issue.status}
                </NeumorphicBadge>
              </div>

              <h1 className="text-3xl font-bold text-slate-800 leading-tight">
                {issue.title}
              </h1>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-blue-500" />
                  <span className="font-medium">{issue.address}</span>
                </div>
                <div className="hidden sm:block text-slate-300">|</div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="capitalize">{issue.locationType}</span>
                </div>
              </div>

              {issue.status === "Verified" || issue.status === "In Progress" ? (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  This issue is community verified and pending authority
                  resolution.
                </div>
              ) : issue.status === "Confirmed" ? (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Confirmed fixed by residents. Civic impact achieved!
                </div>
              ) : null}

              <div className="bg-[#e9eef5] rounded-xl p-5 shadow-[inset_2px_2px_4px_#b8bec5,inset_-2px_-2px_4px_#ffffff] text-slate-700 leading-relaxed font-medium">
                {issue.description}
              </div>

              <div className="border-t border-slate-200/50 pt-6 space-y-4">
                <h3 className="font-bold flex items-center gap-2 text-lg text-slate-800">
                  <ShieldAlert className="h-5 w-5 text-blue-500" />
                  CivicVision AI Analysis
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Citizen Summary
                    </span>
                    <p className="text-sm font-medium text-slate-800">
                      {issue.citizenSummary}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Suggested Department
                    </span>
                    <p className="text-sm font-medium text-slate-800">
                      {issue.suggestedDepartment}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Risk Assessment
                    </span>
                    <p className="text-sm font-medium text-slate-800">
                      {issue.riskReason}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Recommended Action
                    </span>
                    <p className="text-sm font-medium text-slate-800">
                      {issue.recommendedAction}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200/50 pt-6">
                <StatusTimeline
                  issueId={issue.id}
                  currentStatus={issue.status}
                />
              </div>
            </div>
          </NeumorphicCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <NeumorphicCard className="p-6 text-center hover:shadow-[8px_8px_16px_#b8bec5,-8px_-8px_16px_#ffffff] transition-shadow">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
              Priority Score
            </h3>
            <div className="relative inline-flex items-center justify-center w-32 h-32 rounded-full shadow-[inset_6px_6px_12px_#b8bec5,inset_-6px_-6px_12px_#ffffff] bg-[#e9eef5] mb-4 border-4 border-white/50">
              <span
                className={cn(
                  "text-5xl font-black tracking-tighter",
                  issue.priorityScore >= 81
                    ? "text-red-500"
                    : issue.priorityScore >= 61
                      ? "text-orange-500"
                      : issue.priorityScore >= 31
                        ? "text-amber-500"
                        : "text-green-500",
                )}
              >
                {issue.priorityScore}
              </span>
            </div>

            <div className="space-y-2 mt-4 text-left bg-white/40 p-4 rounded-xl border border-white/60">
              {issue.priorityReasons?.map((reason, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-slate-700 font-medium"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-blue-500 shrink-0" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </NeumorphicCard>

          <NeumorphicCard className="p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Community Action
            </h3>

            <div className="bg-[#e9eef5] p-4 rounded-xl shadow-[inset_2px_2px_4px_#b8bec5,inset_-2px_-2px_4px_#ffffff] mb-6">
              <p className="text-sm font-medium text-slate-700 italic text-center">
                "{issue.verificationQuestion}"
              </p>
            </div>

            <div className="flex justify-between items-center mb-6 px-2 text-center">
              <div className="flex-1">
                <p className="text-2xl font-black text-blue-600">
                  {issue.verificationCount}
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Verifications
                </p>
              </div>
              <div className="w-px h-8 bg-slate-300"></div>
              <div className="flex-1">
                <p className="text-2xl font-black text-red-500">
                  {issue.disputeCount}
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Disputes
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {userActions.some(a => a.type === "verify") && (
                <NeumorphicBadge
                  variant="success"
                  className="w-full justify-center py-2.5 text-sm font-bold"
                >
                  You verified this issue.
                </NeumorphicBadge>
              )}
              {userActions.some(a => a.type === "dispute") && (
                <NeumorphicBadge
                  variant="danger"
                  className="w-full justify-center py-2.5 text-sm font-bold"
                >
                  You disputed this issue.
                </NeumorphicBadge>
              )}
              {userActions.some(a => a.type === "confirm_resolved") && (
                <NeumorphicBadge
                  variant="success"
                  className="w-full justify-center py-2.5 text-sm font-bold"
                >
                  You confirmed resolution.
                </NeumorphicBadge>
              )}

              {!userActions.some(a => a.type === "verify" || a.type === "dispute") && (
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

              {issue.status === "Resolved" && !userActions.some(a => a.type === "confirm_resolved") && (
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
