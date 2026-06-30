import React, { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Activity, Clock, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface StatusUpdate {
  id: string;
  status: string;
  note: string;
  attachments?: string[];
  actorRole?: string;
  updatedBy: string;
  createdAt: number;
}

const statusOrder = [
  "Open",
  "Verified",
  "In Progress",
  "Resolved",
  "Confirmed",
];

export function StatusTimeline({
  issueId,
  currentStatus,
}: {
  issueId: string;
  currentStatus: string;
}) {
  const [updates, setUpdates] = useState<StatusUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUpdates() {
      try {
        const q = query(
          collection(db, "status_updates"),
          where("issueId", "==", issueId),
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as StatusUpdate,
        );
        data.sort((a, b) => a.createdAt - b.createdAt);
        setUpdates(data);
      } catch (error) {
        console.error("Failed to fetch status updates", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUpdates();
  }, [issueId]);

  if (loading)
    return (
      <div className="text-sm text-slate-500 animate-pulse">
        Loading timeline...
      </div>
    );
  if (updates.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-extrabold flex items-center gap-2 text-lg text-[var(--color-civic-text-primary)] tracking-tight">
        <Activity className="h-5 w-5 text-[var(--color-civic-primary)]" />
        Status Timeline
      </h3>

      <div className="relative border-l-4 border-[var(--color-civic-surface-inset)] ml-4 space-y-6 pt-2 pb-2">
        {updates.map((update, idx) => {
          const isLatest = idx === updates.length - 1;
          return (
            <div key={update.id} className="relative pl-8 pr-2">
              <div
                className={`absolute -left-[14px] top-1.5 w-6 h-6 rounded-full border-4 border-[var(--color-civic-surface)] shadow-[var(--shadow-neumorphic)] flex items-center justify-center ${isLatest ? "bg-[var(--color-civic-primary)]" : "bg-[var(--color-civic-text-muted)]"}`}
              >
                {isLatest && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
              </div>
              <div className={`p-4 rounded-xl ${isLatest ? 'bg-[var(--color-civic-surface)] shadow-[var(--shadow-neumorphic)]' : 'bg-[var(--color-civic-surface-inset)] border border-transparent shadow-[var(--shadow-neumorphic-inset)]'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span
                      className={`text-sm font-black uppercase tracking-widest ${isLatest ? "text-[var(--color-civic-primary)]" : "text-[var(--color-civic-text-secondary)]"}`}
                    >
                      {update.status}
                    </span>
                    {update.actorRole && (
                      <span className="text-[10px] font-bold text-[var(--color-civic-text-muted)] uppercase mt-0.5">
                        by {update.actorRole}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--color-civic-text-muted)] flex items-center gap-1 font-bold bg-[var(--color-civic-surface)] shadow-sm px-2 py-1 rounded-md shrink-0">
                    <Clock className="h-3 w-3" />
                    {update.createdAt ? formatDistanceToNow((update as any).createdAt?.toDate ? (update as any).createdAt.toDate() : update.createdAt, { addSuffix: true }) : "Recently"}
                  </span>
                </div>
                {update.note && <p className={`text-sm font-medium mt-2 ${isLatest ? 'text-[var(--color-civic-text-primary)]' : 'text-[var(--color-civic-text-secondary)]'}`}>{update.note}</p>}
                {update.attachments && update.attachments.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                    {update.attachments.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="shrink-0 block w-20 h-20 rounded-md overflow-hidden shadow-sm border border-[var(--color-civic-border)] hover:opacity-80 transition-opacity">
                        <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
