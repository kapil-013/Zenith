import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Issue, Verification } from "../types";
import { useAuth } from "../context/AuthContext";

export function useUserStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    points: 0,
    reportsSubmitted: 0,
    issuesVerified: 0,
    resolvedImpact: 0,
    badges: ["First Reporter"],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setStats({
        points: 0,
        reportsSubmitted: 0,
        issuesVerified: 0,
        resolvedImpact: 0,
        badges: ["First Reporter"],
      });
      setLoading(false);
      return;
    }

    setLoading(true);

    const issuesQ = query(
      collection(db, "issues"),
      where("createdBy", "==", user.id)
    );
    const verificationsQ = query(
      collection(db, "verifications"),
      where("userId", "==", user.id)
    );

    let userIssues: Issue[] = [];
    let userVerifications: Verification[] = [];

    const calculate = () => {
      let points = 0;
      let reportsSubmitted = userIssues.length;
      let issuesVerified = 0;
      let resolvedImpact = 0;
      let confirmResolvedCount = 0;
      let highlyDisputedCount = 0;

      points += reportsSubmitted * 10;

      for (const issue of userIssues) {
        if (issue.verificationCount) {
          points += issue.verificationCount * 5;
        }
        if (issue.status === "Resolved" || issue.status === "Confirmed") {
          points += 15;
          resolvedImpact++;
        }
        if (issue.disputeCount && issue.disputeCount >= 3) {
          points -= 10;
          highlyDisputedCount++;
        }
      }

      for (const v of userVerifications) {
        if (v.type === "verify") {
          points += 3;
          issuesVerified++;
        } else if (v.type === "confirm_resolved") {
          points += 10;
          confirmResolvedCount++;
        }
      }

      const badges = new Set<string>();
      if (reportsSubmitted > 0) badges.add("First Reporter");
      if (issuesVerified >= 3) badges.add("Trusted Verifier");
      if (points >= 100) badges.add("Local Hero");
      if (resolvedImpact >= 1) badges.add("Resolution Champion");
      if (confirmResolvedCount >= 1 && issuesVerified >= 5)
        badges.add("Civic Guardian");

      setStats({
        points: Math.max(0, points),
        reportsSubmitted,
        issuesVerified,
        resolvedImpact,
        badges: Array.from(badges).length > 0 ? Array.from(badges) : ["First Reporter"],
      });
      setLoading(false);
    };

    const unsubIssues = onSnapshot(issuesQ, (snap) => {
      userIssues = snap.docs.map(d => d.data() as Issue);
      calculate();
    });

    const unsubVerifications = onSnapshot(verificationsQ, (snap) => {
      userVerifications = snap.docs.map(d => d.data() as Verification);
      calculate();
    });

    return () => {
      unsubIssues();
      unsubVerifications();
    };
  }, [user]);

  return { stats, loading };
}
