import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { NeumorphicCard } from "../components/ui/card";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  Trophy,
  Award,
  Star,
  Crown,
  Shield,
  ShieldCheck,
  Flame,
  Calendar,
  Trophy as TrophyIcon,
  Medal,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { User, Issue, Verification } from "../types";

export function Leaderboard() {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"allTime" | "thisMonth">(
    "allTime",
  );

  // Rank states for the current user
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [monthlyCurrentUserRank, setMonthlyCurrentUserRank] = useState<
    number | null
  >(null);
  const [currentUserMonthlyScore, setCurrentUserMonthlyScore] =
    useState<number>(0);

  // Cache of monthly activity for client-side monthly ranking calculation
  const [monthlyIssues, setMonthlyIssues] = useState<Issue[]>([]);
  const [monthlyVerifications, setMonthlyVerifications] = useState<
    Verification[]
  >([]);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      // Query top 50 users by civicScore All Time
      const usersQ = query(
        collection(db, "users"),
        orderBy("civicScore", "desc"),
        limit(50),
      );
      const snap = await getDocs(usersQ);
      const fetchedUsers = snap.docs.map(
        (doc) => ({ ...doc.data(), id: doc.id }) as User,
      );

      // Filter out users who have explicitly set privacyPreferences.publicProfile = false
      const publicUsers = fetchedUsers.filter(
        (u) => u.preferences?.privacyPreferences?.publicProfile !== false,
      );
      setUsers(publicUsers);

      // If there's a logged-in user, calculate their All Time Rank
      if (currentUser) {
        const higherScoreQ = query(
          collection(db, "users"),
          where("civicScore", ">", currentUser.civicScore || 0),
        );
        const countSnap = await getCountFromServer(higherScoreQ);
        setCurrentUserRank(countSnap.data().count + 1);
      }

      // Fetch last 30 days of issues and verifications to calculate Monthly leaderboard
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

      const issuesQ = query(
        collection(db, "issues"),
        where("createdAt", ">=", thirtyDaysAgo),
      );
      const issuesSnap = await getDocs(issuesQ);
      const fetchedMonthlyIssues = issuesSnap.docs.map(
        (doc) => doc.data() as Issue,
      );
      setMonthlyIssues(fetchedMonthlyIssues);

      const verificationsQ = query(
        collection(db, "verifications"),
        where("createdAt", ">=", thirtyDaysAgo),
      );
      const verificationsSnap = await getDocs(verificationsQ);
      const fetchedMonthlyVerifications = verificationsSnap.docs.map(
        (doc) => doc.data() as Verification,
      );
      setMonthlyVerifications(fetchedMonthlyVerifications);

      // Compute current user's monthly score & rank
      if (currentUser) {
        const myIssues = fetchedMonthlyIssues.filter(
          (i) => i.createdBy === currentUser.id,
        );
        const myVerifications = fetchedMonthlyVerifications.filter(
          (v) => v.userId === currentUser.id && v.type === "verify",
        );
        const myResolutions = myIssues.filter(
          (i) =>
            i.status === "Closed" ||
            i.status === "Resolved" ||
            i.status === "Confirmed",
        ).length;

        const myMonthlyScore =
          myIssues.length * 10 +
          myVerifications.length * 5 +
          myResolutions * 20;
        setCurrentUserMonthlyScore(myMonthlyScore);

        // Calculate other users' monthly scores to compute exact monthly rank
        const allUserIds = new Set<string>();
        fetchedMonthlyIssues.forEach((i) => allUserIds.add(i.createdBy));
        fetchedMonthlyVerifications.forEach((v) => allUserIds.add(v.userId));
        allUserIds.add(currentUser.id);

        const monthlyScores = Array.from(allUserIds).map((uid) => {
          const userIssues = fetchedMonthlyIssues.filter(
            (i) => i.createdBy === uid,
          );
          const userVerifications = fetchedMonthlyVerifications.filter(
            (v) => v.userId === uid && v.type === "verify",
          );
          const userResolutions = userIssues.filter(
            (i) =>
              i.status === "Closed" ||
              i.status === "Resolved" ||
              i.status === "Confirmed",
          ).length;

          return {
            uid,
            score:
              userIssues.length * 10 +
              userVerifications.length * 5 +
              userResolutions * 20,
          };
        });

        const usersWithHigherMonthlyScore = monthlyScores.filter(
          (ms) => ms.score > myMonthlyScore,
        ).length;
        setMonthlyCurrentUserRank(usersWithHigherMonthlyScore + 1);
      }
    } catch (e: any) {
      console.error("Failed to load leaderboard data:", e);
      addToast("Failed to load leaderboard. Please try again later.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, [currentUser]);

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  // Helper to calculate monthly metrics for display
  const computeMonthlyStats = (userId: string) => {
    const userIssues = monthlyIssues.filter((i) => i.createdBy === userId);
    const userVerifications = monthlyVerifications.filter(
      (v) => v.userId === userId && v.type === "verify",
    );
    const resolutions = userIssues.filter(
      (i) =>
        i.status === "Closed" ||
        i.status === "Resolved" ||
        i.status === "Confirmed",
    ).length;

    const score =
      userIssues.length * 10 + userVerifications.length * 5 + resolutions * 20;
    return {
      score,
      issuesCount: userIssues.length,
      verificationsCount: userVerifications.length,
    };
  };

  const computeMonthlyBadgeCount = (achievements: any[] | undefined) => {
    if (!achievements) return 0;
    return achievements.filter(
      (a) => a.unlockedAt && a.unlockedAt >= thirtyDaysAgo,
    ).length;
  };

  // Process users based on active tab
  const processedUsers = React.useMemo(() => {
    if (activeTab === "allTime") {
      return users.map((u, index) => ({
        ...u,
        rank: index + 1,
        displayScore: u.civicScore || 0,
        badgeCount: u.achievements?.length || 0,
      }));
    } else {
      // Monthly: calculate scores, map, and sort
      return users
        .map((u) => {
          const stats = computeMonthlyStats(u.id);
          const monthlyBadges = computeMonthlyBadgeCount(u.achievements);
          return {
            ...u,
            displayScore: stats.score,
            badgeCount: monthlyBadges,
          };
        })
        .sort((a, b) => b.displayScore - a.displayScore)
        .map((u, index) => ({
          ...u,
          rank: index + 1,
        }));
    }
  }, [users, activeTab, monthlyIssues, monthlyVerifications]);

  const getRankBadge = (rank: number) => {
    if (rank === 1)
      return <Crown className="h-5 w-5 text-yellow-500 fill-yellow-500" />;
    if (rank === 2)
      return <Medal className="h-5 w-5 text-slate-400 fill-slate-400" />;
    if (rank === 3)
      return <Medal className="h-5 w-5 text-amber-700 fill-amber-700" />;
    return (
      <span className="font-bold text-sm text-[var(--color-civic-text-muted)]">
        #{rank}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header section with Trophy styling */}
      <div className="text-center max-w-2xl mx-auto py-6">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="inline-flex p-4 bg-[var(--color-civic-surface-inset)] rounded-full shadow-[var(--shadow-neumorphic-inset)] border border-transparent mb-6 text-yellow-500"
        >
          <TrophyIcon className="h-10 w-10" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl font-extrabold text-[var(--color-civic-text-primary)] tracking-tight mb-4"
        >
          Civic Leaderboard
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-[var(--color-civic-text-secondary)] font-medium"
        >
          Compete constructively with fellow neighbors. Gain civic points by
          reporting, verifying, and driving solutions.
        </motion.p>
      </div>

      {/* Tabs / Filters */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-[var(--color-civic-surface-inset)] rounded-full shadow-[var(--shadow-neumorphic-inset)] border border-transparent">
          <button
            onClick={() => setActiveTab("allTime")}
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${
              activeTab === "allTime"
                ? "bg-[var(--color-civic-background)] text-[var(--color-civic-primary)] shadow-[var(--shadow-neumorphic)]"
                : "text-[var(--color-civic-text-muted)] hover:text-[var(--color-civic-text-secondary)]"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            All Time
          </button>
          <button
            onClick={() => setActiveTab("thisMonth")}
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${
              activeTab === "thisMonth"
                ? "bg-[var(--color-civic-background)] text-[var(--color-civic-primary)] shadow-[var(--shadow-neumorphic)]"
                : "text-[var(--color-civic-text-muted)] hover:text-[var(--color-civic-text-secondary)]"
            }`}
          >
            <Calendar className="h-4 w-4" />
            This Month
          </button>
        </div>
      </div>

      {/* Main Leaderboard Table Container */}
      <NeumorphicCard className="p-0 overflow-hidden shadow-[var(--shadow-neumorphic)] border border-transparent">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-civic-surface-inset)] border-b border-[var(--color-civic-surface-inset)]">
                <th className="p-4 font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs w-20 text-center">
                  Rank
                </th>
                <th className="p-4 font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs">
                  Citizen / Title
                </th>
                <th className="p-4 font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs text-center">
                  Badges Unlocked
                </th>
                <th className="p-4 font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs text-right w-36">
                  Civic Score
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-12 text-center text-[var(--color-civic-text-muted)] font-medium"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Flame className="h-8 w-8 text-[var(--color-civic-primary)] animate-pulse" />
                      Evaluating current standings...
                    </div>
                  </td>
                </tr>
              ) : processedUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-12 text-center text-[var(--color-civic-text-muted)] font-medium"
                  >
                    No active citizens match this criteria yet.
                  </td>
                </tr>
              ) : (
                processedUsers.map((u) => {
                  const isSelf = currentUser && u.id === currentUser.id;
                  return (
                    <tr
                      key={u.id}
                      className={`border-b border-[var(--color-civic-surface-inset)] last:border-0 hover:bg-[var(--color-civic-surface-inset)]/50 transition-all ${
                        isSelf
                          ? "bg-[var(--color-civic-surface-inset)]/40 font-semibold border-l-4 border-l-[var(--color-civic-primary)]"
                          : ""
                      }`}
                    >
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center">
                          {getRankBadge(u.rank)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {u.photoURL ? (
                            <img
                              src={u.photoURL}
                              alt={u.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-full shadow-sm object-cover border-2 border-[var(--color-civic-surface-inset)]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[var(--color-civic-surface-inset)] text-[var(--color-civic-primary)] flex items-center justify-center font-black text-sm uppercase shadow-sm border border-transparent">
                              {u.name.substring(0, 2)}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5 font-extrabold text-[var(--color-civic-text-primary)]">
                              {u.name}
                              {isSelf && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-black tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[var(--color-civic-text-secondary)] font-medium">
                              {u.currentTitle || "New Citizen"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 shadow-sm">
                          <Award className="h-3.5 w-3.5 text-amber-500" />
                          {u.badgeCount}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-base font-black text-[var(--color-civic-primary)]">
                          {u.displayScore}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </NeumorphicCard>

      {/* Your Rank Card Below (For signed in users) */}
      {currentUser && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-xl mx-auto"
        >
          <NeumorphicCard className="p-6 bg-gradient-to-r from-[var(--color-civic-surface-inset)]/30 to-[var(--color-civic-surface-inset)]/10 border border-transparent shadow-[var(--shadow-neumorphic)]">
            <h3 className="text-sm font-black text-[var(--color-civic-text-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-[var(--color-civic-primary)]" />
              Your Standing
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs font-bold text-[var(--color-civic-text-muted)] uppercase">
                  Rank
                </div>
                <div className="text-2xl font-black text-[var(--color-civic-text-primary)] mt-1">
                  {activeTab === "allTime"
                    ? currentUserRank !== null
                      ? `#${currentUserRank}`
                      : "Unranked"
                    : monthlyCurrentUserRank !== null
                      ? `#${monthlyCurrentUserRank}`
                      : "Unranked"}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--color-civic-text-muted)] uppercase">
                  Civic Score
                </div>
                <div className="text-2xl font-black text-[var(--color-civic-primary)] mt-1">
                  {activeTab === "allTime"
                    ? currentUser.civicScore || 0
                    : currentUserMonthlyScore}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--color-civic-text-muted)] uppercase">
                  Monthly Score
                </div>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {currentUserMonthlyScore}
                </div>
              </div>
            </div>
            {currentUser.preferences?.privacyPreferences?.publicProfile ===
              false && (
              <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md flex items-center gap-2 text-xs text-yellow-800 font-medium justify-center">
                <EyeOff className="h-4 w-4 text-yellow-600" />
                Your profile is private. You won't appear on the public
                leaderboard.
              </div>
            )}
          </NeumorphicCard>
        </motion.div>
      )}
    </motion.div>
  );
}
