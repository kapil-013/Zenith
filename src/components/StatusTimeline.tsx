import React, { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Activity, Clock, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface StatusUpdate {
  id: string;
  status: string;
  note: string;
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
      <h3 className="font-bold flex items-center gap-2 text-lg text-slate-800">
        <Activity className="h-5 w-5 text-blue-500" />
        Status Timeline
      </h3>

      <div className="relative border-l-4 border-blue-100 ml-4 space-y-6 pt-2 pb-2">
        {updates.map((update, idx) => {
          const isLatest = idx === updates.length - 1;
          return (
            <div key={update.id} className="relative pl-8 pr-2">
              <div
                className={`absolute -left-[14px] top-1.5 w-6 h-6 rounded-full border-4 border-[#e9eef5] shadow-sm flex items-center justify-center ${isLatest ? "bg-blue-500" : "bg-slate-400"}`}
              >
                {isLatest && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
              </div>
              <div className={`p-4 rounded-xl ${isLatest ? 'bg-white shadow-[4px_4px_8px_#b8bec5,-4px_-4px_8px_#ffffff]' : 'bg-slate-50 border border-slate-200/60'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`text-sm font-black uppercase tracking-wider ${isLatest ? "text-blue-600" : "text-slate-500"}`}
                  >
                    {update.status}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-medium bg-[#e9eef5] px-2 py-1 rounded-md">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(update.createdAt, { addSuffix: true })}
                  </span>
                </div>
                <p className={`text-sm font-medium ${isLatest ? 'text-slate-800' : 'text-slate-600'}`}>{update.note}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
