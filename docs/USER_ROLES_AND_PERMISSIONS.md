# Community Hero - User Roles & Permissions

## Project Context
Community Hero is an AI-powered civic issue reporting platform. This document serves as the single source of truth for authentication, authorization, dashboards, and the platform's permission model. It defines the responsibilities, workflows, and feature access for all user roles.

## User Types

### 1. Citizen
**Purpose**: The primary end-user who reports civic issues, verifies others' reports, and confirms resolutions to improve their local community.
- **Responsibilities**: Report accurate issues, provide clear images/descriptions, verify local problems reported by others, confirm when an issue is actually resolved.
- **Allowed actions**: 
  - Register and login (Google/Email).
  - Submit new civic issues.
  - Verify existing open issues in their vicinity.
  - Dispute false reports.
  - Confirm resolution of issues they reported or verified.
- **Restrictions**: Cannot change official issue status (only confirm resolution), cannot assign departments, cannot access admin/department dashboards.
- **Dashboard features**: Personal impact metrics, local area map, feed of nearby issues.
- **Issue lifecycle**: Report -> AI Review -> Community Verification -> Department Action -> Citizen Confirmation.
- **Verification abilities**: Can verify or dispute issues.
- **Profile capabilities**: View contribution points, badges, history of reported and verified issues.
- **Achievements**: Earn badges for first reports, trusted verifications, and resolution confirmations.
- **Reputation**: Gamified contribution points system based on valid reports and verifications.
- **Notifications**: Updates on reported/verified issues.
- **History**: Log of all personal civic actions.

### 2. Department Officer
**Purpose**: Official representatives of civic departments (e.g., Water Board, Sanitation) responsible for resolving assigned issues.
- **Department ownership**: Assigned to a specific department (e.g., "Road Maintenance").
- **Responsibilities**: Monitor assigned issues, dispatch workers, resolve problems, and provide evidence of completion.
- **Issue management**: View queue of issues assigned to their department, filter by priority and status.
- **Status updates**: Change status to "In Progress" or "Resolved".
- **Evidence upload**: Add resolution notes and upload photos of fixed issues.
- **Resolution notes**: Provide public-facing context on the fix.
- **Internal workflow**: Receive -> Inspect -> Update Status -> Resolve -> Provide Evidence.
- **Dashboard**: Queue of assigned issues, department performance metrics, average resolution time.
- **Analytics**: Department-specific resolution metrics and SLAs.
- **Restrictions**: Cannot reassign to other departments, cannot delete issues, cannot modify user roles, cannot access platform-wide admin settings.
- **Notifications**: Alerts for new high-priority assignments.
- **Communication with citizens**: Indirect via resolution notes and status updates.

### 3. Administrator
**Purpose**: Platform operators who oversee issue routing, moderate content, and manage department accounts.
- **Responsibilities**: Triage unassigned issues, monitor AI prioritization, manage department performance, handle escalations.
- **Platform management**: Monitor overall platform health and issue resolution rates.
- **Issue oversight**: View all issues across all departments, reassign misclassified issues, mark issues as duplicates or invalid.
- **Department management**: Create and manage Department Officer accounts.
- **Analytics**: View platform-wide impact dashboards, category breakdowns, and AI-generated civic insights.
- **User moderation**: Disable malicious citizen accounts, moderate disputed issues.
- **AI monitoring**: Review AI categorization and severity scores.
- **Platform configuration**: Manage issue categories and tags.
- **Audit logs**: View logs related to issue status changes and user moderation.
- **System reports**: Generate SLA and performance reports.
- **Restrictions**: **CANNOT** create other Administrators or Super Administrators. Cannot modify platform-wide security policies.
- **Escalation workflow**: Escalate "Critical" severity issues directly to emergency responders if applicable.

### 4. Super Administrator
**Purpose**: The ultimate governing authority of the platform. A bootstrap role for system governance and security.
- **Responsibilities**: Create and manage Administrators, configure global settings, manage the security model.
- **Administrator management**: Create, promote, demote, and deactivate Administrator accounts.
- **Platform management**: Unrestricted access to all dashboards, settings, and data.
- **System configuration**: Configure platform-wide settings (e.g., AI model selection, point system weights).
- **Security policies**: Manage core authorization rules.
- **Seed system data**: Bootstrap initial departments, categories, and test data.
- **Audit logs**: View all system audit logs, including Administrator actions.
- **Emergency override**: Override any issue status, permission, or routing.
- **Role permissions**: Adjust RBAC (Role-Based Access Control) definitions.

## Permission Model

### Permission Inheritance
`Citizen` -> `Department` -> `Administrator` -> `Super Administrator`

### Permission Matrix

| Feature / Action | Citizen | Department | Administrator | Super Admin |
| :--- | :---: | :---: | :---: | :---: |
| **Read Issues (Public)** | ✅ | ✅ | ✅ | ✅ |
| **Create Issues** | ✅ | ✅ | ✅ | ✅ |
| **Verify / Dispute** | ✅ | ❌ | ✅ | ✅ |
| **Confirm Resolution** | ✅ | ❌ | ✅ | ✅ |
| **Update Issue Status** | ❌ | ✅ (Own Dept) | ✅ | ✅ |
| **Assign Departments** | ❌ | ❌ | ✅ | ✅ |
| **Delete Issues**| ❌ | ❌ | ✅ | ✅ |
| **Manage Citizens** | ❌ | ❌ | ✅ | ✅ |
| **Manage Departments** | ❌ | ❌ | ✅ | ✅ |
| **Manage Admins** | ❌ | ❌ | ❌ | ✅ |
| **Manage Roles** | ❌ | ❌ | ❌ | ✅ |
| **View Platform Analytics**| ❌ | ❌ | ✅ | ✅ |
| **View Dept Analytics** | ❌ | ✅ (Own Dept) | ✅ | ✅ |
| **Export Reports** | ❌ | ✅ | ✅ | ✅ |
| **View Audit Logs** | ❌ | ❌ | ✅ (Limited)| ✅ (Full) |
| **System Settings** | ❌ | ❌ | ❌ | ✅ |
| **AI Monitoring** | ❌ | ❌ | ✅ | ✅ |

## Complete Feature Breakdown

- **Authentication**: All roles (Google Sign-in / Email).
- **Dashboard**: 
  - Citizen: Personal impact.
  - Department: Assigned queue.
  - Admin/Super Admin: Platform analytics.
- **Issue Reporting**: All roles.
- **Issue Verification**: Citizens, Admins.
- **Issue Tracking**: All roles.
- **Issue Editing**: 
  - Citizen: Only before submission.
  - Admin: Full edit rights.
- **Issue Assignment**: Admins, Super Admins.
- **Department Management**: Admins, Super Admins.
- **Announcements**: Admins, Super Admins (Create), All (Read).
- **Leaderboard**: Citizens.
- **Achievements / Points**: Citizens.
- **AI Analysis**: Backend service triggered by Citizen reporting. Admins monitor results.
- **Analytics**: Departments (Internal), Admins (Global).
- **Notifications**: All roles (context-dependent).
- **Profile**: All roles.
- **Map / Search / Filters**: All roles.
- **Reports**: Departments, Admins, Super Admins.
- **History**: Citizens (Personal), Admins (Global).
- **Settings**: Super Admins.

## User Journeys

### Citizen Workflow
`Register` -> `Report issue` -> `AI review` -> `Community verification` -> `Department action` -> `Citizen confirmation` -> `Impact recorded`

### Department Workflow
`Receive assignment` -> `Inspect issue` -> `Update status` -> `Upload evidence` -> `Resolve` -> `Citizen confirmation`

### Administrator Workflow
`Monitor platform` -> `Assign department` -> `Review priorities` -> `Escalate urgent cases` -> `Monitor KPIs`

### Super Admin Workflow
`Login` -> `Create Administrator` -> `Configure departments` -> `Review audit logs` -> `Manage platform`

## Security Model

- **Role Hierarchy**: Strict hierarchical enforcement via Firebase Custom Claims and Firestore Security Rules.
- **Authentication Flow**: New users self-register and are always assigned the citizen role by default. The Super Admin account is bootstrapped automatically on first login for any email address listed in the BOOTSTRAP_ADMIN_EMAILS environment variable — this is the only account that receives super_admin directly; it cannot be self-requested. Department roles are not self-assignable: a citizen must submit a role request via /apply-for-role, which creates a pending roleRequests document. The Super Admin reviews all pending requests at /admin/role-requests and either approves (which updates the user's role and Firebase custom claims) or rejects (with a required explanation note sent back to the applicant as an in-app notification).
- **Authorization Model**: 
  - Route guards on the frontend prevent unauthorized dashboard access.
  - Firestore rules validate `request.auth.token.role` to prevent unauthorized reads/writes.
- **Admin Creation Rules**: Only Super Admins can assign the `admin` custom claim.
- **Department Creation Rules**: Admins or Super Admins can assign the `department` custom claim and link a `departmentName`.
- **Permission Inheritance**: Higher roles implicitly inherit read capabilities of lower roles, but write capabilities are strictly scoped (e.g., Departments can only update assigned issues).
- **Protected Routes**: React Router utilizes a `RequireAuth` wrapper checking the user's role claim against allowed roles for a given path.
- **Firestore Role Validation**: `firestore.rules` must explicitly check `getUserData().role`.
- **Future Scalability Considerations**: Design roles as an array of permissions or utilize a dedicated RBAC collection if dynamic roles are needed in the future.

### Role Request Workflow

Citizens can apply for a Department role through a self-service form at
/apply-for-role. Each submission creates a document in the roleRequests
Firestore collection with status: 'pending'. The Super Admin is notified
immediately via in-app notification.

The lifecycle is: pending → approved or rejected.
- Approved: the user's Firestore role and Firebase custom claims are updated
  immediately. The user sees the change reflected in their active session
  without needing to reload (live onSnapshot listener in AuthContext).
- Rejected: the user's role is unchanged. They receive a notification
  containing the reviewer's explanation note, and may submit a new request.

Every role request action (submitted, approved, rejected), as well as admin
user-management actions (create user, update role, disable/enable user), is
written to the audit_logs Firestore collection. Audit logs are readable by
Admin and Super Admin roles at /admin/audit-logs and are never writable from
the client (enforced by Firestore security rules).

## Future Features
- **Multi-city deployment**: Scoping issues and departments by geographic region or city ID.
- **District administrators**: Mid-level admins restricted to specific geographic zones.
- **Department supervisors**: Role to manage multiple officers within a single department.
- **Government integrations**: Webhooks and API exports for municipal CRMs.
- **SMS & Email notifications**: Proactive alerts for critical issues.
- **Emergency responders**: Direct dispatch integration for "Critical" severity reports.
- **NGO partnerships**: Special organizational roles for community cleanup drives.
- **Volunteer coordinators**: Tools to organize citizens for community-led resolutions.
