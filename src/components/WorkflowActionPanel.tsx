import React, { useState, useRef } from "react";
import { UserRole } from "../lib/auth/permissions";
import { getAllowedTransitions, WorkflowTransitionRule } from "../lib/workflow/config";
import { NeumorphicCard } from "./ui/card";
import { NeumorphicButton } from "./ui/button";
import { Activity, Camera, Upload, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { IssueStatus } from "../types";

interface WorkflowActionPanelProps {
  issueId: string;
  currentStatus: IssueStatus;
  onTransition: (nextStatus: string, note: string, attachments: string[]) => Promise<void>;
  loading: boolean;
}

export function WorkflowActionPanel({ issueId, currentStatus, onTransition, loading }: WorkflowActionPanelProps) {
  const { role } = useAuth();
  const [selectedTransition, setSelectedTransition] = useState<WorkflowTransitionRule | null>(null);
  const [note, setNote] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  
  const allowedTransitions = getAllowedTransitions(currentStatus || "Open", (role as UserRole) || UserRole.GUEST);

  if (!allowedTransitions || allowedTransitions.length === 0) {
    return null;
  }

  const handleAddEvidence = () => {
    if (evidenceUrl.trim()) {
      setAttachments([...attachments, evidenceUrl.trim()]);
      setEvidenceUrl("");
    }
  };

  const handleRemoveEvidence = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedTransition) return;
    if (selectedTransition.requiresNotes && !note.trim()) {
      return; // Validation handled by disabled state, but just in case
    }
    if (selectedTransition.requiresEvidence && attachments.length === 0) {
      return;
    }
    
    await onTransition(selectedTransition.nextStatus, note.trim(), attachments);
    setSelectedTransition(null);
    setNote("");
    setAttachments([]);
  };

  return (
    <NeumorphicCard className="p-6 border-t-4 border-[var(--color-civic-primary)] mt-6">
      <h3 className="font-extrabold flex items-center gap-2 text-lg text-[var(--color-civic-text-primary)] tracking-tight mb-4">
        <Activity className="h-5 w-5 text-[var(--color-civic-primary)]" />
        Update Status
      </h3>
      
      {!selectedTransition ? (
        <div className="flex flex-col gap-3">
          {allowedTransitions.map(t => (
            <NeumorphicButton 
              key={t.nextStatus}
              variant="primary"
              className="w-full justify-start"
              onClick={() => setSelectedTransition(t)}
            >
              Change status to: {t.nextStatus}
            </NeumorphicButton>
          ))}
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-[var(--color-civic-surface-inset)] p-4 rounded-xl shadow-[var(--shadow-neumorphic-inset)] border border-transparent">
            <h4 className="font-bold text-[var(--color-civic-text-primary)] mb-2 text-sm uppercase tracking-widest">
              Moving to: <span className="text-[var(--color-civic-primary)]">{selectedTransition.nextStatus}</span>
            </h4>
            
            {(selectedTransition.requiresNotes || note || true) && (
              <div className="mt-4 space-y-2">
                <label className="text-xs font-bold text-[var(--color-civic-text-secondary)]">
                  Progress Note {selectedTransition.requiresNotes && <span className="text-[var(--color-civic-danger)]">*</span>}
                </label>
                <textarea
                  className="w-full bg-[var(--color-civic-surface)] rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-civic-primary)] text-[var(--color-civic-text-primary)] shadow-[var(--shadow-neumorphic-inset)] resize-none"
                  rows={3}
                  placeholder="Enter details about this update..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            )}
            
            <div className="mt-4 space-y-2">
              <label className="text-xs font-bold text-[var(--color-civic-text-secondary)]">
                Evidence / Attachments {selectedTransition.requiresEvidence && <span className="text-[var(--color-civic-danger)]">*</span>}
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  className="flex-1 bg-[var(--color-civic-surface)] rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-civic-primary)] text-[var(--color-civic-text-primary)] shadow-[var(--shadow-neumorphic-inset)]"
                  placeholder="Paste image URL..."
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddEvidence()}
                />
                <NeumorphicButton size="sm" variant="primary" onClick={handleAddEvidence} type="button">
                  <Upload className="w-4 h-4" />
                </NeumorphicButton>
              </div>
              
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {attachments.map((url, i) => (
                    <div key={i} className="relative group w-16 h-16 rounded-md overflow-hidden shadow-sm border border-[var(--color-civic-border)]">
                      <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => handleRemoveEvidence(i)}
                        className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {(selectedTransition.requiresNotes && !note.trim()) && (
               <p className="text-xs text-[var(--color-civic-danger)] mt-2 font-medium flex items-center gap-1">
                 <AlertCircle className="w-3 h-3" /> A note is required for this status change.
               </p>
            )}
            {(selectedTransition.requiresEvidence && attachments.length === 0) && (
               <p className="text-xs text-[var(--color-civic-danger)] mt-2 font-medium flex items-center gap-1">
                 <AlertCircle className="w-3 h-3" /> Evidence is required for this status change.
               </p>
            )}
          </div>
          
          <div className="flex gap-3">
            <NeumorphicButton 
              className="flex-1"
              variant="default" 
              onClick={() => setSelectedTransition(null)}
              disabled={loading}
            >
              Cancel
            </NeumorphicButton>
            <NeumorphicButton 
              className="flex-1"
              variant="primary" 
              onClick={handleSubmit}
              disabled={
                loading || 
                (selectedTransition.requiresNotes && !note.trim()) || 
                (selectedTransition.requiresEvidence && attachments.length === 0)
              }
            >
              {loading ? "Updating..." : "Confirm Update"}
            </NeumorphicButton>
          </div>
        </div>
      )}
    </NeumorphicCard>
  );
}
