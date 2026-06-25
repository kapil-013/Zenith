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
export type IssueStatus =
  | "Open"
  | "Verified"
  | "In Progress"
  | "Resolved"
  | "Confirmed";
export type SpamRisk = "Low" | "Medium" | "High";

export interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  role: "citizen" | "department" | "admin";
  departmentName?: string | null;
  status?: "active" | "disabled";
  points: number;
  badges: string[];
  createdAt: number;
  updatedAt?: number;
  lastLoginAt?: number;
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
  updatedBy: string; // userId
  createdAt: number;
}
