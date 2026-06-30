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
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: "citizen" | "department" | "admin" | "super_admin" | null;
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
  const syncInProgress = React.useRef<Record<string, Promise<void>>>({});

  const syncAndLoadUser = async (firebaseUser: FirebaseUser) => {
    const uid = firebaseUser.uid;
    if (syncInProgress.current[uid]) {
      return syncInProgress.current[uid];
    }

    const promise = (async () => {
      const userRef = doc(db, "users", uid);
      let userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const isBootstrapAdmin = firebaseUser.email && (firebaseUser.email.toLowerCase() === "k06apil@gmail.com" || firebaseUser.email.toLowerCase() === "communityhero.superadmin@demo.app");
        const role = isBootstrapAdmin ? "super_admin" : "citizen";
        
        await setDoc(userRef, {
          id: uid,
          email: firebaseUser.email || "",
          name: firebaseUser.displayName || "Citizen",
          photoURL: firebaseUser.photoURL || "",
          role: role,
          status: "active",
          points: 0,
          badges: [],
          civicScore: 0,
          createdAt: Date.now(),
        });
        userSnap = await getDoc(userRef);
      } else {
        const updates: any = {
          lastLoginAt: Date.now(),
          updatedAt: Date.now()
        };
        await updateDoc(userRef, updates);
        userSnap = await getDoc(userRef);
      }

      if (userSnap.exists()) {
        setUser({ ...(docSnap => {
          return { ...(docSnap.data() as User), id: docSnap.id };
        })(userSnap) });
      }
    })();

    syncInProgress.current[uid] = promise;
    try {
      await promise;
    } finally {
      delete syncInProgress.current[uid];
    }
  };

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          await syncAndLoadUser(firebaseUser);

          // Live listener
          const userRef = doc(db, "users", firebaseUser.uid);
          unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              setUser({ ...(docSnap.data() as User), id: docSnap.id });
            } else {
              setUser(null);
            }
            setLoading(false);
          }, (error) => {
            console.error("Firestore user onSnapshot error:", error);
            setLoading(false);
          });
        } else {
          setUser(null);
          setLoading(false);
          if (unsubscribeSnapshot) {
            unsubscribeSnapshot();
          }
        }
      } catch (error) {
        console.error("onAuthStateChanged error caught:", error);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  const refreshUserProfile = async () => {
    // No-op for manual refresh, snapshot handles it.
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await syncAndLoadUser(result.user);
      }
    } catch (error: any) {
      if (
        error.code !== "auth/popup-closed-by-user" &&
        error.code !== "auth/user-cancelled" &&
        error.code !== "auth/cancelled-popup-request"
      ) {
        console.error("Google sign in failed:", error);
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmailPassword = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerCitizen = async (name: string, email: string, pass: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const isBootstrapAdmin = email.toLowerCase() === "k06apil@gmail.com" || email.toLowerCase() === "communityhero.superadmin@demo.app";
      
      const userRef = doc(db, "users", cred.user.uid);
      await setDoc(userRef, {
        id: cred.user.uid,
        email: email,
        name: name,
        photoURL: "",
        role: isBootstrapAdmin ? "super_admin" : "citizen",
        status: "active",
        points: 0,
        badges: [],
        civicScore: 0,
        createdAt: Date.now(),
      });
      await syncAndLoadUser(cred.user);
    } catch (error: any) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
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
