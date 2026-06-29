# Demo Credentials

These credentials are automatically seeded using the command `npm run seed:demo`. They are intended purely for local development, testing, and hackathon judging/demos.

## Seeded Accounts

| Role | Department | Email | Password |
| :--- | :--- | :--- | :--- |
| **Super Admin** | N/A | `communityhero.superadmin@demo.app` | `Demo@1234` |
| **Citizen** | N/A | `communityhero.citizen@demo.app` | `Demo@1234` |
| **Department** | Road Maintenance | `communityhero.roadmaintenance@demo.app` | `Demo@1234` |
| **Department** | Sanitation Department | `communityhero.sanitation@demo.app` | `Demo@1234` |
| **Department** | Water Board | `communityhero.waterboard@demo.app` | `Demo@1234` |
| **Department** | Electrical Maintenance | `communityhero.electricalmaintenance@demo.app` | `Demo@1234` |
| **Department** | Drainage Department | `communityhero.drainagedepartment@demo.app` | `Demo@1234` |
| **Department** | Public Works | `communityhero.publicworks@demo.app` | `Demo@1234` |
| **Department** | Traffic Management | `communityhero.trafficmanagement@demo.app` | `Demo@1234` |
| **Department** | Community Volunteers | `communityhero.communityvolunteers@demo.app` | `Demo@1234` |
| **Department** | General Civic Helpdesk | `communityhero.generalcivichelpdesk@demo.app` | `Demo@1234` |

---

> [!WARNING]
> **CRITICAL SECURITY WARNING**
>
> **These are demo credentials with a shared, publicly-documented password. Never use the seeding script or these accounts against a production Firebase project. Rotate or delete them before any real deployment, and never display this file's contents inside the live app UI.**

---

## Suggested Demo Walkthrough

Follow these steps to experience and showcase the complete hyperlocal civic accountability loop in under 3 minutes:

1. **Submit a New Report with AI**
   - Log in as the Citizen: `communityhero.citizen@demo.app` (Password: `Demo@1234`).
   - Go to **Report** and upload a local civic issue image or select coordinates in Delhi NCR.
   - Click **Analyze with AI** to see **CivicVision AI** automatically categorize, summarize, assign severity, suggest a department, flag duplicate issues, and calculate a Community Priority Score. Submit the issue.

2. **Apply for a Department Role**
   - While logged in as the Citizen, navigate to your **Profile** page.
   - Click **Apply for Role** (goes to `/apply-for-role`).
   - Choose the **Sanitation Department**, write a brief motivation letter, and click **Submit Application**.

3. **Approve Role Request as Super Admin**
   - Log out, and log in as the Super Admin: `communityhero.superadmin@demo.app` (Password: `Demo@1234`).
   - Navigate to the **Admin Dashboard** and open **Role Requests** (`/admin/role-requests`).
   - Review the Citizen's Sanitation Department request and click **Approve** (this instantly updates their Firebase custom claim and Firestore document).

4. **Resolve Issue as Department Officer**
   - Log out, and log in as the Road Maintenance department account: `communityhero.roadmaintenance@demo.app` (Password: `Demo@1234`).
   - Go to `/department` (Department Dashboard) to see issues currently assigned to **Road Maintenance**.
   - Select an assigned issue, post a progress note, and mark the issue as **Resolved**.

5. **Confirm Resolution as Citizen**
   - Log back in as the Citizen: `communityhero.citizen@demo.app` (Password: `Demo@1234`).
   - Open the resolved issue detail page.
   - Verify the work and click **Confirm Resolution** to close the feedback loop and earn civic contribution points!

6. **Analyze Impact and Forecasts**
   - Log back in as the Super Admin: `communityhero.superadmin@demo.app` (Password: `Demo@1234`).
   - Visit the **Impact** dashboard to check total reports, verified counts, resolved stats, and the **AI Predictive Hotspots** trends analysis.
   - Visit the **Leaderboard** to see top civic contributors.
