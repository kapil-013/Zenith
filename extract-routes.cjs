const fs = require('fs');
const code = fs.readFileSync('server.ts', 'utf-8');

function extractRoute(routePrefix) {
  const startIdx = code.indexOf(`app.post("${routePrefix}"`);
  if (startIdx === -1) return null;
  // find the closing `  });` at the root level of the route.
  // A simple way is to find the next `  app.post(` or `  // ` or `  if (` that is at the root level.
  let endIdx = -1;
  let braces = 0;
  let inString = false;
  let escape = false;
  
  for (let i = startIdx; i < code.length; i++) {
    if (escape) { escape = false; continue; }
    if (code[i] === '\\') { escape = true; continue; }
    if (code[i] === '"' || code[i] === "'" || code[i] === "\`") {
      if (!inString) inString = code[i];
      else if (inString === code[i]) inString = false;
    }
    
    if (!inString) {
      if (code[i] === '{') braces++;
      if (code[i] === '}') {
        braces--;
        // If we close the app.post(..., (req,res) => { ... })
        if (braces === 0) {
           // We found the end of the route!
           // But actually the outer braces might be `app.post(..., () => {` so braces becomes 0?
           // Actually `app.post("...", async (req, res) => {` has 1 brace inside the arguments!
           // When that 1 brace closes, we are inside the arguments still.
           // Then we find `});`
           endIdx = code.indexOf('});', i) + 3;
           if (code.slice(endIdx-3, endIdx) === '});') {
             // Let's just use string matching for the end of the route since it's formatted well.
             break;
           }
        }
      }
    }
  }
}

// A simpler extraction method: Regex or substring between markers!
// I'll just use regex or split.
// Actually, I can just use AST or simple substring if I know the exact boundaries.

let analyzeIssue = code.substring(code.indexOf('app.post("/api/analyze-issue"'), code.indexOf('app.post("/api/suggest-update"'));
let suggestUpdate = code.substring(code.indexOf('app.post("/api/suggest-update"'), code.indexOf('app.post("/api/detect-duplicates"'));
let generateImpact = code.substring(code.indexOf('app.post("/api/generate-impact-insight"'), code.indexOf('// Civic Intelligence Layer API Routes'));
let intelGenerate = code.substring(code.indexOf('app.post("/api/intelligence/generate"'), code.indexOf('app.post("/api/intelligence/explain"'));
let intelExplain = code.substring(code.indexOf('app.post("/api/intelligence/explain"'), code.indexOf('app.post(\n    "/api/intelligence/predict-hotspots"'));

let detectDuplicates = `
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

      const systemInstruction = \`You are CivicDuplicate AI. Your job is to compare a new citizen report's description against a list of nearby existing reports of the same category and decide if any describe the exact same real-world problem (e.g. the same physical pothole, the same garbage overflow pile, the same water leakage) rather than just being a similar category of problem in the general vicinity.\`;

      const contents = \`New report description: "\${description}"

Nearby existing reports of the same category:
\${JSON.stringify(topCandidates.map(c => ({id: c.id, title: c.title, description: c.description, createdAt: new Date(c.createdAt).toISOString()})), null, 2)}\`;

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
`;

let predictHotspots = `
  app.post("/api/intelligence/predict-hotspots", async (req, res) => {
    try {
      const { issues } = req.body;
      if (!issues) return res.json({ forecasts: [] });
      
      const buckets = {};

      issues.forEach((data) => {
        const category = data.category;
        const area = data.address || data.locationType || "Unknown Area";
        if (!category) return;

        const key = \`\${category}::\${area}\`;
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

      const systemInstruction = \`You are CivicForecast AI. Predict which recurring issues are likely to need attention again in 30 days.\`;
      const contents = \`Here is the aggregated data of recurring civic issues:
\${JSON.stringify(recurringBuckets, null, 2)}
Forecast which are likely to recur in the next 30 days. Return up to 8 forecasts, sorted by riskLevel (High first).\`;

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
`;

const newServerCode = `import express from "express";
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

  ${analyzeIssue}
  ${suggestUpdate}
  ${detectDuplicates}
  ${generateImpact}
  ${intelGenerate}
  ${intelExplain}
  ${predictHotspots}

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
    console.log(\`Server running on http://localhost:\${PORT}\`);
  });
}

startServer();
`;

fs.writeFileSync('server.ts', newServerCode);
console.log('Done!');
