import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";
import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { sendEmail } from "./src/lib/notifications/email";
import { sendSms } from "./src/lib/notifications/sms";
import {
  hasPermission,
  Permission,
  isAdminOrSuperAdmin,
  isSuperAdmin,
  UserRole,
} from "./src/lib/auth/permissions";
import {
  INSIGHT_GENERATOR_SYSTEM_PROMPT,
  EXPLAINABILITY_SYSTEM_PROMPT,
  buildInsightPrompt,
  buildExplainabilityPrompt,
} from "./src/lib/ai/prompts";

// Initialize Firebase Admin
try {
  admin.initializeApp();
} catch (e) {
  console.log(
    "Firebase Admin already initialized or failed to initialize via ADC:",
    e,
  );
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function deliverExternalNotifications(recipientId: string, title: string, message: string) {
  try {
    const userDoc = await getFirestore().collection("users").doc(recipientId).get();
    if (!userDoc.exists) return;
    const userData = userDoc.data();
    if (!userData) return;

    const email = userData.email;
    const phone = userData.phone;
    const emailPref = userData.preferences?.notificationPreferences?.email !== false;
    const smsPref = userData.preferences?.notificationPreferences?.sms === true;

    if (emailPref && email) {
      sendEmail(email, title, message).catch((err) => {
        console.error("Error in sendEmail fire-and-forget:", err);
      });
    }

    if (smsPref && phone) {
      sendSms(phone, `${title}: ${message}`).catch((err) => {
        console.error("Error in sendSms fire-and-forget:", err);
      });
    }
  } catch (error) {
    console.error("Failed to deliver external notifications for user:", recipientId, error);
  }
}

function startNotificationListener() {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  getFirestore()
    .collection("notifications")
    .where("createdAt", ">", fiveMinutesAgo)
    .onSnapshot(
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const notif = change.doc.data();
            if (notif && notif.recipientId && notif.title && notif.message) {
              const targetTypes = [
                "RoleRequestSubmitted",
                "RoleRequestApproved",
                "RoleRequestRejected",
                "IssueStatusChanged",
                "IssueReported",
                "IssueAssigned"
              ];
              if (targetTypes.includes(notif.type)) {
                deliverExternalNotifications(notif.recipientId, notif.title, notif.message);
              }
            }
          }
        });
      },
      (error) => {
        console.error("Error in notifications Firestore listener:", error);
      }
    );
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "50mb" }));

  // Middleware to authenticate requests via Firebase Admin
  const authenticateAdmin = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
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

  const requireAdminRole = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    let isAdmin = isAdminOrSuperAdmin(user.role);
    if (!isAdmin) {
      const userDoc = await getFirestore()
        .collection("users")
        .doc(user.uid)
        .get();
      if (userDoc.exists && isAdminOrSuperAdmin(userDoc.data()?.role)) {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: "Forbidden: Admin access required" });
    }
    next();
  };

  const requireSuperAdminRole = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    let isSuper = isSuperAdmin(user.role);
    if (!isSuper) {
      const userDoc = await getFirestore()
        .collection("users")
        .doc(user.uid)
        .get();
      if (userDoc.exists && isSuperAdmin(userDoc.data()?.role)) {
        isSuper = true;
      }
    }

    if (!isSuper) {
      return res
        .status(403)
        .json({ error: "Forbidden: Super Admin access required" });
    }
    next();
  };

  // Sync user route (called from frontend when user doc doesn't exist)
  app.post("/api/auth/sync-user", authenticateAdmin, async (req, res) => {
    try {
      const { name, photoURL } = req.body;
      const { uid, email } = (req as any).user;

      const bootstrapEmails = (process.env.BOOTSTRAP_ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase());
      const isBootstrapAdmin =
        email && bootstrapEmails.includes(email.toLowerCase());

      const role = isBootstrapAdmin ? UserRole.SUPER_ADMIN : UserRole.CITIZEN;

      // Set custom claims if admin
      if (role === UserRole.SUPER_ADMIN) {
        await getAuth().setCustomUserClaims(uid, {
          role: UserRole.SUPER_ADMIN,
        });
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

      await getFirestore()
        .collection("users")
        .doc(uid)
        .set(newUser, { merge: true });
      res.json({ success: true, user: newUser });
    } catch (error: any) {
      console.error("Sync user error:", error);
      res.status(500).json({ error: "Failed to sync user" });
    }
  });

  // Admin Routes
  app.get(
    "/api/admin/users",
    authenticateAdmin,
    requireAdminRole,
    async (req, res) => {
      try {
        const usersSnap = await getFirestore().collection("users").get();
        const users = usersSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        res.json(users);
      } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch users" });
      }
    },
  );

  app.post(
    "/api/admin/create-user",
    authenticateAdmin,
    requireAdminRole,
    async (req, res) => {
      try {
        const { name, email, password, role, departmentName } = req.body;
        const requester = (req as any).user;

        const canManageAdmins = hasPermission(
          requester.role,
          Permission.MANAGE_ADMINS,
        );

        if (![UserRole.ADMIN, UserRole.DEPARTMENT].includes(role)) {
          return res.status(400).json({ error: "Invalid role" });
        }

        if (role === UserRole.ADMIN && !canManageAdmins) {
          return res.status(403).json({
            error:
              "Only users with MANAGE_ADMINS permission can create Administrators",
          });
        }

        if (role === UserRole.DEPARTMENT && !departmentName) {
          return res
            .status(400)
            .json({ error: "Department name is required for department role" });
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
          departmentName: role === UserRole.DEPARTMENT ? departmentName : null,
          status: "active",
          points: 0,
          badges: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        await getFirestore()
          .collection("users")
          .doc(userRecord.uid)
          .set(newUser);

        const requesterUserDoc = await getFirestore()
          .collection("users")
          .doc(requester.uid)
          .get();
        const requesterData = requesterUserDoc.data();

        const auditLogRef = getFirestore().collection("audit_logs").doc();
        await auditLogRef.set({
          id: auditLogRef.id,
          actorId: requester.uid,
          actorName: requesterData?.name || requester.email,
          actorRole: requesterData?.role || UserRole.SUPER_ADMIN,
          action: "admin_created_user",
          targetUserId: userRecord.uid,
          targetEmail: email,
          details: {
            role,
            departmentName:
              role === UserRole.DEPARTMENT ? departmentName : null,
          },
          createdAt: Date.now(),
        });

        res.json({ success: true, user: newUser });
      } catch (error: any) {
        console.error("Create user error:", error);
        res
          .status(500)
          .json({ error: error.message || "Failed to create user" });
      }
    },
  );

  app.post(
    "/api/admin/update-user-role",
    authenticateAdmin,
    requireAdminRole,
    async (req, res) => {
      try {
        const { uid, role, departmentName } = req.body;
        const requester = (req as any).user;
        const canManageAdmins = hasPermission(
          requester.role,
          Permission.MANAGE_ADMINS,
        );

        if (role === UserRole.ADMIN && !canManageAdmins) {
          return res.status(403).json({
            error:
              "Only users with MANAGE_ADMINS permission can manage Administrators",
          });
        }

        const targetUserDoc = await getFirestore()
          .collection("users")
          .doc(uid)
          .get();
        const targetRole = targetUserDoc.data()?.role;

        if (
          targetRole === UserRole.SUPER_ADMIN &&
          role !== UserRole.SUPER_ADMIN
        ) {
          const superAdminsSnapshot = await getFirestore()
            .collection("users")
            .where("role", "==", UserRole.SUPER_ADMIN)
            .get();
          if (superAdminsSnapshot.size <= 1) {
            return res
              .status(400)
              .json({ error: "Cannot remove the last Super Admin." });
          }
        }

        await getAuth().setCustomUserClaims(uid, { role });
        await getFirestore()
          .collection("users")
          .doc(uid)
          .update({
            role,
            departmentName:
              role === UserRole.DEPARTMENT ? departmentName : null,
            updatedAt: Date.now(),
          });

        const requesterUserDoc = await getFirestore()
          .collection("users")
          .doc(requester.uid)
          .get();
        const requesterData = requesterUserDoc.data();

        const auditLogRef = getFirestore().collection("audit_logs").doc();
        await auditLogRef.set({
          id: auditLogRef.id,
          actorId: requester.uid,
          actorName: requesterData?.name || requester.email,
          actorRole: requesterData?.role || UserRole.SUPER_ADMIN,
          action: "user_role_updated",
          targetUserId: uid,
          targetEmail: targetUserDoc.data()?.email || null,
          details: {
            oldRole: targetRole,
            newRole: role,
            departmentName:
              role === UserRole.DEPARTMENT ? departmentName : null,
          },
          createdAt: Date.now(),
        });

        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: "Failed to update role" });
      }
    },
  );

  app.post(
    "/api/admin/disable-user",
    authenticateAdmin,
    requireAdminRole,
    async (req, res) => {
      try {
        const { uid, disabled } = req.body;
        const requester = (req as any).user;
        const canManageAdmins = hasPermission(
          requester.role,
          Permission.MANAGE_ADMINS,
        );

        const targetUserDoc = await getFirestore()
          .collection("users")
          .doc(uid)
          .get();
        const targetRole = targetUserDoc.data()?.role;

        if (isAdminOrSuperAdmin(targetRole) && !canManageAdmins) {
          return res.status(403).json({
            error:
              "Only users with MANAGE_ADMINS permission can disable Administrators",
          });
        }

        if (targetRole === UserRole.SUPER_ADMIN && disabled) {
          const superAdminsSnapshot = await getFirestore()
            .collection("users")
            .where("role", "==", UserRole.SUPER_ADMIN)
            .get();
          if (superAdminsSnapshot.size <= 1) {
            return res
              .status(400)
              .json({ error: "Cannot remove the last Super Admin." });
          }
        }

        await getAuth().updateUser(uid, { disabled });
        await getFirestore()
          .collection("users")
          .doc(uid)
          .update({
            status: disabled ? "disabled" : "active",
            updatedAt: Date.now(),
          });

        const requesterUserDoc = await getFirestore()
          .collection("users")
          .doc(requester.uid)
          .get();
        const requesterData = requesterUserDoc.data();

        const auditLogRef = getFirestore().collection("audit_logs").doc();
        await auditLogRef.set({
          id: auditLogRef.id,
          actorId: requester.uid,
          actorName: requesterData?.name || requester.email,
          actorRole: requesterData?.role || UserRole.SUPER_ADMIN,
          action: disabled ? "user_disabled" : "user_enabled",
          targetUserId: uid,
          targetEmail: targetUserDoc.data()?.email || null,
          details: {},
          createdAt: Date.now(),
        });

        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: "Failed to disable user" });
      }
    },
  );

  // Role Request Routes
  app.post("/api/role-requests", authenticateAdmin, async (req, res) => {
    try {
      const { requestedRole, departmentName, reason } = req.body;
      const requester = (req as any).user;

      if (requestedRole !== "department" && requestedRole !== "admin") {
        return res.status(400).json({ error: "Invalid requested role." });
      }

      if (requestedRole === "admin") {
        return res.status(400).json({
          error:
            "Admin requests cannot be submitted via this form. Admins must be created by a Super Admin.",
        });
      }

      if (requestedRole === "department") {
        if (
          !departmentName ||
          typeof departmentName !== "string" ||
          departmentName.trim() === ""
        ) {
          return res.status(400).json({
            error: "Department name is required for department role requests.",
          });
        }
      }

      if (!reason || typeof reason !== "string" || reason.trim() === "") {
        return res.status(400).json({ error: "Reason is required." });
      }

      const pendingRequestsSnap = await getFirestore()
        .collection("roleRequests")
        .where("userId", "==", requester.uid)
        .where("status", "==", "pending")
        .get();

      if (!pendingRequestsSnap.empty) {
        return res.status(400).json({
          error: "You already have a pending role request.",
        });
      }

      const userDoc = await getFirestore()
        .collection("users")
        .doc(requester.uid)
        .get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found." });
      }

      const userData = userDoc.data()!;
      const now = Date.now();

      const newRequestRef = getFirestore().collection("roleRequests").doc();
      const newRequest = {
        id: newRequestRef.id,
        userId: requester.uid,
        userName: userData.name || requester.email,
        userEmail: userData.email,
        currentRole: userData.role || UserRole.CITIZEN,
        requestedRole,
        departmentName:
          requestedRole === "department" ? departmentName.trim() : null,
        reason: reason.trim(),
        status: "pending",
        reviewedBy: null,
        reviewerName: null,
        reviewNote: null,
        createdAt: now,
        updatedAt: now,
        reviewedAt: null,
      };

      await newRequestRef.set(newRequest);

      const auditLogRef = getFirestore().collection("audit_logs").doc();
      await auditLogRef.set({
        id: auditLogRef.id,
        actorId: requester.uid,
        actorName: userData.name || requester.email,
        actorRole: userData.role || UserRole.CITIZEN,
        action: "role_request_submitted",
        targetUserId: null,
        targetEmail: null,
        details: {
          requestedRole,
          departmentName:
            requestedRole === "department" ? departmentName.trim() : null,
        },
        createdAt: now,
      });

      const superAdminsSnap = await getFirestore()
        .collection("users")
        .where("role", "==", UserRole.SUPER_ADMIN)
        .get();

      const batch = getFirestore().batch();

      superAdminsSnap.forEach((doc) => {
        const notifRef = getFirestore().collection("notifications").doc();
        batch.set(notifRef, {
          recipientId: doc.id,
          recipientRole: UserRole.SUPER_ADMIN,
          type: "RoleRequestSubmitted",
          category: "Administrative",
          priority: "medium",
          title: "New role request",
          message: `${userData.name || requester.email} requested to manage ${requestedRole === "department" ? departmentName.trim() : "Admins"}`,
          deepLink: "/admin/role-requests",
          createdAt: now,
        });
      });
      await batch.commit();

      res.json({ success: true, request: newRequest });
    } catch (error: any) {
      console.error("Submit role request error:", error);
      res.status(500).json({ error: "Failed to submit role request." });
    }
  });

  app.get(
    "/api/role-requests",
    authenticateAdmin,
    requireSuperAdminRole,
    async (req, res) => {
      try {
        const { status } = req.query;
        let query: any = getFirestore().collection("roleRequests");

        if (
          status === "pending" ||
          status === "approved" ||
          status === "rejected"
        ) {
          query = query.where("status", "==", status);
        }

        query = query.orderBy("createdAt", "desc");

        const snapshot = await query.get();
        const requests = snapshot.docs.map((doc: any) => doc.data());

        res.json(requests);
      } catch (error: any) {
        console.error("Fetch role requests error:", error);
        res.status(500).json({ error: "Failed to fetch role requests." });
      }
    },
  );

  app.post(
    "/api/role-requests/:id/approve",
    authenticateAdmin,
    requireSuperAdminRole,
    async (req, res) => {
      try {
        const { id } = req.params;
        const { reviewNote } = req.body;
        const reviewer = (req as any).user;

        const requestRef = getFirestore().collection("roleRequests").doc(id);
        const requestDoc = await requestRef.get();

        if (!requestDoc.exists) {
          return res.status(404).json({ error: "Role request not found." });
        }

        const requestData = requestDoc.data()!;

        if (requestData.status !== "pending") {
          return res
            .status(400)
            .json({ error: "This request has already been reviewed." });
        }

        const reviewerUserDoc = await getFirestore()
          .collection("users")
          .doc(reviewer.uid)
          .get();
        const reviewerName = reviewerUserDoc.data()?.name || reviewer.email;

        const now = Date.now();

        await getAuth().setCustomUserClaims(requestData.userId, {
          role: requestData.requestedRole,
        });

        await getFirestore()
          .collection("users")
          .doc(requestData.userId)
          .update({
            role: requestData.requestedRole,
            departmentName: requestData.departmentName,
            status: "active",
            updatedAt: now,
          });

        await requestRef.update({
          status: "approved",
          reviewedBy: reviewer.uid,
          reviewerName,
          reviewNote: reviewNote || null,
          reviewedAt: now,
          updatedAt: now,
        });

        const auditLogRef = getFirestore().collection("audit_logs").doc();
        await auditLogRef.set({
          id: auditLogRef.id,
          actorId: reviewer.uid,
          actorName: reviewerName,
          actorRole: UserRole.SUPER_ADMIN,
          action: "role_request_approved",
          targetUserId: requestData.userId,
          targetEmail: requestData.userEmail,
          details: {
            requestedRole: requestData.requestedRole,
            departmentName: requestData.departmentName,
          },
          createdAt: now,
        });

        const notificationRef = getFirestore()
          .collection("notifications")
          .doc();
        await notificationRef.set({
          recipientId: requestData.userId,
          type: "RoleRequestApproved",
          category: "Administrative",
          priority: "high",
          title: "Request approved",
          message: `You're now a Department Official for ${requestData.departmentName}.`,
          deepLink: "/department",
          createdAt: now,
        });

        res.json({ success: true });
      } catch (error: any) {
        console.error("Approve role request error:", error);
        res.status(500).json({ error: "Failed to approve role request." });
      }
    },
  );

  app.post(
    "/api/role-requests/:id/reject",
    authenticateAdmin,
    requireSuperAdminRole,
    async (req, res) => {
      try {
        const { id } = req.params;
        const { reviewNote } = req.body;
        const reviewer = (req as any).user;

        if (
          !reviewNote ||
          typeof reviewNote !== "string" ||
          reviewNote.trim() === ""
        ) {
          return res
            .status(400)
            .json({ error: "Review note is required for rejection." });
        }

        const requestRef = getFirestore().collection("roleRequests").doc(id);
        const requestDoc = await requestRef.get();

        if (!requestDoc.exists) {
          return res.status(404).json({ error: "Role request not found." });
        }

        const requestData = requestDoc.data()!;

        if (requestData.status !== "pending") {
          return res
            .status(400)
            .json({ error: "This request has already been reviewed." });
        }

        const reviewerUserDoc = await getFirestore()
          .collection("users")
          .doc(reviewer.uid)
          .get();
        const reviewerName = reviewerUserDoc.data()?.name || reviewer.email;

        const now = Date.now();

        await requestRef.update({
          status: "rejected",
          reviewedBy: reviewer.uid,
          reviewerName,
          reviewNote: reviewNote.trim(),
          reviewedAt: now,
          updatedAt: now,
        });

        const auditLogRef = getFirestore().collection("audit_logs").doc();
        await auditLogRef.set({
          id: auditLogRef.id,
          actorId: reviewer.uid,
          actorName: reviewerName,
          actorRole: UserRole.SUPER_ADMIN,
          action: "role_request_rejected",
          targetUserId: requestData.userId,
          targetEmail: requestData.userEmail,
          details: {
            requestedRole: requestData.requestedRole,
            departmentName: requestData.departmentName,
          },
          createdAt: now,
        });

        const notificationRef = getFirestore()
          .collection("notifications")
          .doc();
        await notificationRef.set({
          recipientId: requestData.userId,
          type: "RoleRequestRejected",
          category: "Administrative",
          priority: "medium",
          title: "Request not approved",
          message: reviewNote.trim(),
          deepLink: "/apply-for-role",
          createdAt: now,
        });

        res.json({ success: true });
      } catch (error: any) {
        console.error("Reject role request error:", error);
        res.status(500).json({ error: "Failed to reject role request." });
      }
    },
  );

  // API Route for Gemini analysis
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

  app.post("/api/detect-duplicates", async (req, res) => {
    try {
      const { category, lat, lng, description } = req.body;
      if (
        !category ||
        typeof lat !== "number" ||
        typeof lng !== "number" ||
        !description
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Helper function to calculate Haversine distance in meters
      function getDistanceInMeters(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number,
      ) {
        const R = 6371e3; // metres
        const phi1 = (lat1 * Math.PI) / 180;
        const phi2 = (lat2 * Math.PI) / 180;
        const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
        const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

        const a =
          Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
          Math.cos(phi1) *
            Math.cos(phi2) *
            Math.sin(deltaLambda / 2) *
            Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
      }

      const snap = await getFirestore()
        .collection("issues")
        .where("category", "==", category)
        .limit(200)
        .get();

      const unresolvedStatuses = [
        "Open",
        "Reported",
        "Verified",
        "In Progress",
        "Confirmed",
      ];
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const candidates: any[] = [];

      snap.forEach((doc) => {
        const data = doc.data();
        const status = data.status || "";
        const createdAt = data.createdAt || 0;

        if (!unresolvedStatuses.includes(status)) return;
        if (createdAt < thirtyDaysAgo) return;
        if (
          !data.location ||
          typeof data.location.lat !== "number" ||
          typeof data.location.lng !== "number"
        )
          return;

        const distance = getDistanceInMeters(
          lat,
          lng,
          data.location.lat,
          data.location.lng,
        );
        if (distance <= 200) {
          candidates.push({
            id: doc.id,
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

      // Sort by distance and limit to top 5 candidates
      candidates.sort((a, b) => a.distance - b.distance);
      const topCandidates = candidates.slice(0, 5);

      const systemInstruction = `You are CivicDuplicate AI. Your job is to compare a new citizen report's description against a list of nearby existing reports of the same category and decide if any describe the exact same real-world problem (e.g. the same physical pothole, the same garbage overflow pile, the same water leakage) rather than just being a similar category of problem in the general vicinity.`;

      const contents = `New report description: "${description}"

Nearby existing reports of the same category:
${JSON.stringify(
  topCandidates.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    createdAt: new Date(c.createdAt).toISOString(),
  })),
  null,
  2,
)}`;

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
        const duplicates: any[] = [];

        for (const result of results) {
          if (result.isDuplicate === true) {
            const candidate = topCandidates.find(
              (c) => c.id === result.issueId,
            );
            if (candidate) {
              duplicates.push({
                id: candidate.id,
                title: candidate.title,
                imageUrl: candidate.imageUrl,
                status: candidate.status,
                category: candidate.category,
                address: candidate.address,
                verificationCount: candidate.verificationCount,
                priorityScore: candidate.priorityScore,
                confidence: result.confidence,
                reasoning: result.reasoning,
              });
            }
          }
        }

        return res.json({ duplicates });
      } catch (geminiError) {
        console.error("Gemini duplicate detection error:", geminiError);
        return res.json({ duplicates: [] });
      }
    } catch (error: any) {
      console.error("Detect duplicates API error:", error);
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

  // Civic Intelligence Layer API Routes
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

  app.post(
    "/api/intelligence/predict-hotspots",
    authenticateAdmin,
    requireAdminRole,
    async (req, res) => {
      try {
        const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
        const snap = await getFirestore()
          .collection("issues")
          .where("createdAt", ">=", ninetyDaysAgo)
          .get();

        const buckets: Record<
          string,
          { category: string; area: string; timestamps: number[] }
        > = {};

        snap.forEach((doc) => {
          const data = doc.data();
          const category = data.category;
          const area = data.address || data.locationType || "Unknown Area";
          if (!category) return;

          const key = `${category}::${area}`;
          if (!buckets[key]) {
            buckets[key] = {
              category,
              area,
              timestamps: [],
            };
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

            return {
              category: b.category,
              area: b.area,
              totalOccurrences: total,
              recurrencesCount,
              avgDaysBetween: Number(avgDaysBetween.toFixed(2)),
            };
          })
          .filter((b) => b.totalOccurrences >= 2);

        if (recurringBuckets.length === 0) {
          return res.json({ forecasts: [] });
        }

        const systemInstruction = `You are CivicForecast AI. Your job is to predict which of the given recurring area and category patterns of civic issues are likely to need attention again within the next 30 days. You must reason ONLY from the provided counts, recurrence frequency, and average intervals of the data. Do NOT invent, assume, or hallucinate any facts, names, or locations not present in the provided input data. If any area/category pattern has a high recurrence rate or very short interval, prioritize it.`;

        const contents = `Here is the aggregated data of recurring civic issues (issues of the same category at the same location/area, where there are at least 2 occurrences within the last 90 days):

${JSON.stringify(recurringBuckets, null, 2)}

Please analyze these patterns and forecast which of these are likely to recur/need attention in the next 30 days. Return up to 8 forecasts, sorted by riskLevel (High first, then Medium, then Low).`;

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
                    riskLevel: {
                      type: Type.STRING,
                      description: "Low | Medium | High",
                    },
                    predictedWindowDays: { type: Type.NUMBER },
                    reasoning: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                  },
                  required: [
                    "area",
                    "category",
                    "riskLevel",
                    "predictedWindowDays",
                    "reasoning",
                    "confidence",
                  ],
                },
              },
            },
            required: ["forecasts"],
          },
        };

        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents,
            config: generateConfig,
          });

          const text = response.text;
          if (!text) throw new Error("No response text");

          const result = JSON.parse(text.trim());

          // Sort by riskLevel: High, then Medium, then Low
          if (result.forecasts && Array.isArray(result.forecasts)) {
            const riskMap: Record<string, number> = {
              High: 3,
              Medium: 2,
              Low: 1,
            };
            result.forecasts.sort((a: any, b: any) => {
              const rA = riskMap[a.riskLevel] || 0;
              const rB = riskMap[b.riskLevel] || 0;
              return rB - rA;
            });
            // Cap at 8
            result.forecasts = result.forecasts.slice(0, 8);
          }

          return res.json(result);
        } catch (geminiError) {
          console.error("Gemini predictive hotspots error:", geminiError);
          return res.json({ forecasts: [] });
        }
      } catch (error) {
        console.error("Predictive hotspots error:", error);
        return res.json({ forecasts: [] });
      }
    },
  );

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
  
  // Start the background Firestore notification listener
  startNotificationListener();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
