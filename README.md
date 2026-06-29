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

## Demo Credentials
Since the application uses Firebase Authentication for secure citizen and authority identities, we provide a complete suite of demo credentials that can be seeded automatically:

1. **Seed Demo Accounts**: After initializing the project, run the seeding script:
   ```bash
   npm run seed:demo
   ```
   This will automatically create **11 demo accounts** (1 Super Admin, 1 Citizen, and 9 Department Officers for each unique city division) in both Firebase Auth and Firestore with the password `Demo@1234`.
2. **Access Detailed Listing**: For the full table of emails and roles, along with an end-to-end walkthrough script, please refer to [DEMO_CREDENTIALS.md](./DEMO_CREDENTIALS.md).
3. **Direct Demo Mode**: You can also toggle the interactive **Demo Mode** button in the header at any time to receive floating, real-time guidance directly inside the running application interface.

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
- AI duplicate detection — before submitting, citizens are warned if a nearby open issue of the same category already exists, with a confidence score and option to verify the existing issue instead.
- Predictive hotspot forecasting — admins can generate a CivicForecast showing which area/category patterns from the last 90 days are most likely to recur in the next 30 days, with risk levels and reasoning.

## Core Flows
- **Citizen Flow:** Report an issue -> Analyze with AI -> Submit -> Earn Contribution Points -> Track Resolution.
- **Community Flow:** Browse Map/Feed -> Verify/Dispute Issues -> Confirm Fixes.
- **Admin Flow:** View Dashboard -> Filter by Priority -> Assign Department -> Mark In Progress/Resolved.

## Demo Flow Guide (Hackathon)
1. **Submit & Analyze (Citizen):** Log in as `communityhero.citizen@demo.app` or register a new citizen. Click **Report an Issue**, upload a photo, and click **Analyze with AI** to see CivicVision AI run real-time duplicate detection, department routing, and calculate a Community Priority Score.
2. **Request Role (Citizen):** Visit your **Profile**, click **Apply for Role**, choose **Sanitation Department**, fill out the brief form, and submit.
3. **Approve Application (Super Admin):** Log in as `communityhero.superadmin@demo.app` (Super Admin). Go to the **Admin Dashboard** -> **Role Requests** and click **Approve** on the pending request.
4. **Resolve Assigned Task (Department):** Log in as `communityhero.roadmaintenance@demo.app` or `communityhero.sanitation@demo.app`. Access the `/department` dashboard, select an assigned issue, post progress updates, and mark it as **Resolved**.
5. **Confirm Resolution (Citizen):** Log back in as the Citizen, view the resolved issue, and click **Confirm Resolution** to close the feedback loop and receive civic contribution points on your **Profile**.
6. **Analytics & Forecasts (Admin):** Log back in as Super Admin and view the `/impact` dashboard to check city-wide resolution statistics and generate a predictive AI hotspot forecast.

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
- Video-based issue reporting with AI scene analysis.
- Federated multi-city deployment with cross-city hotspot benchmarking.
- Drone integration for AI-based city scanning.

## Deployment Health Check
Before final submission, confirm the deployed app is stable:
- Open deployed app in incognito.
- Test Report Issue.
- Test Analyze with AI.
- Confirm AI card says Gemini, not fallback.
- Submit issue.
- Verify issue.
- Request Department Role via Profile page.
- Approve role request as Super Admin.
- Log in as Department Officer to assign and change status.
- Confirm resolution as Citizen.
- View Impact dashboard and AI forecasts.
