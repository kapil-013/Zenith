import {
  AIInsight,
  AIExplanation,
  Issue,
  Verification,
  User,
} from "../../types";

export class CivicIntelligence {
  /**
   * AI Context Builder: Gathers necessary context from the frontend
   * to send to the intelligence layer without sending unnecessary raw data.
   */
  static buildContext(
    role: string,
    issues: Issue[],
    verifications: Verification[],
    users?: User[],
  ) {
    const recentIssues = issues.slice(0, 50); // Limit to recent/relevant
    const unresolvedIssues = issues.filter(
      (i) => !["Resolved", "Closed", "Confirmed"].includes(i.status),
    );

    return {
      activeIssuesCount: unresolvedIssues.length,
      urgentIssuesCount: unresolvedIssues.filter((i) => i.priorityScore >= 80)
        .length,
      recentVerificationsCount: verifications.length,
      topCategories: this.aggregateCategories(recentIssues),
      unresolvedUrgent: unresolvedIssues
        .filter((i) => i.priorityScore >= 80)
        .map((i) => ({
          id: i.id,
          title: i.title,
          category: i.category,
          priority: i.priorityScore,
          status: i.status,
        })),
      timestamp: new Date().toISOString(),
    };
  }

  private static aggregateCategories(issues: Issue[]) {
    const counts: Record<string, number> = {};
    for (const issue of issues) {
      counts[issue.category] = (counts[issue.category] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});
  }

  /**
   * Insight Generator: Calls the backend AI layer to generate insights.
   */
  static async generateInsights(
    role: string,
    contextData: any,
  ): Promise<AIInsight[]> {
    try {
      const response = await fetch("/api/intelligence/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, contextData }),
      });
      if (!response.ok) throw new Error("Failed to generate insights");
      const data = await response.json();
      return data.insights || [];
    } catch (e) {
      console.error("AI Insight Generation Error:", e);
      return [
        {
          id: "fallback-insight",
          type: "system",
          title: "System Optimizing",
          summary: "AI Intelligence is currently gathering data.",
          detailedReasoning:
            "The system requires more activity before generating personalized operational insights.",
          confidence: 0.8,
          priority: "Low",
          generatedAt: Date.now(),
        },
      ];
    }
  }

  /**
   * Explanation Generator: Calls the backend to explain an issue's priority.
   */
  static async explainIssue(
    issue: Issue,
    verifications: Verification[],
  ): Promise<AIExplanation | null> {
    try {
      const response = await fetch("/api/intelligence/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issue, verifications }),
      });
      if (!response.ok) throw new Error("Failed to generate explanation");
      return await response.json();
    } catch (e) {
      console.error("AI Explanation Error:", e);
      return {
        priorityScore: issue.priorityScore,
        explanation:
          "Priority is calculated based on severity, verifications, and location.",
        factors: issue.priorityReasons || [],
        confidence: 0.9,
      };
    }
  }
}
