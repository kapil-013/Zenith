import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  Issue,
  Verification,
  UserStatistics,
  CivicAchievement,
} from "../types";
import { useAuth } from "../context/AuthContext";
import { ReputationEngine } from "../lib/reputation/engine";

export function useUserStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStatistics>({
    issuesReported: 0,
    issuesVerified: 0,
    successfulResolutions: 0,
    departmentsAssisted: 0,
    estimatedCitizensImpacted: 0,
    falseReports: 0,
    rejectedReports: 0,
  });

  const [civicScore, setCivicScore] = useState(0);
  const [trustScore, setTrustScore] = useState(50);
  const [currentLevel, setCurrentLevel] = useState("New Citizen");
  const [currentTitle, setCurrentTitle] = useState("New Citizen");
  const [achievements, setAchievements] = useState<CivicAchievement[]>([]);
  const [nextLevel, setNextLevel] = useState<{
    name: string;
    minScore: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const issuesQ = query(
      collection(db, "issues"),
      where("createdBy", "==", user.id),
    );
    const verificationsQ = query(
      collection(db, "verifications"),
      where("userId", "==", user.id),
    );
    // Also fetch issues verified by the user to calculate impact

    let userIssues: Issue[] = [];
    let userVerifications: Verification[] = [];

    const calculate = async () => {
      let issuesReported = userIssues.length;
      let issuesVerified = 0;
      let successfulResolutions = 0;
      let falseReports = 0;
      let rejectedReports = 0;
      let estimatedCitizensImpacted = 0;

      for (const issue of userIssues) {
        if (
          issue.status === "Closed" ||
          issue.status === "Resolved" ||
          issue.status === "Confirmed"
        ) {
          successfulResolutions++;
          estimatedCitizensImpacted += (issue.verificationCount || 1) * 5;
        }
        if (issue.disputeCount && issue.disputeCount >= 3) {
          falseReports++;
        }
        if (issue.status === "Rejected" || issue.status === "Duplicate") {
          rejectedReports++;
        }
      }

      for (const v of userVerifications) {
        if (v.type === "verify") {
          issuesVerified++;
          estimatedCitizensImpacted += 2;
        }
      }

      const userStats: UserStatistics = {
        issuesReported,
        issuesVerified,
        successfulResolutions,
        departmentsAssisted: successfulResolutions > 0 ? 1 : 0, // Approx
        estimatedCitizensImpacted,
        falseReports,
        rejectedReports,
      };

      const newCivicScore = ReputationEngine.calculateCivicScore(userStats);
      const newTrustScore = ReputationEngine.calculateTrustScore(userStats);
      const newLevel = ReputationEngine.getLevel(newCivicScore);
      const newTitle = ReputationEngine.generateTitle(
        userStats,
        newCivicScore,
        newTrustScore,
      );
      const nxtLevel = ReputationEngine.getNextLevel(newCivicScore);

      // Load current achievements from user document or evaluate new ones
      const currentAchievements = user.achievements || [];
      const evaluatedAchievements = ReputationEngine.evaluateBadges(
        userStats,
        currentAchievements,
        newTrustScore,
      );

      setStats(userStats);
      setCivicScore(newCivicScore);
      setTrustScore(newTrustScore);
      setCurrentLevel(newLevel);
      setCurrentTitle(newTitle);
      setAchievements(evaluatedAchievements);
      setNextLevel(nxtLevel);

      // Optionally sync to user document if values changed significantly
      if (
        user.civicScore !== newCivicScore ||
        user.trustScore !== newTrustScore ||
        user.currentLevel !== newLevel ||
        (user.achievements || []).length !== evaluatedAchievements.length
      ) {
        try {
          await updateDoc(doc(db, "users", user.id), {
            civicScore: newCivicScore,
            trustScore: newTrustScore,
            currentLevel: newLevel,
            currentTitle: newTitle,
            achievements: evaluatedAchievements,
            statistics: userStats,
          });
        } catch (e) {
          console.error("Failed to sync reputation to user doc", e);
        }
      }

      setLoading(false);
    };

    const unsubIssues = onSnapshot(issuesQ, (snap) => {
      userIssues = snap.docs.map((d) => d.data() as Issue);
      calculate();
    });

    const unsubVerifications = onSnapshot(verificationsQ, (snap) => {
      userVerifications = snap.docs.map((d) => d.data() as Verification);
      calculate();
    });

    return () => {
      unsubIssues();
      unsubVerifications();
    };
  }, [user]);

  return {
    stats,
    civicScore,
    trustScore,
    currentLevel,
    currentTitle,
    achievements,
    nextLevel,
    loading,
  };
}
