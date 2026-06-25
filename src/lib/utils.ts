import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculatePriorityScore(issue: any): {
  score: number;
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];

  // Severity
  if (issue.severity === "Critical") {
    score += 45;
    reasons.push("Critical severity");
  } else if (issue.severity === "High") {
    score += 35;
    reasons.push("High severity");
  } else if (issue.severity === "Medium") {
    score += 20;
    reasons.push("Medium severity");
  } else {
    score += 10;
    reasons.push("Low severity");
  }

  // Verifications
  const vCount = issue.verificationCount || 0;
  if (vCount > 0) {
    const vScore = Math.min(25, vCount * 2);
    score += vScore;
    reasons.push(
      `${vCount} citizen${vCount > 1 ? "s" : ""} verified this issue`,
    );
  }

  // Pending for > 3 days
  const createdAt = issue.createdAt;
  if (createdAt) {
    const createdDate = createdAt.toDate
      ? createdAt.toDate()
      : new Date(createdAt);
    const daysOpen =
      (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysOpen > 3 && !["Resolved", "Confirmed"].includes(issue.status)) {
      score += 10;
      reasons.push("Pending for more than 3 days");
    }
  }

  // Location Type
  const highFootfall = [
    "school",
    "hospital",
    "market",
    "bus stop",
    "high-footfall area",
  ];
  if (highFootfall.includes(issue.locationType?.toLowerCase())) {
    score += 15;
    reasons.push(`Located near a ${issue.locationType.toLowerCase()}`);
  }

  // Duplicate count
  if (issue.duplicateCount > 0) {
    score += 10;
    reasons.push("Has duplicate reports");
  }

  // Spam Risk
  if (issue.spamRisk === "High") {
    score -= 20;
    reasons.push("High spam risk");
  } else if (issue.spamRisk === "Medium") {
    score -= 10;
    reasons.push("Medium spam risk");
  } else if (issue.spamRisk === "Low") {
    score += 5;
    reasons.push("Low spam risk");
  }

  score = Math.max(0, Math.min(100, Math.floor(score)));

  return { score, reasons };
}
