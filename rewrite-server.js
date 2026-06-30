const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const aiRoutesStart = code.indexOf('  // API Route for Gemini analysis');
const aiRoutesEnd = code.indexOf('  // Vite middleware for development');

if (aiRoutesStart !== -1 && aiRoutesEnd !== -1) {
  const aiRoutes = code.substring(aiRoutesStart, aiRoutesEnd);
  
  const newServer = `import express from "express";
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

${aiRoutes}

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

  fs.writeFileSync('server.ts', newServer);
  console.log('server.ts successfully rewritten!');
} else {
  console.log('Could not find markers');
}
