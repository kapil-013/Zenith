import React, { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { NeumorphicCard } from "../components/ui/card";
import { ScrollText, ChevronDown, ChevronUp } from "lucide-react";
import { AuditLogEntry } from "../types";
import { useToast } from "../context/ToastContext";

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "audit_logs"),
        orderBy("createdAt", "desc"),
        limit(200)
      );
      const snap = await getDocs(q);
      const logsData = snap.docs.map((doc) => doc.data() as AuditLogEntry);
      setLogs(logsData);
    } catch (e: any) {
      console.error("Failed to fetch audit logs", e);
      addToast("Failed to load audit logs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--color-civic-text-primary)] tracking-tight flex items-center gap-2">
            <ScrollText className="h-8 w-8 text-[var(--color-civic-admin)]" />
            Audit Logs
          </h1>
          <p className="text-[var(--color-civic-text-secondary)] font-medium mt-2">
            View system activities and administrative actions.
          </p>
        </div>
      </div>

      <NeumorphicCard className="p-0 overflow-hidden shadow-[var(--shadow-neumorphic)] border border-transparent">
        <div className="p-4 border-b border-[var(--color-civic-surface-inset)]">
          <h2 className="font-bold text-[var(--color-civic-text-primary)]">System Activity (Last 200)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-civic-surface-inset)] border-b border-[var(--color-civic-surface-inset)]">
                <th className="p-4 font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs">Timestamp</th>
                <th className="p-4 font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs">Actor</th>
                <th className="p-4 font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs">Action</th>
                <th className="p-4 font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs">Target</th>
                <th className="p-4 font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs w-24">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[var(--color-civic-text-muted)] font-medium">
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[var(--color-civic-text-muted)] font-medium">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="border-b border-[var(--color-civic-surface-inset)] last:border-0 hover:bg-[var(--color-civic-surface-inset)]/50 transition-colors">
                      <td className="p-4 text-sm text-[var(--color-civic-text-secondary)] font-medium">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-[var(--color-civic-text-primary)]">{log.actorName}</div>
                        <div className="text-xs text-[var(--color-civic-text-secondary)] font-medium capitalize">
                          {log.actorRole.replace("_", " ")}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex px-2 py-1 rounded-md text-xs font-bold bg-[var(--color-civic-surface-inset)] text-[var(--color-civic-text-primary)] shadow-sm">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4">
                        {log.targetEmail ? (
                          <div className="text-sm font-medium text-[var(--color-civic-text-primary)]">
                            {log.targetEmail}
                          </div>
                        ) : (
                          <div className="text-sm text-[var(--color-civic-text-muted)] font-medium">-</div>
                        )}
                      </td>
                      <td className="p-4">
                        {Object.keys(log.details || {}).length > 0 ? (
                          <button
                            onClick={() => toggleRow(log.id)}
                            className="flex items-center gap-1 text-[var(--color-civic-primary)] hover:text-blue-600 transition-colors font-bold text-sm"
                          >
                            {expandedRow === log.id ? "Hide" : "View"}
                            {expandedRow === log.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        ) : (
                          <span className="text-[var(--color-civic-text-muted)] text-sm">-</span>
                        )}
                      </td>
                    </tr>
                    {expandedRow === log.id && Object.keys(log.details || {}).length > 0 && (
                      <tr className="bg-[var(--color-civic-surface-inset)]/30 border-b border-[var(--color-civic-surface-inset)]">
                        <td colSpan={5} className="p-4">
                          <div className="bg-[var(--color-civic-background)] rounded-lg p-4 shadow-[var(--shadow-neumorphic-inset)] text-sm">
                            <h4 className="font-bold text-[var(--color-civic-text-primary)] mb-2 text-xs uppercase tracking-wider">Action Details</h4>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                              {Object.entries(log.details).map(([key, value]) => (
                                <div key={key} className="flex flex-col">
                                  <dt className="text-xs font-bold text-[var(--color-civic-text-muted)] uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</dt>
                                  <dd className="text-sm font-medium text-[var(--color-civic-text-secondary)] break-words">
                                    {value === null ? "null" : typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </NeumorphicCard>
    </div>
  );
}
