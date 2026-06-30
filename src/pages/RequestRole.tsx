import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { NeumorphicCard } from "../components/ui/card";
import { NeumorphicButton } from "../components/ui/button";
import {
  Briefcase,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  addDoc
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { RoleRequest } from "../types";
import { isCitizen } from "../lib/auth/permissions";
import { Link } from "react-router-dom";

export function RequestRole() {
  const { user, role } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recentRequest, setRecentRequest] = useState<RoleRequest | null>(null);

  const [departmentName, setDepartmentName] = useState("");
  const [reason, setReason] = useState("");

  const fetchRequests = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const q = query(
        collection(db, "roleRequests"),
        where("userId", "==", user.id),
        orderBy("createdAt", "desc"),
        limit(1),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setRecentRequest(snap.docs[0].data() as RoleRequest);
      } else {
        setRecentRequest(null);
      }
    } catch (e) {
      console.error("Error fetching requests:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentName) {
      addToast("Please select a department.", "error");
      return;
    }
    if (reason.length < 20) {
      addToast("Please provide a reason with at least 20 characters.", "error");
      return;
    }

    if (!user || !auth.currentUser) return;

    try {
      setSubmitting(true);
      
      const newRequest: Omit<RoleRequest, "id"> = {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        currentRole: user.role,
        requestedRole: "department",
        departmentName,
        reason,
        status: "pending",
        reviewedBy: null,
        reviewerName: null,
        reviewNote: null,
        reviewedAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await addDoc(collection(db, "roleRequests"), newRequest);

      addToast("Request submitted for review", "success");
      setDepartmentName("");
      setReason("");
      fetchRequests();
    } catch (e: any) {
      addToast(e.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <NeumorphicCard className="p-8">
          <div className="flex flex-col items-center justify-center py-12 text-[var(--color-civic-text-muted)] animate-pulse">
            <div className="w-12 h-12 rounded-full border-4 border-[var(--color-civic-primary)] border-t-transparent animate-spin mb-4" />
            <p className="font-bold text-sm tracking-widest uppercase">
              Loading Request Status...
            </p>
          </div>
        </NeumorphicCard>
      </div>
    );
  }

  // Only allow citizens
  if (role && !isCitizen(role)) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <NeumorphicCard className="p-12 text-center border-t-4 border-[var(--color-civic-primary)]">
            <div className="mx-auto w-16 h-16 bg-[var(--color-civic-surface-inset)] rounded-full shadow-[var(--shadow-neumorphic-inset)] flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-[var(--color-civic-primary)]" />
            </div>
            <h2 className="text-2xl font-black text-[var(--color-civic-text-primary)] mb-2">
              You already have elevated access on this platform.
            </h2>
            <p className="text-[var(--color-civic-text-secondary)] mb-8 font-medium">
              Your current role ({role}) gives you specialized access to
              Community Hero.
            </p>
            <Link to={role === "department" ? "/department" : "/admin"}>
              <NeumorphicButton variant="primary">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </NeumorphicButton>
            </Link>
          </NeumorphicCard>
        </motion.div>
      </div>
    );
  }

  const isPending = recentRequest?.status === "pending";
  const isApproved = recentRequest?.status === "approved";
  const isRejected = recentRequest?.status === "rejected";

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-black text-[var(--color-civic-text-primary)] tracking-tight flex items-center gap-3">
          <Briefcase className="w-8 h-8 text-[var(--color-civic-primary)]" />
          Department Role Application
        </h1>
        <p className="text-[var(--color-civic-text-secondary)] mt-2 font-medium max-w-xl">
          Want to help run a department like Sanitation or Road Maintenance?
          Apply for official access to manage and resolve civic issues.
        </p>
      </motion.div>

      <AnimatePresence mode="popLayout">
        {isPending && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <NeumorphicCard className="p-8 border-l-4 border-blue-500">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-full shadow-[var(--shadow-neumorphic-inset)]">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-civic-text-primary)] mb-1">
                    Application Under Review
                  </h3>
                  <p className="text-[var(--color-civic-text-secondary)] font-medium">
                    Your request to manage{" "}
                    <span className="font-bold text-[var(--color-civic-primary)]">
                      {recentRequest.departmentName}
                    </span>{" "}
                    is pending review.
                  </p>
                  <div className="text-sm text-[var(--color-civic-text-muted)] mt-2">
                    Submitted on{" "}
                    {new Date(recentRequest.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </NeumorphicCard>
          </motion.div>
        )}

        {isApproved && (
          <motion.div
            key="approved"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <NeumorphicCard className="p-8 border-l-4 border-green-500">
              <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                <div className="p-4 bg-green-100 rounded-full shadow-[var(--shadow-neumorphic-inset)] flex-shrink-0">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-[var(--color-civic-text-primary)] mb-2">
                    Application Approved
                  </h3>
                  <p className="text-[var(--color-civic-text-secondary)] font-medium">
                    You're approved as a Department Official for{" "}
                    <span className="font-bold text-[var(--color-civic-primary)]">
                      {recentRequest.departmentName}
                    </span>
                    .
                  </p>
                </div>
                <div className="mt-4 md:mt-0 flex-shrink-0">
                  <Link to="/department">
                    <NeumorphicButton variant="primary">
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </NeumorphicButton>
                  </Link>
                </div>
              </div>
            </NeumorphicCard>
          </motion.div>
        )}

        {isRejected && (
          <motion.div
            key="rejected"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <NeumorphicCard className="p-6 mb-8 border-l-4 border-red-500 bg-red-50/50">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-red-800 mb-1">
                    Previous Request Declined
                  </h3>
                  <p className="text-sm text-red-700 font-medium">
                    {recentRequest.reviewNote ||
                      "Your application was not approved at this time."}
                  </p>
                  <p className="text-xs text-red-600/70 mt-2">
                    You may submit a new application below.
                  </p>
                </div>
              </div>
            </NeumorphicCard>
          </motion.div>
        )}

        {(!recentRequest || isRejected) && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <NeumorphicCard className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[var(--color-civic-text-secondary)] mb-2">
                    Which department would you like to manage?
                  </label>
                  <select
                    required
                    className="w-full bg-[var(--color-civic-surface-inset)] shadow-[var(--shadow-neumorphic-inset)] border border-transparent rounded-xl px-4 py-3 text-[var(--color-civic-text-primary)] font-medium focus:outline-none focus:border-[var(--color-civic-primary)]/50 transition-all appearance-none"
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                  >
                    <option value="">Select Department...</option>
                    <option value="Road Maintenance">Road Maintenance</option>
                    <option value="Sanitation Department">
                      Sanitation Department
                    </option>
                    <option value="Water Board">Water Board</option>
                    <option value="Electrical Maintenance">
                      Electrical Maintenance
                    </option>
                    <option value="Drainage Department">
                      Drainage Department
                    </option>
                    <option value="Public Works">Public Works</option>
                    <option value="Traffic Management">
                      Traffic Management
                    </option>
                    <option value="Community Volunteers">
                      Community Volunteers
                    </option>
                    <option value="General Civic Helpdesk">
                      General Civic Helpdesk
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--color-civic-text-secondary)] mb-2">
                    Why should you manage this department?
                  </label>
                  <textarea
                    required
                    minLength={20}
                    placeholder="Briefly explain your role, qualification, or intent to help resolve civic issues..."
                    className="w-full bg-[var(--color-civic-surface-inset)] shadow-[var(--shadow-neumorphic-inset)] border border-transparent rounded-xl px-4 py-3 text-[var(--color-civic-text-primary)] font-medium focus:outline-none focus:border-[var(--color-civic-primary)]/50 transition-all min-h-[120px] resize-none"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-[var(--color-civic-text-muted)] font-medium">
                      Minimum 20 characters
                    </p>
                    <span
                      className={`text-xs font-bold ${reason.length < 20 ? "text-[var(--color-civic-danger)]" : "text-green-500"}`}
                    >
                      {reason.length} / 20
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--color-civic-border)]">
                  <NeumorphicButton
                    type="submit"
                    variant="primary"
                    className="w-full justify-center"
                    disabled={
                      submitting || reason.length < 20 || !departmentName
                    }
                  >
                    {submitting
                      ? "Submitting Application..."
                      : "Submit Application"}
                    {!submitting && <ArrowRight className="w-4 h-4 ml-2" />}
                  </NeumorphicButton>
                </div>
              </form>
            </NeumorphicCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
