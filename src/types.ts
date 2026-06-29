export type IssueCategory =
  | "Pothole"
  | "Garbage Overflow"
  | "Water Leakage"
  | "Broken Streetlight"
  | "Sewage Issue"
  | "Road Blockage"
  | "Damaged Infrastructure"
  | "Unsafe Public Area"
  | "Other";
export type IssueSeverity = "Low" | "Medium" | "High" | "Critical";
export type IssueStatus = string;
export type SpamRisk = "Low" | "Medium" | "High";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  role: "citizen" | "department" | "admin" | "super_admin";
  departmentName?: string | null;
  status?: "active" | "disabled";
  points: number; // Legacy points, optionally keep
  badges: string[]; // Legacy, mapping to new
  civicScore?: number;
  trustScore?: number;
  currentLevel?: string;
  currentTitle?: string;
  reputation?: any;
  achievements?: CivicAchievement[];
  statistics?: UserStatistics;
  activityHistory?: any[];
  expertise?: Record<string, CategoryExpertise>;
  impactMetrics?: ImpactMetrics;
  ranking?: {
    overall?: number;
    city?: number;
  };
  preferences?: UserPreferences;
  locality?: string;
  createdAt: number;
  updatedAt?: number;
  lastLoginAt?: number;
}

export interface CivicAchievement {
  id: string;
  badgeId: string;
  name: string;
  description: string;
  iconName: string;
  unlockedAt: number;
}

export interface UserStatistics {
  issuesReported: number;
  issuesVerified: number;
  successfulResolutions: number;
  departmentsAssisted: number;
  estimatedCitizensImpacted: number;
  falseReports?: number;
  rejectedReports?: number;
}

export interface CategoryExpertise {
  contributionCount: number;
  accuracy: number;
  trust: number;
  level: string;
}

export interface ImpactMetrics {
  communitiesHelped: number;
  responseRate?: number;
  verificationAccuracy?: number;
  averageResolutionTimeDays?: number;
  highestPriorityReported?: string;
  currentStreak?: number;
  longestStreak?: number;
}

export interface UserPreferences {
  preferredLanguage?: string;
  notificationPreferences?: Record<string, boolean>;
  privacyPreferences?: {
    publicProfile?: boolean;
    showLocation?: boolean;
    showStats?: boolean;
  };
}

export interface AIInsight {
  id: string;
  type:
    | "operational"
    | "risk"
    | "recommendation"
    | "prediction"
    | "trend"
    | "anomaly"
    | "community"
    | "department"
    | "system";
  title: string;
  summary: string;
  detailedReasoning: string;
  confidence: number;
  priority: "Low" | "Medium" | "High" | "Urgent";
  suggestedAction?: string;
  relatedEntities?: string[]; // IDs of issues, users, etc.
  generatedAt: number;
}

export interface AIExplanation {
  priorityScore: number;
  explanation: string;
  factors: string[];
  confidence: number;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: IssueCategory;
  severity: IssueSeverity;
  confidence: number;
  location: { lat: number; lng: number };
  address: string;
  locationType: string;
  suggestedDepartment: string;
  citizenSummary: string;
  authoritySummary: string;
  riskReason: string;
  spamRisk: SpamRisk;
  verificationQuestion: string;
  recommendedAction: string;
  status: IssueStatus;
  priorityScore: number;
  priorityReasons: string[];
  verificationCount: number;
  disputeCount: number;
  duplicateCount: number;
  confirmedResolvedCount: number;
  duplicateOf: string | null;
  createdBy: string; // userId
  assignedTo: string | null;
  createdAt: number;
  updatedAt: number;
  currentStatus?: string;
  statusHistory?: StatusUpdate[];
  assignedBy?: string | null;
  assignedAt?: number | null;
  estimatedCompletion?: number | null;
  completedAt?: number | null;
  confirmedAt?: number | null;
  closedAt?: number | null;
  progressNotes?: string[];
  attachments?: string[];
  workflowMetadata?: any;
}

export interface Verification {
  id: string;
  issueId: string;
  userId: string;
  type: "verify" | "dispute" | "duplicate" | "confirm_resolved";
  createdAt: number;
}

export interface StatusUpdate {
  id: string;
  issueId: string;
  status: IssueStatus;
  note: string;
  attachments?: string[];
  actorRole?: string;
  updatedBy: string; // userId
  createdAt: number;
}

export type NotificationCategory =
  | "Workflow"
  | "Assignment"
  | "Verification"
  | "Reminder"
  | "System"
  | "Security"
  | "Announcement"
  | "Achievement"
  | "Emergency"
  | "Administrative";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface AppNotification {
  id: string;
  recipientId: string;
  recipientRole?: string;
  type: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  deepLink?: string;
  actorId?: string;
  actorRole?: string;
  metadata?: any;
  createdAt: number;
  readAt?: number | null;
  dismissedAt?: number | null;
  expiresAt?: number | null;
}

export interface AppEvent {
  id?: string;
  type: string;
  timestamp: number;
  actorId?: string;
  actorRole?: string;
  affectedUsers?: string[];
  affectedIssueId?: string;
  departmentId?: string;
  priority?: string;
  metadata?: any;
}

export type RoleRequestStatus = "pending" | "approved" | "rejected";
export type RequestedRole = "department" | "admin";

export interface RoleRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  currentRole: string;
  requestedRole: RequestedRole;
  departmentName: string | null; // required if requestedRole === "department"
  reason: string; // applicant's justification
  status: RoleRequestStatus;
  reviewedBy: string | null; // super admin uid
  reviewerName: string | null;
  reviewNote: string | null;
  createdAt: number;
  updatedAt: number;
  reviewedAt: number | null;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string; // e.g. "role_request_approved", "user_disabled", "admin_created"
  targetUserId: string | null;
  targetEmail: string | null;
  details: Record<string, any>;
  createdAt: number;
}
