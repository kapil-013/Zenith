import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: "citizen" | "department" | "admin" | null;
  departmentName: string | null;
  signInWithGoogle: () => Promise<void>;
  loginWithEmailPassword: (e: string, p: string) => Promise<void>;
  registerCitizen: (n: string, e: string, p: string) => Promise<void>;
  resetPassword: (e: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (firebaseUser: FirebaseUser) => {
    const userRef = doc(db, "users", firebaseUser.uid);
    let userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Synchronize with backend to safely bootstrap admin if needed
      const token = await firebaseUser.getIdToken();
      await fetch("/api/auth/sync-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: firebaseUser.displayName || "Citizen",
          photoURL: firebaseUser.photoURL || "",
        }),
      });
      userSnap = await getDoc(userRef);
    } else {
      // Update lastLoginAt
      await updateDoc(userRef, {
        lastLoginAt: Date.now(),
        updatedAt: Date.now()
      });
      userSnap = await getDoc(userRef); // re-fetch after update
    }

    if (userSnap.exists()) {
      const data = userSnap.data() as User;
      setUser({ ...data, id: userSnap.id });
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await fetchUserProfile(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUserProfile = async () => {
    if (auth.currentUser) {
      await fetchUserProfile(auth.currentUser);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (
        error.code !== "auth/popup-closed-by-user" &&
        error.code !== "auth/user-cancelled" &&
        error.code !== "auth/cancelled-popup-request"
      ) {
        console.error("Google sign in failed:", error);
      }
    }
  };

  const loginWithEmailPassword = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerCitizen = async (name: string, email: string, pass: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    
    // Instead of directly writing to Firestore, we let the sync API handle it so we don't duplicate code
    // However, we want to ensure name is passed
    const token = await cred.user.getIdToken();
    await fetch("/api/auth/sync-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: name,
        photoURL: "",
      }),
    });
    
    await fetchUserProfile(cred.user);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role: user?.role || null,
        departmentName: user?.departmentName || null,
        signInWithGoogle,
        loginWithEmailPassword,
        registerCitizen,
        resetPassword,
        logout,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
