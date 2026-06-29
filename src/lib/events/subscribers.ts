import { collection, addDoc, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { AppEvent, AppNotification, NotificationCategory, NotificationPriority } from "../../types";
import { dispatcher } from "./dispatcher";
import { UserRole as PermissionRole, isAdminOrSuperAdmin } from "../auth/permissions";

// Helper to create notification in Firestore
export async function createNotification(
  recipientId: string,
  params: Omit<AppNotification, "id" | "recipientId" | "createdAt">
) {
  try {
    await addDoc(collection(db, "notifications"), {
      recipientId,
      createdAt: Date.now(),
      ...params,
    });
  } catch (error) {
    console.error("Failed to create notification", error);
  }
}

// Fetch users by role
async function getUsersByRole(role: string): Promise<string[]> {
  try {
    // Note: 'super_admin' and 'admin' are checked via custom logic or just by role field
    const q = query(collection(db, "users"), where("role", "==", role));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.id);
  } catch (e) {
    console.error(e);
    return [];
  }
}

async function getAdminsAndSuperAdmins(): Promise<string[]> {
  const [admins, superAdmins] = await Promise.all([
    getUsersByRole("admin"),
    getUsersByRole("super_admin")
  ]);
  return [...admins, ...superAdmins];
}

async function getDepartmentUsers(departmentName: string): Promise<string[]> {
  try {
    const q = query(collection(db, "users"), where("role", "==", "department"), where("departmentName", "==", departmentName));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.id);
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function registerNotificationSubscribers() {
  dispatcher.subscribe("IssueReported", async (event) => {
    // Notify admins about new high/critical issues
    if (event.priority === "Urgent" || event.priority === "High") {
      const admins = await getAdminsAndSuperAdmins();
      for (const adminId of admins) {
        if (adminId === event.actorId) continue;
        await createNotification(adminId, {
          recipientRole: "admin",
          type: event.type,
          category: "Workflow",
          priority: "high",
          title: "High Priority Issue Reported",
          message: `A new ${event.priority} priority issue was reported.`,
          relatedEntityType: "issue",
          relatedEntityId: event.affectedIssueId,
          deepLink: `/issues/${event.affectedIssueId}`,
          actorId: event.actorId,
        });
      }
    }
  });

  dispatcher.subscribe("IssueVerified", async (event) => {
    // Notify the creator that their issue was verified
    if (event.affectedUsers && event.affectedUsers[0]) {
      const creatorId = event.affectedUsers[0];
      if (creatorId !== event.actorId) {
        await createNotification(creatorId, {
          type: event.type,
          category: "Verification",
          priority: "low",
          title: "Issue Verified",
          message: "Your reported issue was verified by the community.",
          relatedEntityType: "issue",
          relatedEntityId: event.affectedIssueId,
          deepLink: `/issues/${event.affectedIssueId}`,
          actorId: event.actorId,
        });
      }
    }
  });

  dispatcher.subscribe("IssueAssigned", async (event) => {
    // Notify department
    if (event.departmentId) {
      const depUsers = await getDepartmentUsers(event.departmentId);
      for (const uid of depUsers) {
        await createNotification(uid, {
          recipientRole: "department",
          type: event.type,
          category: "Assignment",
          priority: "medium",
          title: "New Issue Assigned",
          message: `An issue has been assigned to your department.`,
          relatedEntityType: "issue",
          relatedEntityId: event.affectedIssueId,
          deepLink: `/issues/${event.affectedIssueId}`,
          actorId: event.actorId,
        });
      }
    }
    // Notify citizen
    if (event.affectedUsers && event.affectedUsers[0]) {
       await createNotification(event.affectedUsers[0], {
          type: event.type,
          category: "Workflow",
          priority: "medium",
          title: "Issue Assigned",
          message: `Your issue has been assigned to ${event.departmentId}.`,
          relatedEntityType: "issue",
          relatedEntityId: event.affectedIssueId,
          deepLink: `/issues/${event.affectedIssueId}`,
       });
    }
  });

  dispatcher.subscribe("IssueStatusChanged", async (event) => {
    // Notify citizen of major status updates
    if (event.affectedUsers && event.affectedUsers[0] && event.metadata?.newStatus) {
      const status = event.metadata.newStatus;
      if (["Work Started", "Inspection Scheduled", "Resolved"].includes(status)) {
        await createNotification(event.affectedUsers[0], {
          type: event.type,
          category: "Workflow",
          priority: "medium",
          title: `Issue ${status}`,
          message: `Your reported issue status changed to ${status}.`,
          relatedEntityType: "issue",
          relatedEntityId: event.affectedIssueId,
          deepLink: `/issues/${event.affectedIssueId}`,
          actorId: event.actorId,
        });
      }
    }
  });
  
  dispatcher.subscribe("CitizenConfirmedResolution", async (event) => {
    // Notify admins and department that citizen confirmed resolution
    const notified = new Set<string>();
    
    // Notify Admins
    const admins = await getAdminsAndSuperAdmins();
    for(const admin of admins) notified.add(admin);
    
    // Notify Department if assigned
    if (event.departmentId) {
      const depUsers = await getDepartmentUsers(event.departmentId);
      for(const du of depUsers) notified.add(du);
    }
    
    for (const uid of notified) {
       await createNotification(uid, {
          type: event.type,
          category: "Achievement",
          priority: "medium",
          title: "Resolution Confirmed",
          message: `A citizen confirmed that an issue was successfully resolved.`,
          relatedEntityType: "issue",
          relatedEntityId: event.affectedIssueId,
          deepLink: `/issues/${event.affectedIssueId}`,
          actorId: event.actorId,
       });
    }
  });
}
