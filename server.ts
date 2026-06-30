import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

import {
  INSIGHT_GENERATOR_SYSTEM_PROMPT,
  EXPLAINABILITY_SYSTEM_PROMPT,
  buildInsightPrompt,
  buildExplainabilityPrompt,
} from "./src/lib/ai/prompts";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "50mb" }));

  app.post("/api/analyze-issue", async (req, res) => {
    try {
      const { description, address, locationType, imageBase64, mimeType } =
        req.body;

      const prompt = `Analyze this civic issue report. 
Description: ${description || "None provided"}
Address: ${address || "None provided"}
Location Type: ${locationType || "None provided"}`;

      const systemInstruction = `You are CivicVision AI, an assistant that analyzes hyperlocal civic issue reports from citizens.
Your job is to inspect the uploaded image and the user's text description, then convert it into structured civic data.
Be practical, cautious, and transparent.
If the visual evidence is unclear, reduce confidence.
If the image and description do not match, increase spamRisk.
Do not hallucinate exact facts.
Do not claim government action has happened.
Keep summaries short and useful.
Return only valid JSON.

Behavior rules:
* If the image shows road damage, classify as Pothole or Damaged Infrastructure.
* If the image shows trash, classify as Garbage Overflow.
* If the image shows leaking water, classify as Water Leakage.
* If the text mentions light not working but image is dark/unclear, classify as Broken Streetlight with medium confidence.
* If the issue may create direct danger to people, use High or Critical severity.
* Critical should be reserved for open manholes, severe flooding, exposed electrical danger, major road blockage, or immediate safety hazards.
* Give citizenSummary in simple public-friendly language.
* Give authoritySummary as an action-oriented operational note.
* suggestedDepartment should be one of:
  Road Maintenance, Sanitation Department, Water Board, Electrical Maintenance, Drainage Department, Public Works, Traffic Management, Community Volunteers, General Civic Helpdesk.`;

      const contents: any = {
        parts: [{ text: prompt }],
      };

      if (imageBase64 && mimeType) {
        contents.parts.unshift({
          inlineData: {
            mimeType: mimeType,
            data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
          },
        });
      }

      let response;
      const generateConfig = {
        systemInstruction,
        responseMimeType: "application/json" as const,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "short issue title" },
            category: {
              type: Type.STRING,
              description:
                "Pothole | Garbage Overflow | Water Leakage | Broken Streetlight | Sewage Issue | Road Blockage | Damaged Infrastructure | Unsafe Public Area | Other",
            },
            severity: {
              type: Type.STRING,
              description: "Low | Medium | High | Critical",
            },
            confidence: {
              type: Type.NUMBER,
              description: "Confidence score between 0 and 1",
            },
            suggestedDepartment: {
              type: Type.STRING,
              description:
                "Road Maintenance | Sanitation Department | Water Board | Electrical Maintenance | Drainage Department | Public Works | Traffic Management | Community Volunteers | General Civic Helpdesk",
            },
            citizenSummary: {
              type: Type.STRING,
              description: "short public-friendly explanation",
            },
            authoritySummary: {
              type: Type.STRING,
              description: "short action-oriented operational summary",
            },
            riskReason: {
              type: Type.STRING,
              description: "why this issue matters",
            },
            spamRisk: { type: Type.STRING, description: "Low | Medium | High" },
            verificationQuestion: {
              type: Type.STRING,
              description: "question nearby citizens can answer",
            },
            recommendedAction: {
              type: Type.STRING,
              description: "practical next step",
            },
            priorityHints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "reasons for priority",
            },
          },
          required: [
            "title",
            "category",
            "severity",
            "confidence",
            "suggestedDepartment",
            "citizenSummary",
            "authoritySummary",
            "riskReason",
            "spamRisk",
            "verificationQuestion",
            "recommendedAction",
            "priorityHints",
          ],
        },
      };

      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
          config: generateConfig,
        });
      } catch (err) {
        console.warn(
          "gemini-2.5-flash failed, falling back to gemini-2.5-flash-lite...",
        );
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents,
          config: generateConfig,
        });
      }

      const text = response.text;
      if (!text) throw new Error("No response text");

      const jsonStr = text.trim();
      const result = JSON.parse(jsonStr);

      res.json({ ...result, isFallback: false });
    } catch (error) {
      console.error("Gemini API Error:", error);
      res.json({
        title: "Civic Issue (Fallback)",
        category: "Other",
        severity: "Medium",
        confidence: 0.5,
        suggestedDepartment: "General Civic Helpdesk",
        citizenSummary: "An issue was reported by a citizen.",
        authoritySummary:
          "Issue reported. Please verify manually due to AI analysis timeout.",
        riskReason: "May cause inconvenience.",
        spamRisk: "Medium",
        verificationQuestion: "Can you confirm if this issue is still present?",
        recommendedAction: "Review manually.",
        priorityHints: ["Needs manual review due to AI analysis failure"],
        isFallback: true,
      });
    }
  });

  
  app.post("/api/suggest-update", async (req, res) => {
    try {
      const { issueTitle, category, currentStatus, departmentName } = req.body;
      
      const systemInstruction = "You are a civic department assistant. Generate a brief, professional progress update note (2 sentences max) that a government department officer would write when updating the status of a civic issue. Be specific, action-oriented, and reassuring to citizens. Do not use jargon. Do not mention AI.";
      const prompt = `Issue: ${issueTitle || "Civic Issue"}. Category: ${category || "General"}. Current status: ${currentStatus || "Open"}. Department: ${departmentName || "General Department"}. Write a progress update note.`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            systemInstruction,
          },
        });
      } catch (err) {
        console.warn("gemini-2.5-flash failed for suggest-update, falling back to gemini-2.5-flash-lite...");
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: prompt,
          config: {
            systemInstruction,
          },
        });
      }

      const suggestion = response.text ? response.text.trim() : "";
      res.json({ suggestion });
    } catch (error) {
      console.error("Error in /api/suggest-update:", error);
      res.json({ suggestion: "" });
    }
  });
  
  
  app.post("/api/detect-duplicates", async (req, res) => {
    try {
      const { category, lat, lng, description, issues } = req.body;
      if (
        !category ||
        typeof lat !== "number" ||
        typeof lng !== "number" ||
        !description ||
        !issues
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      function getDistanceInMeters(lat1, lon1, lat2, lon2) {
        const R = 6371e3; 
        const phi1 = (lat1 * Math.PI) / 180;
        const phi2 = (lat2 * Math.PI) / 180;
        const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
        const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      }

      const unresolvedStatuses = ["Open", "Reported", "Verified", "In Progress", "Confirmed"];
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const candidates = [];

      issues.forEach((data) => {
        const status = data.status || "";
        const createdAt = data.createdAt || 0;

        if (!unresolvedStatuses.includes(status)) return;
        if (createdAt < thirtyDaysAgo) return;
        if (!data.location || typeof data.location.lat !== "number" || typeof data.location.lng !== "number") return;
        if (data.category !== category) return;

        const distance = getDistanceInMeters(lat, lng, data.location.lat, data.location.lng);
        if (distance <= 200) {
          candidates.push({
            id: data.id,
            title: data.title || "Untitled Issue",
            description: data.description || "",
            imageUrl: data.imageUrl || "",
            status,
            category: data.category || "",
            address: data.address || "",
            verificationCount: data.verificationCount || 0,
            priorityScore: data.priorityScore || 0,
            createdAt,
            distance,
          });
        }
      });

      if (candidates.length === 0) {
        return res.json({ duplicates: [] });
      }

      candidates.sort((a, b) => a.distance - b.distance);
      const topCandidates = candidates.slice(0, 5);

      const systemInstruction = `You are CivicDuplicate AI. Your job is to compare a new citizen report's description against a list of nearby existing reports of the same category and decide if any describe the exact same real-world problem (e.g. the same physical pothole, the same garbage overflow pile, the same water leakage) rather than just being a similar category of problem in the general vicinity.`;

      const contents = `New report description: "${description}"

Nearby existing reports of the same category:
${JSON.stringify(topCandidates.map(c => ({id: c.id, title: c.title, description: c.description, createdAt: new Date(c.createdAt).toISOString()})), null, 2)}`;

      const generateConfig = {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              issueId: { type: Type.STRING },
              isDuplicate: { type: Type.BOOLEAN },
              confidence: { type: Type.NUMBER },
              reasoning: { type: Type.STRING },
            },
            required: ["issueId", "isDuplicate", "confidence", "reasoning"],
          },
        },
      };

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
          config: generateConfig,
        });

        const text = response.text;
        if (!text) throw new Error("No response text");

        const results = JSON.parse(text.trim());
        const duplicates = [];

        for (const result of results) {
          if (result.isDuplicate === true) {
            const candidate = topCandidates.find(c => c.id === result.issueId);
            if (candidate) {
              duplicates.push({ ...candidate, confidence: result.confidence, reasoning: result.reasoning });
            }
          }
        }

        return res.json({ duplicates });
      } catch (geminiError) {
        return res.json({ duplicates: [] });
      }
    } catch (error) {
      return res.json({ duplicates: [] });
    }
  });

  app.post("/api/generate-impact-insight", async (req, res) => {
    try {
      const { issues } = req.body;
      const prompt = `You are CivicInsight AI. Analyze the issue dataset and summarize civic trends for local administrators.
Focus on repeated issue categories, unresolved high-priority issues, hotspots, and recommended actions.
Do not exaggerate. Keep recommendations practical.

Issue Data:
${JSON.stringify(
  (issues || [])
    .map((i: any) => ({
      category: i.category,
      severity: i.severity,
      status: i.status,
      location: i.address || i.locationType,
      priorityScore: i.priorityScore,
      verificationCount: i.verificationCount,
      createdAt: i.createdAt,
    }))
    .slice(0, 100),
  null,
  2,
)}`;

      let result;
      try {
        result = await ai.models.generateContent({
          model: "gemini-2.5-pro",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                summary: { type: Type.STRING },
                hotspots: { type: Type.ARRAY, items: { type: Type.STRING } },
                recommendedActions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                riskLevel: {
                  type: Type.STRING,
                  enum: ["Low", "Medium", "High"],
                },
              },
              required: [
                "headline",
                "summary",
                "hotspots",
                "recommendedActions",
                "riskLevel",
              ],
            },
          },
        });
      } catch (err) {
        console.warn(
          "gemini-2.5-pro failed, falling back to gemini-2.5-flash-lite...",
        );
        result = await ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                summary: { type: Type.STRING },
                hotspots: { type: Type.ARRAY, items: { type: Type.STRING } },
                recommendedActions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                riskLevel: {
                  type: Type.STRING,
                  enum: ["Low", "Medium", "High"],
                },
              },
              required: [
                "headline",
                "summary",
                "hotspots",
                "recommendedActions",
                "riskLevel",
              ],
            },
          },
        });
      }

      const text = result.text;
      if (!text) throw new Error("No response text");
      res.json(JSON.parse(text.trim()));
    } catch (error) {
      console.error("AI Insight Error:", error);
      res.json({
        headline: "Civic Insights (Mock)",
        summary:
          "AI analysis is currently unavailable. This is a default fallback insight.",
        hotspots: ["Various Locations"],
        recommendedActions: ["Review high priority issues manually"],
        riskLevel: "Medium",
      });
    }
  });

  
  app.post("/api/intelligence/generate", async (req, res) => {
    try {
      const { role, contextData } = req.body;

      const prompt = buildInsightPrompt(role, contextData);

      const generateConfig = {
        systemInstruction: INSIGHT_GENERATOR_SYSTEM_PROMPT,
        responseMimeType: "application/json" as const,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description:
                      "operational | risk | recommendation | prediction | trend | anomaly | community | department | system",
                  },
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  detailedReasoning: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  priority: {
                    type: Type.STRING,
                    description: "Low | Medium | High | Urgent",
                  },
                  suggestedAction: { type: Type.STRING },
                  relatedEntities: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: [
                  "type",
                  "title",
                  "summary",
                  "detailedReasoning",
                  "confidence",
                  "priority",
                ],
              },
            },
          },
          required: ["insights"],
        },
      };

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: generateConfig,
      });

      const text = response.text;
      if (!text) throw new Error("No response text");

      const result = JSON.parse(text.trim());
      // Add IDs and timestamps
      result.insights = result.insights.map((i: any) => ({
        ...i,
        id: `ins_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        generatedAt: Date.now(),
      }));

      res.json(result);
    } catch (error) {
      console.error("AI Intelligence Generate Error:", error);
      res.status(500).json({ error: "Failed to generate insights" });
    }
  });

  
  app.post("/api/intelligence/explain", async (req, res) => {
    try {
      const { issue, verifications } = req.body;

      const prompt = buildExplainabilityPrompt(issue, verifications);

      const generateConfig = {
        systemInstruction: EXPLAINABILITY_SYSTEM_PROMPT,
        responseMimeType: "application/json" as const,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priorityScore: { type: Type.NUMBER },
            explanation: { type: Type.STRING },
            factors: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidence: { type: Type.NUMBER },
          },
          required: ["priorityScore", "explanation", "factors", "confidence"],
        },
      };

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: generateConfig,
      });

      const text = response.text;
      if (!text) throw new Error("No response text");

      const result = JSON.parse(text.trim());
      res.json(result);
    } catch (error) {
      console.error("AI Intelligence Explain Error:", error);
      res.status(500).json({ error: "Failed to explain issue" });
    }
  });

  
  
  app.post("/api/intelligence/predict-hotspots", async (req, res) => {
    try {
      const { issues } = req.body;
      if (!issues) return res.json({ forecasts: [] });
      
      const buckets = {};

      issues.forEach((data) => {
        const category = data.category;
        const area = data.address || data.locationType || "Unknown Area";
        if (!category) return;

        const key = `${category}::${area}`;
        if (!buckets[key]) {
          buckets[key] = { category, area, timestamps: [] };
        }
        if (typeof data.createdAt === "number") {
          buckets[key].timestamps.push(data.createdAt);
        }
      });

      const recurringBuckets = Object.values(buckets)
        .map((b) => {
          const total = b.timestamps.length;
          const sorted = b.timestamps.slice().sort((a, b) => a - b);
          let avgDaysBetween = 0;
          if (sorted.length > 1) {
            let totalDiffMs = 0;
            for (let i = 1; i < sorted.length; i++) {
              totalDiffMs += sorted[i] - sorted[i - 1];
            }
            const avgDiffMs = totalDiffMs / (sorted.length - 1);
            avgDaysBetween = avgDiffMs / (1000 * 60 * 60 * 24);
          }
          const recurrencesCount = total - 1;
          return { category: b.category, area: b.area, totalOccurrences: total, recurrencesCount, avgDaysBetween: Number(avgDaysBetween.toFixed(2)) };
        })
        .filter((b) => b.totalOccurrences >= 2);

      if (recurringBuckets.length === 0) {
        return res.json({ forecasts: [] });
      }

      const systemInstruction = `You are CivicForecast AI. Predict which recurring issues are likely to need attention again in 30 days.`;
      const contents = `Here is the aggregated data of recurring civic issues:
${JSON.stringify(recurringBuckets, null, 2)}
Forecast which are likely to recur in the next 30 days. Return up to 8 forecasts, sorted by riskLevel (High first).`;

      const generateConfig = {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            forecasts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  area: { type: Type.STRING },
                  category: { type: Type.STRING },
                  riskLevel: { type: Type.STRING },
                  predictedWindowDays: { type: Type.NUMBER },
                  reasoning: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                },
                required: ["area", "category", "riskLevel", "predictedWindowDays", "reasoning", "confidence"],
              },
            },
          },
          required: ["forecasts"],
        },
      };

      try {
        const response = await ai.models.generateContent({ model: "gemini-2.5-pro", contents, config: generateConfig });
        const text = response.text;
        const result = JSON.parse(text.trim());
        if (result.forecasts && Array.isArray(result.forecasts)) {
          const riskMap = { High: 3, Medium: 2, Low: 1 };
          result.forecasts.sort((a, b) => (riskMap[b.riskLevel] || 0) - (riskMap[a.riskLevel] || 0));
          result.forecasts = result.forecasts.slice(0, 8);
        }
        return res.json(result);
      } catch (geminiError) {
        return res.json({ forecasts: [] });
      }
    } catch (error) {
      return res.json({ forecasts: [] });
    }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
