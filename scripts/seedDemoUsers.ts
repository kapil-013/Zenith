import "dotenv/config";
import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

try {
  admin.initializeApp();
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

    try {
      const existingUser = await auth.getUserByEmail(user.email);
      uid = existingUser.uid;
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        const newUser = await auth.createUser({
          email: user.email,
          password: PASSWORD,
          displayName: user.displayName,
        });
        uid = newUser.uid;
        isNew = true;
      } else {
        console.error(`Error checking auth for ${user.email}:`, error);
        continue;
      }
    }

    // Assign custom user claims
    await auth.setCustomUserClaims(uid, {
      role: user.role,
      departmentName: user.departmentName,
    });

    // Create or merge user document in Firestore
    await db.collection("users").doc(uid).set(
      {
        email: user.email,
        name: user.displayName,
        role: user.role,
        departmentName: user.departmentName,
        status: "active",
        points: 0,
        badges: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    );

    results.push({
      email: user.email,
      role: user.role,
      department: user.departmentName || "N/A",
      status: isNew ? "Created" : "Updated Claims/Doc",
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
