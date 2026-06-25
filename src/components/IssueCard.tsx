import React from "react";
import { Link } from "react-router-dom";
import { Issue } from "../types";
import { NeumorphicCard } from "./ui/card";
import { NeumorphicBadge } from "./ui/badge";
import { NeumorphicButton } from "./ui/button";
import { MapPin, Users, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "../lib/utils";

export function IssueCard({ issue, onClick }: { issue: Issue, onClick?: () => void }) {
  const isUrgent = issue.priorityScore >= 81;
  const content = (
    <>
      {isUrgent && (
        <div className="absolute top-0 right-0 bg-[var(--color-civic-danger)] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-lg z-10 shadow-md">
          Urgent
        </div>
      )}
      <div className="relative h-48 w-full bg-[var(--color-civic-surface-inset)] shrink-0 overflow-hidden">
        {issue.imageUrl ? (
          <img
            src={issue.imageUrl}
            alt={issue.title}
            className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-[var(--color-civic-text-muted)] bg-[var(--color-civic-surface-inset)]">
            No Image Available
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <NeumorphicBadge
            variant={
              issue.status === "Resolved" || issue.status === "Confirmed"
                ? "success"
                : issue.status === "In Progress"
                  ? "warning" // department
                  : issue.status === "Verified"
                    ? "primary"
                    : "info"
            }
          >
            {issue.status}
          </NeumorphicBadge>
        </div>
        <div className="absolute bottom-3 left-3 flex gap-2 z-10">
          <NeumorphicBadge
            variant={
              issue.severity === "Critical" || issue.severity === "High"
                ? "danger"
                : issue.severity === "Medium"
                  ? "warning"
                  : "default"
            }
          >
            {issue.category}
          </NeumorphicBadge>
        </div>
      </div>

      <div className={cn("p-5 flex-1 flex flex-col", isUrgent && "border-l-4 border-l-[var(--color-civic-danger)]")}>
        <h3 className="font-bold text-lg text-[var(--color-civic-text-primary)] line-clamp-1 mb-1 leading-tight">
          {issue.title}
        </h3>
        <div className="flex items-start gap-2 text-sm text-[var(--color-civic-text-secondary)] mb-4 font-medium">
          <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="line-clamp-1">
            {issue.address || "Location unavailable"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 mt-auto">
          <div className="flex items-center gap-2 text-sm text-[var(--color-civic-text-primary)] bg-[var(--color-civic-surface-inset)] py-1.5 px-3 rounded-lg shadow-[var(--shadow-neumorphic-inset)]">
            <Users className="h-4 w-4 text-[var(--color-civic-primary)]" />
            <span className="font-bold">
              {issue.verificationCount} <span className="text-[var(--color-civic-text-muted)] font-medium text-xs">verified</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--color-civic-text-primary)] bg-[var(--color-civic-surface-inset)] py-1.5 px-3 rounded-lg shadow-[var(--shadow-neumorphic-inset)]">
            <Clock className="h-4 w-4 text-[var(--color-civic-department)]" />
            <span className="font-bold text-xs">{formatDistanceToNow(issue.createdAt)} <span className="text-[var(--color-civic-text-muted)] font-medium">ago</span></span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[var(--color-civic-border)]/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-civic-text-muted)]">
              Priority
            </span>
            <span
              className={cn(
                "text-lg font-black",
                issue.priorityScore >= 81
                  ? "text-[var(--color-civic-priority-urgent)]"
                  : issue.priorityScore >= 61
                    ? "text-[var(--color-civic-priority-high)]"
                    : issue.priorityScore >= 31
                      ? "text-[var(--color-civic-priority-medium)]"
                      : "text-[var(--color-civic-priority-low)]",
              )}
            >
              {issue.priorityScore}
            </span>
          </div>
          {onClick ? (
            <NeumorphicButton size="sm" variant="secondary" onClick={(e) => { e.preventDefault(); onClick(); }}>
              Details
            </NeumorphicButton>
          ) : (
            <Link to={`/issues/${issue.id}`} onClick={(e) => e.stopPropagation()}>
              <NeumorphicButton size="sm" variant="secondary">
                Details
              </NeumorphicButton>
            </Link>
          )}
        </div>
      </div>
    </>
  );

  return (
    <NeumorphicCard className={`flex flex-col h-full overflow-hidden transform hover:translate-y-[-2px] transition-transform relative p-0 ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      {content}
    </NeumorphicCard>
  );
}
