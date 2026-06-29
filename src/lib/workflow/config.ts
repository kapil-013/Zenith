import { UserRole } from "../auth/permissions";

export type WorkflowStatusId =
  | "Open" // Legacy
  | "Verified" // Legacy
  | "In Progress" // Legacy
  | "Confirmed" // Legacy
  | "Reported"
  | "AI Reviewed"
  | "Community Verified"
  | "Assigned to Department"
  | "Inspection Scheduled"
  | "Inspection Completed"
  | "Work Started"
  | "Work In Progress"
  | "Temporary Fix Applied"
  | "Work Completed"
  | "Waiting for Citizen Confirmation"
  | "Resolved"
  | "Closed"
  | "Rejected"
  | "Duplicate Report"
  | "Invalid Report"
  | "Need More Information"
  | "Escalated"
  | "Reopened";

export interface WorkflowTransitionRule {
  nextStatus: WorkflowStatusId;
  allowedRoles: UserRole[];
  requiresEvidence?: boolean;
  requiresNotes?: boolean;
  requiresCitizenConfirmation?: boolean;
  triggerNotification?: boolean;
  createTimelineEntry?: boolean;
}

export interface WorkflowStatusConfig {
  id: WorkflowStatusId;
  displayName: string;
  transitions: WorkflowTransitionRule[];
  isTerminal?: boolean;
}

export const WORKFLOW_CONFIG: Record<string, WorkflowStatusConfig> = {
  "Reported": {
    id: "Reported",
    displayName: "Reported",
    transitions: [
      { nextStatus: "AI Reviewed", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], createTimelineEntry: true },
      { nextStatus: "Rejected", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], requiresNotes: true, createTimelineEntry: true },
      { nextStatus: "Duplicate Report", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], requiresNotes: true, createTimelineEntry: true },
      { nextStatus: "Invalid Report", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], requiresNotes: true, createTimelineEntry: true }
    ]
  },
  "Open": {
    id: "Open",
    displayName: "Open (Legacy)",
    transitions: [
      { nextStatus: "Assigned to Department", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], createTimelineEntry: true },
      { nextStatus: "Community Verified", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], createTimelineEntry: true },
    ]
  },
  "AI Reviewed": {
    id: "AI Reviewed",
    displayName: "AI Reviewed",
    transitions: [
      { nextStatus: "Community Verified", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], createTimelineEntry: true },
      { nextStatus: "Assigned to Department", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], createTimelineEntry: true },
      { nextStatus: "Need More Information", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], requiresNotes: true, createTimelineEntry: true }
    ]
  },
  "Community Verified": {
    id: "Community Verified",
    displayName: "Community Verified",
    transitions: [
      { nextStatus: "Assigned to Department", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], createTimelineEntry: true },
      { nextStatus: "Escalated", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], requiresNotes: true, createTimelineEntry: true }
    ]
  },
  "Verified": {
    id: "Verified",
    displayName: "Verified (Legacy)",
    transitions: [
      { nextStatus: "Assigned to Department", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], createTimelineEntry: true },
    ]
  },
  "Assigned to Department": {
    id: "Assigned to Department",
    displayName: "Assigned to Department",
    transitions: [
      { nextStatus: "Inspection Scheduled", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT], createTimelineEntry: true },
      { nextStatus: "Work Started", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT], createTimelineEntry: true },
      { nextStatus: "Assigned to Department", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], requiresNotes: true, createTimelineEntry: true } // Reassign
    ]
  },
  "Inspection Scheduled": {
    id: "Inspection Scheduled",
    displayName: "Inspection Scheduled",
    transitions: [
      { nextStatus: "Inspection Completed", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT], requiresNotes: true, requiresEvidence: false, createTimelineEntry: true }
    ]
  },
  "Inspection Completed": {
    id: "Inspection Completed",
    displayName: "Inspection Completed",
    transitions: [
      { nextStatus: "Work Started", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT], createTimelineEntry: true },
      { nextStatus: "Escalated", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT], requiresNotes: true, createTimelineEntry: true },
      { nextStatus: "Need More Information", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT], requiresNotes: true, createTimelineEntry: true }
    ]
  },
  "Work Started": {
    id: "Work Started",
    displayName: "Work Started",
    transitions: [
      { nextStatus: "Work In Progress", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT], createTimelineEntry: true },
      { nextStatus: "Temporary Fix Applied", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT], requiresNotes: true, createTimelineEntry: true }
    ]
  },
  "Work In Progress": {
    id: "Work In Progress",
    displayName: "Work In Progress",
    transitions: [
      { nextStatus: "Work Completed", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT], requiresNotes: true, requiresEvidence: false, createTimelineEntry: true },
      { nextStatus: "Temporary Fix Applied", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT], requiresNotes: true, createTimelineEntry: true }
    ]
  },
  "In Progress": {
    id: "In Progress",
    displayName: "In Progress (Legacy)",
    transitions: [
      { nextStatus: "Work Completed", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT], createTimelineEntry: true },
    ]
  },
  "Temporary Fix Applied": {
    id: "Temporary Fix Applied",
    displayName: "Temporary Fix Applied",
    transitions: [
      { nextStatus: "Work In Progress", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT], createTimelineEntry: true },
      { nextStatus: "Work Completed", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT], requiresNotes: true, createTimelineEntry: true }
    ]
  },
  "Work Completed": {
    id: "Work Completed",
    displayName: "Work Completed",
    transitions: [
      { nextStatus: "Waiting for Citizen Confirmation", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT, UserRole.ADMIN], createTimelineEntry: true },
      { nextStatus: "Resolved", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], createTimelineEntry: true }
    ]
  },
  "Waiting for Citizen Confirmation": {
    id: "Waiting for Citizen Confirmation",
    displayName: "Waiting for Citizen Confirmation",
    transitions: [
      { nextStatus: "Resolved", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.CITIZEN, UserRole.ADMIN], createTimelineEntry: true },
      { nextStatus: "Reopened", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.CITIZEN, UserRole.ADMIN], requiresNotes: true, createTimelineEntry: true }
    ]
  },
  "Resolved": {
    id: "Resolved",
    displayName: "Resolved",
    transitions: [
      { nextStatus: "Closed", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CITIZEN], createTimelineEntry: true },
      { nextStatus: "Reopened", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], requiresNotes: true, createTimelineEntry: true }
    ]
  },
  "Confirmed": {
    id: "Confirmed",
    displayName: "Confirmed (Legacy)",
    transitions: [
      { nextStatus: "Closed", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], createTimelineEntry: true }
    ]
  },
  "Closed": {
    id: "Closed",
    displayName: "Closed",
    isTerminal: true,
    transitions: []
  },
  "Rejected": {
    id: "Rejected",
    displayName: "Rejected",
    isTerminal: true,
    transitions: []
  },
  "Duplicate Report": {
    id: "Duplicate Report",
    displayName: "Duplicate Report",
    isTerminal: true,
    transitions: []
  },
  "Invalid Report": {
    id: "Invalid Report",
    displayName: "Invalid Report",
    isTerminal: true,
    transitions: []
  },
  "Need More Information": {
    id: "Need More Information",
    displayName: "Need More Information",
    transitions: [
      { nextStatus: "Reported", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], createTimelineEntry: true },
      { nextStatus: "Work In Progress", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT], createTimelineEntry: true }
    ]
  },
  "Escalated": {
    id: "Escalated",
    displayName: "Escalated",
    transitions: [
      { nextStatus: "Assigned to Department", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], createTimelineEntry: true },
      { nextStatus: "Work In Progress", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT], createTimelineEntry: true }
    ]
  },
  "Reopened": {
    id: "Reopened",
    displayName: "Reopened",
    transitions: [
      { nextStatus: "Work In Progress", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT, UserRole.ADMIN], createTimelineEntry: true },
      { nextStatus: "Assigned to Department", allowedRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], createTimelineEntry: true }
    ]
  }
};

export function getAllowedTransitions(currentStatus: string, userRole: UserRole): WorkflowTransitionRule[] {
  const config = WORKFLOW_CONFIG[currentStatus];
  if (!config) return [];
  
  return config.transitions.filter(t => t.allowedRoles.includes(userRole));
}

export function canTransition(currentStatus: string, nextStatus: string, userRole: UserRole): boolean {
  const transitions = getAllowedTransitions(currentStatus, userRole);
  return transitions.some(t => t.nextStatus === nextStatus);
}

export function getTransitionRule(currentStatus: string, nextStatus: string, userRole: UserRole): WorkflowTransitionRule | undefined {
  const transitions = getAllowedTransitions(currentStatus, userRole);
  return transitions.find(t => t.nextStatus === nextStatus);
}
