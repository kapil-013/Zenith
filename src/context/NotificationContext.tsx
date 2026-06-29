import React, { createContext, useContext, useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import { AppNotification } from "../types";

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: AppNotification[] = [];
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() } as AppNotification);
      });
      // Sort in memory because Firestore requires composite index for query sorting with equality filters
      notifs.sort((a, b) => b.createdAt - a.createdAt);
      
      const unread = notifs.filter(n => !n.readAt).length;
      
      setNotifications(notifs);
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    if (!user) return;
    const notifRef = doc(db, "notifications", id);
    await updateDoc(notifRef, { readAt: Date.now() });
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unreadNotifs = notifications.filter(n => !n.readAt);
    if (unreadNotifs.length === 0) return;

    const batch = writeBatch(db);
    unreadNotifs.forEach(n => {
      batch.update(doc(db, "notifications", n.id), { readAt: Date.now() });
    });
    await batch.commit();
  };

  const deleteNotification = async (id: string) => {
    if (!user) return;
    const notifRef = doc(db, "notifications", id);
    // We can use deletedAt or just delete the doc, we'll mark as dismissed to keep history or just delete
    await updateDoc(notifRef, { dismissedAt: Date.now() });
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
