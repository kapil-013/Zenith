import React, { useState, useEffect } from "react";
import { NeumorphicCard } from "../components/ui/card";
import { NeumorphicButton } from "../components/ui/button";
import { NeumorphicInput } from "../components/ui/input";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ClipboardCheck, CheckCircle, XCircle } from "lucide-react";
import { auth } from "../lib/firebase";
import { isDepartment, isAdminOrSuperAdmin } from "../lib/auth/permissions";
import { RoleRequest } from "../types";

export function RoleRequests() {
  const [pendingRequests, setPendingRequests] = useState<RoleRequest[]>([]);
  const [historyRequests, setHistoryRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<"approve" | "reject" | null>(
    null,
  );
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );
  const [reviewNote, setReviewNote] = useState("");

  const { addToast } = useToast();

  const fetchRequests = async () => {
    try {
      if (!auth.currentUser) return;
      const token = await auth.currentUser.getIdToken();

      const resPending = await fetch("/api/role-requests?status=pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resPending.ok) throw new Error("Failed to fetch pending requests");
      const dataPending = await resPending.json();
      setPendingRequests(dataPending);

      const resHistory = await fetch("/api/role-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resHistory.ok) throw new Error("Failed to fetch all requests");
      const dataHistory = await resHistory.json();
      setHistoryRequests(
        dataHistory.filter((r: RoleRequest) => r.status !== "pending"),
      );
    } catch (e) {
      addToast("Failed to fetch requests", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openModal = (action: "approve" | "reject", requestId: string) => {
    setModalAction(action);
    setSelectedRequestId(requestId);
    setReviewNote("");
    setShowModal(true);
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestId || !modalAction) return;

    if (modalAction === "reject" && reviewNote.length < 5) {
      addToast(
        "Review note must be at least 5 characters for rejection.",
        "error",
      );
      return;
    }

    try {
      if (!auth.currentUser) return;
      const token = await auth.currentUser.getIdToken();

      const res = await fetch(
        `/api/role-requests/${selectedRequestId}/${modalAction}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reviewNote }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      addToast(`Request ${modalAction}d successfully.`, "success");
      setShowModal(false);
      fetchRequests();
    } catch (e: any) {
      addToast(e.message, "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--color-civic-text-primary)] tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-8 w-8 text-[var(--color-civic-admin)]" />
            Role Requests
          </h1>
          <p className="text-[var(--color-civic-text-secondary)] font-medium mt-2">
            Manage citizen applications for elevated roles.
          </p>
        </div>
      </div>

      <NeumorphicCard className="p-0 overflow-hidden shadow-[var(--shadow-neumorphic)] border border-transparent">
        <div className="p-4 border-b border-[var(--color-civic-surface-inset)]">
          <h2 className="font-bold text-[var(--color-civic-text-primary)]">
            Pending Requests
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-civic-surface-inset)] border-b border-[var(--color-civic-surface-inset)]">
                <th className="p-4 font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs">
                  Applicant
                </th>
                <th className="p-4 font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs">
                  Role / Dept
                </th>
                <th className="p-4 font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs">
                  Reason
                </th>
                <th className="p-4 font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs">
                  Submitted
                </th>
                <th className="p-4 font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-[var(--color-civic-text-muted)] font-medium"
                  >
                    No pending requests found.
                  </td>
                </tr>
              ) : (
                pendingRequests.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[var(--color-civic-surface-inset)] last:border-0 hover:bg-[var(--color-civic-surface-inset)]/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-bold text-[var(--color-civic-text-primary)]">
                        {r.userName}
                      </div>
                      <div className="text-xs text-[var(--color-civic-text-secondary)] font-medium">
                        {r.userEmail}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="capitalize font-bold text-[var(--color-civic-text-primary)]">
                        {r.requestedRole}
                      </div>
                      {r.departmentName && (
                        <div className="text-xs text-[var(--color-civic-text-secondary)] font-medium">
                          {r.departmentName}
                        </div>
                      )}
                    </td>
                    <td
                      className="p-4 text-sm text-[var(--color-civic-text-secondary)] font-medium max-w-xs truncate"
                      title={r.reason}
                    >
                      {r.reason}
                    </td>
                    <td className="p-4 text-sm text-[var(--color-civic-text-secondary)] font-medium">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 flex gap-2">
                      <NeumorphicButton
                        size="sm"
                        variant="primary"
                        onClick={() => openModal("approve", r.id)}
                        className="py-1 px-2 font-bold flex gap-1"
                      >
                        <CheckCircle className="h-4 w-4" /> Approve
                      </NeumorphicButton>
                      <NeumorphicButton
                        size="sm"
                        variant="danger"
                        onClick={() => openModal("reject", r.id)}
                        className="py-1 px-2 font-bold flex gap-1"
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </NeumorphicButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </NeumorphicCard>

      <NeumorphicCard className="p-0 overflow-hidden shadow-[var(--shadow-neumorphic)] border border-transparent mt-8">
        <div className="p-4 border-b border-[var(--color-civic-surface-inset)]">
          <h2 className="font-bold text-[var(--color-civic-text-primary)]">
            Review History
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-civic-surface-inset)] border-b border-[var(--color-civic-surface-inset)]">
                <th className="p-4 font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs">
                  Applicant
                </th>
                <th className="p-4 font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs">
                  Role / Dept
                </th>
                <th className="p-4 font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs">
                  Status
                </th>
                <th className="p-4 font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs">
                  Reviewer Note
                </th>
                <th className="p-4 font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs">
                  Reviewed Date
                </th>
              </tr>
            </thead>
            <tbody>
              {historyRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-[var(--color-civic-text-muted)] font-medium"
                  >
                    No request history found.
                  </td>
                </tr>
              ) : (
                historyRequests.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[var(--color-civic-surface-inset)] last:border-0 hover:bg-[var(--color-civic-surface-inset)]/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-bold text-[var(--color-civic-text-primary)]">
                        {r.userName}
                      </div>
                      <div className="text-xs text-[var(--color-civic-text-secondary)] font-medium">
                        {r.userEmail}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="capitalize font-bold text-[var(--color-civic-text-primary)]">
                        {r.requestedRole}
                      </div>
                      {r.departmentName && (
                        <div className="text-xs text-[var(--color-civic-text-secondary)] font-medium">
                          {r.departmentName}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${
                          r.status === "approved"
                            ? "bg-[var(--color-civic-status-confirmed)]/10 text-[var(--color-civic-status-confirmed)] shadow-sm border border-[var(--color-civic-status-confirmed)]/20"
                            : r.status === "rejected"
                              ? "bg-[var(--color-civic-danger)]/10 text-[var(--color-civic-danger)] shadow-sm border border-[var(--color-civic-danger)]/20"
                              : "bg-[var(--color-civic-surface-inset)] text-[var(--color-civic-text-secondary)] shadow-sm border border-transparent"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td
                      className="p-4 text-sm text-[var(--color-civic-text-secondary)] font-medium max-w-xs truncate"
                      title={r.reviewNote || ""}
                    >
                      {r.reviewNote || "-"}
                    </td>
                    <td className="p-4 text-sm text-[var(--color-civic-text-secondary)] font-medium">
                      {r.reviewedAt
                        ? new Date(r.reviewedAt).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </NeumorphicCard>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--color-civic-text-primary)]/40 backdrop-blur-sm">
          <NeumorphicCard className="w-full max-w-md p-6 shadow-[var(--shadow-neumorphic-floating)]">
            <h2 className="text-xl font-extrabold mb-4 text-[var(--color-civic-text-primary)] tracking-tight">
              {modalAction === "approve" ? "Approve Request" : "Reject Request"}
            </h2>
            <form onSubmit={handleAction} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--color-civic-text-secondary)] mb-1">
                  Review Note{" "}
                  {modalAction === "reject" ? "(Required)" : "(Optional)"}
                </label>
                <textarea
                  required={modalAction === "reject"}
                  minLength={modalAction === "reject" ? 5 : 0}
                  className="w-full bg-[var(--color-civic-surface-inset)] shadow-[var(--shadow-neumorphic-inset)] border border-transparent rounded-xl px-4 py-3 text-[var(--color-civic-text-primary)] font-medium focus:outline-none focus:border-[var(--color-civic-primary)]/50 transition-all min-h-[100px] resize-none"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder={
                    modalAction === "reject"
                      ? "Reason for rejection..."
                      : "Add a note..."
                  }
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <NeumorphicButton
                  type="button"
                  onClick={() => setShowModal(false)}
                  variant="ghost"
                >
                  Cancel
                </NeumorphicButton>
                <NeumorphicButton
                  type="submit"
                  variant={modalAction === "approve" ? "primary" : "danger"}
                >
                  {modalAction === "approve" ? "Approve" : "Reject"}
                </NeumorphicButton>
              </div>
            </form>
          </NeumorphicCard>
        </div>
      )}
    </div>
  );
}
