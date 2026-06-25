import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";
import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
try {
  admin.initializeApp();
} catch (e) {
  console.log("Firebase Admin already initialized or failed to initialize via ADC:", e);
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "50mb" }));

  // Middleware to authenticate requests via Firebase Admin
  const authenticateAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.split("Bearer ")[1];
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      (req as any).user = decodedToken;
      next();
    } catch (e) {
      return res.status(401).json({ error: "Invalid token" });
    }
  };

  const requireAdminRole = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    
    // Check if user is admin either via claims or Firestore
    let isAdmin = user.role === "admin";
    if (!isAdmin) {
      const userDoc = await getFirestore().collection("users").doc(user.uid).get();
      if (userDoc.exists && userDoc.data()?.role === "admin") {
        isAdmin = true;
      }
    }
    
    if (!isAdmin) {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }
    next();
  };

  // Sync user route (called from frontend when user doc doesn't exist)
  app.post("/api/auth/sync-user", authenticateAdmin, async (req, res) => {
    try {
      const { name, photoURL } = req.body;
      const { uid, email } = (req as any).user;
      
      const bootstrapEmails = (process.env.BOOTSTRAP_ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
      const isBootstrapAdmin = email && bootstrapEmails.includes(email.toLowerCase());
      
      const role = isBootstrapAdmin ? "admin" : "citizen";
      
      // Set custom claims if admin
      if (role === "admin") {
        await getAuth().setCustomUserClaims(uid, { role: "admin" });
      }

      const newUser = {
        uid,
        name: name || "Citizen",
        email: email || "",
        photoURL: photoURL || "",
        role,
        departmentName: null,
        status: "active",
        points: 0,
        badges: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastLoginAt: Date.now(),
      };

      await getFirestore().collection("users").doc(uid).set(newUser, { merge: true });
      res.json({ success: true, user: newUser });
    } catch (error: any) {
      console.error("Sync user error:", error);
      res.status(500).json({ error: "Failed to sync user" });
    }
  });

  // Admin Routes
  app.get("/api/admin/users", authenticateAdmin, requireAdminRole, async (req, res) => {
    try {
      const usersSnap = await getFirestore().collection("users").get();
      const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/create-user", authenticateAdmin, requireAdminRole, async (req, res) => {
    try {
      const { name, email, password, role, departmentName } = req.body;
      
      if (!["admin", "department"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      if (role === "department" && !departmentName) {
        return res.status(400).json({ error: "Department name is required for department role" });
      }

      const userRecord = await getAuth().createUser({
        email,
        password,
        displayName: name,
      });

      await getAuth().setCustomUserClaims(userRecord.uid, { role });

      const newUser = {
        uid: userRecord.uid,
        name,
        email,
        role,
        departmentName: role === "department" ? departmentName : null,
        status: "active",
        points: 0,
        badges: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await getFirestore().collection("users").doc(userRecord.uid).set(newUser);
      
      res.json({ success: true, user: newUser });
    } catch (error: any) {
      console.error("Create user error:", error);
      res.status(500).json({ error: error.message || "Failed to create user" });
    }
  });

  app.post("/api/admin/update-user-role", authenticateAdmin, requireAdminRole, async (req, res) => {
    try {
      const { uid, role, departmentName } = req.body;
      await getAuth().setCustomUserClaims(uid, { role });
      await getFirestore().collection("users").doc(uid).update({
        role,
        departmentName: role === "department" ? departmentName : null,
        updatedAt: Date.now(),
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update role" });
    }
  });

  app.post("/api/admin/disable-user", authenticateAdmin, requireAdminRole, async (req, res) => {
    try {
      const { uid, disabled } = req.body;
      await getAuth().updateUser(uid, { disabled });
      await getFirestore().collection("users").doc(uid).update({
        status: disabled ? "disabled" : "active",
        updatedAt: Date.now(),
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to disable user" });
    }
  });

  // API Route for Gemini analysis
  app.post("/api/analyze-issue", async (req, res) => {
    try {
      const { description, address, locationType, imageBase64, mimeType } = req.body;

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
        parts: [
          { text: prompt }
        ]
      };

      if (imageBase64 && mimeType) {
        contents.parts.unshift({
          inlineData: {
            mimeType: mimeType,
            data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
          }
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
            category: { type: Type.STRING, description: "Pothole | Garbage Overflow | Water Leakage | Broken Streetlight | Sewage Issue | Road Blockage | Damaged Infrastructure | Unsafe Public Area | Other" },
            severity: { type: Type.STRING, description: "Low | Medium | High | Critical" },
            confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1" },
            suggestedDepartment: { type: Type.STRING, description: "Road Maintenance | Sanitation Department | Water Board | Electrical Maintenance | Drainage Department | Public Works | Traffic Management | Community Volunteers | General Civic Helpdesk" },
            citizenSummary: { type: Type.STRING, description: "short public-friendly explanation" },
            authoritySummary: { type: Type.STRING, description: "short action-oriented operational summary" },
            riskReason: { type: Type.STRING, description: "why this issue matters" },
            spamRisk: { type: Type.STRING, description: "Low | Medium | High" },
            verificationQuestion: { type: Type.STRING, description: "question nearby citizens can answer" },
            recommendedAction: { type: Type.STRING, description: "practical next step" },
            priorityHints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "reasons for priority" }
          },
          required: ["title", "category", "severity", "confidence", "suggestedDepartment", "citizenSummary", "authoritySummary", "riskReason", "spamRisk", "verificationQuestion", "recommendedAction", "priorityHints"]
        }
      };

      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
          config: generateConfig
        });
      } catch (err) {
        console.warn("gemini-2.5-flash failed, falling back to gemini-2.5-flash-lite...");
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents,
          config: generateConfig
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
        authoritySummary: "Issue reported. Please verify manually due to AI analysis timeout.",
        riskReason: "May cause inconvenience.",
        spamRisk: "Medium",
        verificationQuestion: "Can you confirm if this issue is still present?",
        recommendedAction: "Review manually.",
        priorityHints: ["Needs manual review due to AI analysis failure"],
        isFallback: true
      });
    }
  });

  app.post("/api/generate-impact-insight", async (req, res) => {
    try {
      const { issues } = req.body;
      const prompt = `You are CivicInsight AI. Analyze the issue dataset and summarize civic trends for local administrators.
Focus on repeated issue categories, unresolved high-priority issues, hotspots, and recommended actions.
Do not exaggerate. Keep recommendations practical.

Issue Data:
${JSON.stringify((issues || []).map((i: any) => ({
  category: i.category,
  severity: i.severity,
  status: i.status,
  location: i.address || i.locationType,
  priorityScore: i.priorityScore,
  verificationCount: i.verificationCount,
  createdAt: i.createdAt
})).slice(0, 100), null, 2)}`;

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
                recommendedActions: { type: Type.ARRAY, items: { type: Type.STRING } },
                riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
              },
              required: ["headline", "summary", "hotspots", "recommendedActions", "riskLevel"]
            }
          }
        });
      } catch (err) {
        console.warn("gemini-2.5-pro failed, falling back to gemini-2.5-flash-lite...");
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
                recommendedActions: { type: Type.ARRAY, items: { type: Type.STRING } },
                riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
              },
              required: ["headline", "summary", "hotspots", "recommendedActions", "riskLevel"]
            }
          }
        });
      }
      
      const text = result.text;
      if (!text) throw new Error("No response text");
      res.json(JSON.parse(text.trim()));
    } catch (error) {
      console.error("AI Insight Error:", error);
      res.json({
        headline: "Civic Insights (Mock)",
        summary: "AI analysis is currently unavailable. This is a default fallback insight.",
        hotspots: ["Various Locations"],
        recommendedActions: ["Review high priority issues manually"],
        riskLevel: "Medium"
      });
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
