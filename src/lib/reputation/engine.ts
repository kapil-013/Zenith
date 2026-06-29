import { User, CivicAchievement, UserStatistics } from "../../types";

export const CIVIC_LEVELS = [
  { name: "New Citizen", minScore: 0 },
  { name: "Community Helper", minScore: 50 },
  { name: "Neighborhood Contributor", minScore: 150 },
  { name: "Civic Volunteer", minScore: 300 },
  { name: "Trusted Reporter", minScore: 500 },
  { name: "Community Guardian", minScore: 800 },
  { name: "City Steward", minScore: 1200 },
  { name: "Civic Champion", minScore: 2000 },
  { name: "Urban Ambassador", minScore: 3500 },
  { name: "Community Hero", minScore: 5000 },
];

export const BADGE_DEFINITIONS = [
  {
    id: "first_report",
    name: "First Report",
    description: "Reported your first civic issue.",
    iconName: "flag",
  },
  {
    id: "first_verification",
    name: "First Verification",
    description: "Verified your first community issue.",
    iconName: "check-circle",
  },
  {
    id: "top_verifier",
    name: "Top Verifier",
    description: "Verified 50+ issues accurately.",
    iconName: "shield-check",
  },
  {
    id: "road_safety_advocate",
    name: "Road Safety Advocate",
    description: "Reported 10+ road safety issues.",
    iconName: "car",
  },
  {
    id: "water_guardian",
    name: "Water Guardian",
    description: "Reported 10+ water or sewage issues.",
    iconName: "droplet",
  },
  {
    id: "clean_city_champion",
    name: "Clean City Champion",
    description: "Reported 10+ garbage overflow issues.",
    iconName: "trash-2",
  },
  {
    id: "resolution_champion",
    name: "Resolution Champion",
    description: "Helped resolve 20+ issues.",
    iconName: "award",
  },
  {
    id: "trusted_reporter",
    name: "Trusted Reporter",
    description: "Maintained a 90+ trust score with 10+ reports.",
    iconName: "star",
  },
  {
    id: "neighborhood_protector",
    name: "Neighborhood Protector",
    description: "Reported high-priority issues that were resolved.",
    iconName: "shield",
  },
  {
    id: "community_hero",
    name: "Community Hero",
    description: "Reached the highest civic level.",
    iconName: "crown",
  },
];

export class ReputationEngine {
  static calculateCivicScore(stats: UserStatistics): number {
    let score = 0;

    // Base points for actions
    score += (stats.issuesReported || 0) * 10;
    score += (stats.issuesVerified || 0) * 5;
    score += (stats.successfulResolutions || 0) * 20;

    // Penalties for bad behavior (not too harsh, but enough to prevent abuse)
    const falseReports = stats.falseReports || 0;
    score -= falseReports * 15;

    return Math.max(0, score);
  }

  static calculateTrustScore(stats: UserStatistics): number {
    const totalReports = stats.issuesReported || 0;
    const verifiedReports =
      (stats.issuesReported || 0) -
      (stats.rejectedReports || 0) -
      (stats.falseReports || 0); // Simplified approximation

    // Base trust for new users
    if (totalReports === 0) return 50;

    const accuracy = verifiedReports / totalReports;
    let trustScore = 50 + accuracy * 40; // Max 90 from basic accuracy

    // Bonus for high volume of accurate reports
    if (totalReports > 20 && accuracy > 0.8) {
      trustScore += 10;
    }

    // Penalty for false reports
    if ((stats.falseReports || 0) > 0) {
      trustScore -= (stats.falseReports || 0) * 5;
    }

    return Math.max(0, Math.min(100, Math.round(trustScore)));
  }

  static getLevel(civicScore: number): string {
    let currentLevel = CIVIC_LEVELS[0].name;
    for (const level of CIVIC_LEVELS) {
      if (civicScore >= level.minScore) {
        currentLevel = level.name;
      } else {
        break;
      }
    }
    return currentLevel;
  }

  static getNextLevel(civicScore: number) {
    for (let i = 0; i < CIVIC_LEVELS.length; i++) {
      if (civicScore < CIVIC_LEVELS[i].minScore) {
        return CIVIC_LEVELS[i];
      }
    }
    return null; // Max level
  }

  static generateTitle(
    stats: UserStatistics,
    civicScore: number,
    trustScore: number,
  ): string {
    if (civicScore > 5000) return "Community Hero";
    if (trustScore > 90 && stats.issuesReported > 50)
      return "Trusted Community Verifier";
    if (stats.successfulResolutions > 30) return "Neighborhood Change Maker";
    if (stats.issuesReported > 20) return "Public Infrastructure Advocate";
    return this.getLevel(civicScore);
  }

  // Method to check and award new badges based on current stats
  static evaluateBadges(
    stats: UserStatistics,
    currentAchievements: CivicAchievement[] = [],
    trustScore: number,
  ): CivicAchievement[] {
    const newAchievements: CivicAchievement[] = [...currentAchievements];
    const existingBadgeIds = new Set(newAchievements.map((a) => a.badgeId));

    const awardBadge = (badgeId: string) => {
      if (!existingBadgeIds.has(badgeId)) {
        const def = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
        if (def) {
          newAchievements.push({
            id: `ach_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            badgeId: def.id,
            name: def.name,
            description: def.description,
            iconName: def.iconName,
            unlockedAt: Date.now(),
          });
          existingBadgeIds.add(badgeId);
        }
      }
    };

    if (stats.issuesReported >= 1) awardBadge("first_report");
    if (stats.issuesVerified >= 1) awardBadge("first_verification");
    if (stats.issuesVerified >= 50) awardBadge("top_verifier");
    if (stats.successfulResolutions >= 20) awardBadge("resolution_champion");
    if (trustScore >= 90 && stats.issuesReported >= 10)
      awardBadge("trusted_reporter");
    if (this.getLevel(this.calculateCivicScore(stats)) === "Community Hero")
      awardBadge("community_hero");

    return newAchievements;
  }
}
