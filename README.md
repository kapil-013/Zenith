# Community Hero

**Community Hero turns local problems into community action.**

It is an AI-powered hyperlocal civic issue reporting and resolution platform that transforms citizen complaints into verified, prioritized, and trackable community action.

## Problem Statement
Traditional civic issue reporting mechanisms are often opaque, slow, and lack prioritization. Citizens don't know if their voice is heard, and authorities are overwhelmed with unverified, unstructured data.

## Solution Summary
Community Hero solves this by:
1. Using AI to parse images and text into structured, actionable data.
2. Crowdsourcing community verification to validate severity and prevent spam.
3. Automatically prioritizing issues based on calculated community impact.
4. Providing transparent timelines and analytics for both citizens and authorities.

## Google Technologies & Tech Stack
- **Gemini API (Server-side):** Uses `gemini-2.5-flash` for multimodal civic issue analysis and trend insight generation.
- **Firebase Auth:** Google Sign-In for seamless citizen onboarding.
- **Firestore:** Real-time database for issues, verifications, and status updates.
- **Firebase Storage:** Stores compressed visual evidence of civic issues.
- **React + Vite:** Frontend framework with Neumorphic UI design.
- **Node.js + Express:** Backend API proxy to securely handle Gemini calls.
- **Tailwind CSS & Framer Motion:** For clean styling and interactive feedback.

## AI Features
- **Multimodal Issue Detection:** AI evaluates uploaded images to estimate severity, confidence, and suggest the responsible government department.
- **Dual Summarization:** Generates both a citizen-friendly summary and an action-oriented authority summary.
- **Spam Prevention:** Detects discrepancies between images and descriptions to flag spam.
- **Civic Insights:** AI processes the recent issue queue to summarize local trends, hotspots, and recommend actions for admins.

## Core Flows
- **Citizen Flow:** Report an issue -> Analyze with AI -> Submit -> Earn Contribution Points -> Track Resolution.
- **Community Flow:** Browse Map/Feed -> Verify/Dispute Issues -> Confirm Fixes.
- **Admin Flow:** View Dashboard -> Filter by Priority -> Assign Department -> Mark In Progress/Resolved.

## Demo Flow Guide (Hackathon)
1. **Load Seed Data:** As an Admin, click "Load Demo Data" to populate the dashboard with realistic issues around Delhi NCR.
2. **Report an Issue:** Click "Report Issue". Upload a photo (e.g., a pothole). Click "Analyze with AI". Watch Gemini classify the issue and generate summaries.
3. **Submit & View:** Submit the report and view its detailed Priority Score calculation.
4. **Community Action:** Sign in as another user (or verify your own for demo purposes) and click "Verify".
5. **Admin Resolution:** Navigate to the Command Center (Admin). Enable Demo Admin if required. Click "Assign Dept", add a note, and change the status to "Resolved".
6. **Impact Dashboard:** View the aggregated impact and AI-generated trends.

## Setup & Development

```bash
npm install
npm run dev
```

### Environment Variables
Configure your `.env` file based on `.env.example`:
```env
GEMINI_API_KEY=your_gemini_api_key
```
Note: Firebase configuration is injected via AI Studio Firebase integration.

## Future Scope
- Integration with municipal APIs for automated ticketing.
- Real-time notifications (SMS/Email) for status changes.
- Multilingual support for broader citizen accessibility.
- Drone integration for AI-based city scanning.

## Deployment Health Check
Before final submission, confirm the deployed app is stable:
- Open deployed app in incognito.
- Test Report Issue.
- Test Analyze with AI.
- Confirm AI card says Gemini, not fallback.
- Submit issue.
- Verify issue.
- Enable Demo Admin.
- Assign department.
- Change status.
- Confirm resolution.
- View Impact dashboard.
