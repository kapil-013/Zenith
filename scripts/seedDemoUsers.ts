import "dotenv/config";
process.env.GCLOUD_PROJECT = "zenith-a6ada";
process.env.GOOGLE_CLOUD_PROJECT = "zenith-a6ada";
import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
const getFirestore = () => getAdminFirestore("ai-studio-zenith-a4e5dd9f-7c11-46ac-a8ac-4777cb65f044");

try {
  let credential = undefined;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    credential = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY));
  } else {
    credential = applicationDefault();
  }
  initializeApp({
    credential,
    projectId: "zenith-a6ada",
  });
} catch (e) {
  console.log("Firebase Admin already initialized or failed to initialize via ADC:", e);
}

const PASSWORD = "Demo@1234";

const demoUsers = [
  {
    email: "communityhero.superadmin@demo.app",
    role: "super_admin",
    departmentName: null,
    displayName: "Demo Super Admin",
  },
  {
    email: "communityhero.admin@demo.app",
    role: "admin",
    departmentName: null,
    displayName: "Demo Admin",
  },
  {
    email: "communityhero.citizen@demo.app",
    role: "citizen",
    departmentName: null,
    displayName: "Demo Citizen",
  },
  {
    email: "communityhero.roadmaintenance@demo.app",
    role: "department",
    departmentName: "Road Maintenance",
    displayName: "Road Maintenance Officer",
  },
  {
    email: "communityhero.sanitation@demo.app",
    role: "department",
    departmentName: "Sanitation Department",
    displayName: "Sanitation Inspector",
  },
  {
    email: "communityhero.waterboard@demo.app",
    role: "department",
    departmentName: "Water Board",
    displayName: "Water Board Engineer",
  },
  {
    email: "communityhero.electricalmaintenance@demo.app",
    role: "department",
    departmentName: "Electrical Maintenance",
    displayName: "Electrical Supervisor",
  },
  {
    email: "communityhero.drainagedepartment@demo.app",
    role: "department",
    departmentName: "Drainage Department",
    displayName: "Drainage Superintendent",
  },
  {
    email: "communityhero.publicworks@demo.app",
    role: "department",
    departmentName: "Public Works",
    displayName: "Public Works Director",
  },
  {
    email: "communityhero.trafficmanagement@demo.app",
    role: "department",
    departmentName: "Traffic Management",
    displayName: "Traffic Controller",
  },
  {
    email: "communityhero.communityvolunteers@demo.app",
    role: "department",
    departmentName: "Community Volunteers",
    displayName: "Volunteer Coordinator",
  },
  {
    email: "communityhero.generalcivichelpdesk@demo.app",
    role: "department",
    departmentName: "General Civic Helpdesk",
    displayName: "Helpdesk Manager",
  },
];

async function seed() {
  const auth = getAuth();
  const db = getFirestore();

  console.log("Starting demo users seeding process...");
  const results = [];

  for (const user of demoUsers) {
    let uid = "";
    let isNew = false;
    let authSucceeded = false;

    try {
      const existingUser = await auth.getUserByEmail(user.email);
      uid = existingUser.uid;
      authSucceeded = true;
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        try {
          const newUser = await auth.createUser({
            email: user.email,
            password: PASSWORD,
            displayName: user.displayName,
          });
          uid = newUser.uid;
          isNew = true;
          authSucceeded = true;
        } catch (createErr: any) {
          console.warn(`[Warning] Firebase Auth creation failed for ${user.email}: ${createErr.message || createErr}`);
        }
      } else {
        console.warn(`[Warning] Firebase Auth check failed for ${user.email}: ${error.message || error}`);
      }
    }

    if (!authSucceeded) {
      // Deterministic fallback UID based on email prefix
      uid = "demo_uid_" + user.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");
      console.log(`Using fallback Firestore doc ID: ${uid} for user ${user.email}`);
    } else {
      // Assign custom user claims if Firebase Auth succeeded
      try {
        await auth.setCustomUserClaims(uid, {
          role: user.role,
          departmentName: user.departmentName,
        });
      } catch (claimsErr: any) {
        console.warn(`[Warning] Failed to set claims for ${uid}: ${claimsErr.message || claimsErr}`);
      }
    }

    // Set demo stats and points depending on role
    let points = 0;
    let civicScore = 0;
    let trustScore = 75;
    let currentLevel = "New Citizen";
    let currentTitle = "New Citizen";
    let achievements: any[] = [];
    let stats = {
      issuesReported: 0,
      issuesVerified: 0,
      successfulResolutions: 0,
      departmentsAssisted: 0,
      estimatedCitizensImpacted: 0,
      falseReports: 0,
      rejectedReports: 0,
    };

    if (user.role === "super_admin" || user.role === "admin") {
      points = 500;
      civicScore = 500;
      trustScore = 100;
      currentLevel = "Civic Legend";
      currentTitle = "Civic Legend";
      stats = {
        issuesReported: 15,
        issuesVerified: 60,
        successfulResolutions: 15,
        departmentsAssisted: 8,
        estimatedCitizensImpacted: 1200,
        falseReports: 0,
        rejectedReports: 0,
      };
      achievements = [
        {
          id: "ach_first_report",
          badgeId: "first_report",
          name: "First Reporter",
          description: "Reported your first hyperlocal issue",
          iconName: "FileText",
          unlockedAt: Date.now() - 30 * 24 * 3600 * 1000,
        },
        {
          id: "ach_trusted_verifier",
          badgeId: "trusted_verifier",
          name: "Trusted Verifier",
          description: "Successfully verified 10 community issues",
          iconName: "ShieldCheck",
          unlockedAt: Date.now() - 20 * 24 * 3600 * 1000,
        },
        {
          id: "ach_resolution_champion",
          badgeId: "resolution_champion",
          name: "Resolution Champion",
          description: "Helped resolve 5 community issues",
          iconName: "Award",
          unlockedAt: Date.now() - 10 * 24 * 3600 * 1000,
        }
      ];
    } else if (user.role === "department") {
      points = 350;
      civicScore = 350;
      trustScore = 95;
      currentLevel = "Resolution Specialist";
      currentTitle = "Resolution Specialist";
      stats = {
        issuesReported: 2,
        issuesVerified: 10,
        successfulResolutions: 24,
        departmentsAssisted: 5,
        estimatedCitizensImpacted: 3500,
        falseReports: 0,
        rejectedReports: 0,
      };
      achievements = [
        {
          id: "ach_resolution_champion",
          badgeId: "resolution_champion",
          name: "Resolution Champion",
          description: "Helped resolve 5 community issues",
          iconName: "Award",
          unlockedAt: Date.now() - 15 * 24 * 3600 * 1000,
        }
      ];
    } else {
      // Citizen
      points = 120;
      civicScore = 120;
      trustScore = 85;
      currentLevel = "Local Guardian";
      currentTitle = "Local Guardian";
      stats = {
        issuesReported: 6,
        issuesVerified: 18,
        successfulResolutions: 4,
        departmentsAssisted: 2,
        estimatedCitizensImpacted: 250,
        falseReports: 0,
        rejectedReports: 0,
      };
      achievements = [
        {
          id: "ach_first_report",
          badgeId: "first_report",
          name: "First Reporter",
          description: "Reported your first hyperlocal issue",
          iconName: "FileText",
          unlockedAt: Date.now() - 10 * 24 * 3600 * 1000,
        },
        {
          id: "ach_trusted_verifier",
          badgeId: "trusted_verifier",
          name: "Trusted Verifier",
          description: "Successfully verified 10 community issues",
          iconName: "ShieldCheck",
          unlockedAt: Date.now() - 5 * 24 * 3600 * 1000,
        }
      ];
    }

    const badgesList = achievements.map(a => a.name);

    // Create or merge user document in Firestore
    await db.collection("users").doc(uid).set(
      {
        email: user.email,
        name: user.displayName,
        role: user.role,
        departmentName: user.departmentName,
        status: "active",
        points: points,
        badges: badgesList,
        civicScore: civicScore,
        trustScore: trustScore,
        currentLevel: currentLevel,
        currentTitle: currentTitle,
        statistics: stats,
        achievements: achievements,
        createdAt: Date.now() - 35 * 24 * 3600 * 1000, // 35 days ago
        updatedAt: Date.now(),
        lastLoginAt: Date.now(),
        provider: "email",
      },
      { merge: true }
    );

    results.push({
      email: user.email,
      role: user.role,
      department: user.departmentName || "N/A",
      status: authSucceeded ? (isNew ? "Created in Auth" : "Updated Claims") : "Fallback (Firestore Only)",
    });
  }

  console.log("\n--- DEMO ACCOUNTS SEED SUMMARY ---");
  console.log(String.prototype.padEnd ? "Role".padEnd(20) + " | " + "Department".padEnd(25) + " | " + "Email".padEnd(45) + " | " + "Password" : "Summary of seeded users");
  console.log("-".repeat(110));
  for (const res of results) {
    const roleStr = res.role.toUpperCase();
    const deptStr = res.department;
    const emailStr = res.email;
    if (String.prototype.padEnd) {
      console.log(`${roleStr.padEnd(20)} | ${deptStr.padEnd(25)} | ${emailStr.padEnd(45)} | ${PASSWORD}`);
    } else {
      console.log(`${roleStr} - ${deptStr} - ${emailStr} - Password: ${PASSWORD}`);
    }
  }
  console.log("\nDemo accounts seeded successfully.");
}

seed().catch((err) => {
  console.error("Seeding script failed with error:", err);
  process.exit(1);
});
