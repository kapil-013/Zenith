import React from "react";
import { useNotifications } from "../context/NotificationContext";
import { NeumorphicCard } from "../components/ui/card";
import { NeumorphicButton } from "../components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { Bell, CheckCircle2, Info, AlertTriangle, AlertCircle, X, Trash2 } from "lucide-react";
import { AppNotification } from "../types";
import { motion } from "motion/react";

const getIcon = (category: string, priority: string) => {
  if (priority === "urgent" || priority === "high") return <AlertTriangle className="w-5 h-5 text-[var(--color-civic-danger)]" />;
  if (category === "Verification") return <CheckCircle2 className="w-5 h-5 text-[var(--color-civic-status-verified)]" />;
  if (category === "Assignment") return <Info className="w-5 h-5 text-[var(--color-civic-status-inprogress)]" />;
  if (category === "Achievement") return <CheckCircle2 className="w-5 h-5 text-[var(--color-civic-status-confirmed)]" />;
  return <Bell className="w-5 h-5 text-[var(--color-civic-primary)]" />;
};

export function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  // Filter out deleted/dismissed notifications for view
  const visibleNotifs = notifications.filter(n => !n.dismissedAt);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-[var(--color-civic-text-primary)] tracking-tight flex items-center gap-3">
          <Bell className="w-8 h-8 text-[var(--color-civic-primary)]" />
          Notification Center
        </h1>
        {unreadCount > 0 && (
          <NeumorphicButton variant="default" onClick={markAllAsRead} size="sm">
            Mark all as read
          </NeumorphicButton>
        )}
      </div>

      {visibleNotifs.length === 0 ? (
        <NeumorphicCard className="p-12 text-center text-[var(--color-civic-text-secondary)] font-medium">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>You have no notifications.</p>
        </NeumorphicCard>
      ) : (
        <div className="space-y-4">
          {visibleNotifs.map((notif, index) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NeumorphicCard className={`p-4 transition-all ${!notif.readAt ? 'border-l-4 border-l-[var(--color-civic-primary)] bg-[var(--color-civic-surface)]' : 'bg-[var(--color-civic-surface-inset)] shadow-[var(--shadow-neumorphic-inset)] opacity-70 hover:opacity-100 border border-transparent'}`}>
                <div className="flex gap-4 items-start">
                  <div className="mt-1 shrink-0">
                    {getIcon(notif.category, notif.priority)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className={`font-bold text-sm ${!notif.readAt ? 'text-[var(--color-civic-text-primary)]' : 'text-[var(--color-civic-text-secondary)]'}`}>
                          {notif.title}
                        </h3>
                        <p className={`text-sm mt-1 ${!notif.readAt ? 'text-[var(--color-civic-text-secondary)]' : 'text-[var(--color-civic-text-muted)]'}`}>
                          {notif.message}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--color-civic-text-muted)] whitespace-nowrap shrink-0 bg-[var(--color-civic-surface)] px-2 py-1 rounded-md shadow-sm">
                        {notif.createdAt ? formatDistanceToNow((notif as any).createdAt?.toDate ? (notif as any).createdAt.toDate() : notif.createdAt, { addSuffix: true }) : "Recently"}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex gap-2">
                        {notif.deepLink && (
                          <Link 
                            to={notif.deepLink}
                            onClick={() => !notif.readAt && markAsRead(notif.id)}
                            className="text-xs font-bold text-[var(--color-civic-primary)] hover:underline"
                          >
                            View Details
                          </Link>
                        )}
                        {!notif.readAt && (
                          <button 
                            onClick={() => markAsRead(notif.id)}
                            className="text-xs font-bold text-[var(--color-civic-text-secondary)] hover:text-[var(--color-civic-text-primary)]"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                      <button 
                        onClick={() => deleteNotification(notif.id)}
                        className="text-[var(--color-civic-text-muted)] hover:text-[var(--color-civic-danger)] transition-colors p-1"
                        aria-label="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </NeumorphicCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
