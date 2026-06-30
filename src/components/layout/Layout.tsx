import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useUserStats } from "../../hooks/useUserStats";
import { useNotifications } from "../../context/NotificationContext";
import { useTranslation } from "react-i18next";
import {
  hasPermission,
  Permission,
  isCitizen,
  isAdminOrSuperAdmin,
  isDepartment,
} from "../../lib/auth/permissions";
import {
  MapPin,
  PlusCircle,
  LayoutDashboard,
  BarChart3,
  User as UserIcon,
  LogIn,
  LogOut,
  ShieldAlert,
  Users,
  Bell,
  ClipboardCheck,
  ScrollText,
  Trophy,
} from "lucide-react";
import { NeumorphicButton } from "../ui/button";
import { motion, AnimatePresence } from "motion/react";
import { formatDistanceToNow } from "date-fns";

export function Layout() {
  const { t, i18n } = useTranslation();
  const { user, role, logout } = useAuth();
  const { civicScore } = useUserStats();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const navItems = [
    { name: "Explore", path: "/issues", icon: MapPin },
    { name: "Impact", path: "/impact", icon: BarChart3 },
  ];

  if (!user) {
    navItems.push({ name: "Login", path: "/login", icon: LogIn });
  } else {
    if (hasPermission(role, Permission.REPORT_ISSUE)) {
      navItems.splice(1, 0, {
        name: "Report",
        path: "/report",
        icon: PlusCircle,
      });
    }
    if (hasPermission(role, Permission.VIEW_DEPT_DASHBOARD)) {
      navItems.push({
        name: "Dashboard",
        path: "/department",
        icon: LayoutDashboard,
      });
    }
    if (hasPermission(role, Permission.VIEW_ADMIN_DASHBOARD)) {
      navItems.push({ name: "Admin", path: "/admin", icon: LayoutDashboard });
    }
    if (hasPermission(role, Permission.MANAGE_USERS)) {
      navItems.push({ name: "Users", path: "/admin/users", icon: Users });
    }
    if (hasPermission(role, Permission.MANAGE_ADMINS)) {
      navItems.push({
        name: "Requests",
        path: "/admin/role-requests",
        icon: ClipboardCheck,
      });
    }
    if (hasPermission(role, Permission.VIEW_AUDIT_LOGS)) {
      navItems.push({
        name: "Logs",
        path: "/admin/audit-logs",
        icon: ScrollText,
      });
    }
    navItems.push({
      name: "Leaderboard",
      path: "/leaderboard",
      icon: Trophy,
    });
    navItems.push({ name: "Profile", path: "/profile", icon: UserIcon });
  }

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const activeVariant = isAdminOrSuperAdmin(role)
    ? "admin"
    : isDepartment(role)
      ? "department"
      : "primary";
  const mobileActiveColor = isAdminOrSuperAdmin(role)
    ? "text-[var(--color-civic-admin)] bg-[var(--color-civic-admin-soft)]"
    : isDepartment(role)
      ? "text-[var(--color-civic-department)] bg-[var(--color-civic-department-soft)]"
      : "text-[var(--color-civic-primary)] bg-[var(--color-civic-primary-soft)]";

  const previewNotifs = notifications.filter((n) => !n.dismissedAt).slice(0, 5);

  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-x-hidden">
      {/* Decorative background blurs and grid */}
      <div className="fixed inset-0 pointer-events-none z-[-1]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-civic-border)_1px,transparent_1px)] [background-size:24px_24px] opacity-50" />
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[var(--color-civic-primary-soft)] rounded-full blur-[150px] opacity-40" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[var(--color-civic-secondary-soft)] rounded-full blur-[150px] opacity-40" />
      </div>

      <header className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between bg-[var(--color-civic-surface)]/70 backdrop-blur-xl border-b border-[var(--color-civic-border)] shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
        <Link
          to="/"
          className="flex items-center gap-2 text-[var(--color-civic-primary)] font-extrabold text-xl tracking-tight hover:scale-105 transition-transform"
        >
          <div className="p-1.5 bg-[var(--color-civic-surface-inset)] rounded-lg shadow-[var(--shadow-neumorphic-inset)] border border-transparent">
            <ShieldAlert className="h-5 w-5 text-[var(--color-civic-primary)]" />
          </div>
          <span>Community Hero</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2 bg-[var(--color-civic-surface-inset)]/50 backdrop-blur-md p-1 rounded-2xl border border-[var(--color-civic-border)] shadow-sm">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/" &&
                location.pathname.startsWith(item.path + "/"));
            return (
              <Link key={item.path} to={item.path}>
                <NeumorphicButton
                  variant={isActive ? activeVariant : "ghost"}
                  size="sm"
                  className={`gap-2 rounded-xl transition-all ${isActive ? "border-transparent" : ""}`}
                >
                  <item.icon className="h-4 w-4" />
                  {t(item.name)}
                </NeumorphicButton>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <button
            onClick={() => i18n.changeLanguage(i18n.language === "en" ? "hi" : "en")}
            className="flex items-center justify-center p-2 rounded-full hover:bg-[var(--color-civic-surface-inset)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-civic-primary)] h-9 w-12 text-xs font-black bg-[var(--color-civic-surface)] border border-[var(--color-civic-border)]/50 shadow-[var(--shadow-neumorphic)] hover:scale-105 active:scale-95 text-[var(--color-civic-text-secondary)]"
            aria-label="Change Language"
          >
            {i18n.language === "en" ? "EN" : "हिं"}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="relative p-2 rounded-full hover:bg-[var(--color-civic-surface-inset)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-civic-primary)]"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-[var(--color-civic-text-secondary)]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-civic-danger)] rounded-full animate-pulse"></span>
                  )}
                </button>
                <AnimatePresence>
                  {showNotifDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowNotifDropdown(false)}
                      ></div>
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 bg-[var(--color-civic-surface)] rounded-2xl shadow-[var(--shadow-neumorphic)] border border-[var(--color-civic-border)] z-50 overflow-hidden flex flex-col max-h-[80vh]"
                      >
                        <div className="p-4 border-b border-[var(--color-civic-border)] flex justify-between items-center bg-[var(--color-civic-surface-inset)]/30">
                          <h3 className="font-bold text-[var(--color-civic-text-primary)]">
                            Notifications
                          </h3>
                          {unreadCount > 0 && (
                            <span className="text-xs font-bold bg-[var(--color-civic-primary)] text-white px-2 py-0.5 rounded-full">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-1">
                          {previewNotifs.length === 0 ? (
                            <div className="p-4 text-center text-sm text-[var(--color-civic-text-secondary)]">
                              No recent notifications.
                            </div>
                          ) : (
                            previewNotifs.map((notif) => (
                              <div
                                key={notif.id}
                                className={`p-3 rounded-xl transition-colors ${!notif.readAt ? "bg-[var(--color-civic-primary)]/5" : "hover:bg-[var(--color-civic-surface-inset)]"}`}
                                onClick={() => {
                                  if (!notif.readAt) markAsRead(notif.id);
                                  setShowNotifDropdown(false);
                                  if (notif.deepLink) navigate(notif.deepLink);
                                }}
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <span
                                    className={`text-xs font-bold ${!notif.readAt ? "text-[var(--color-civic-text-primary)]" : "text-[var(--color-civic-text-secondary)]"}`}
                                  >
                                    {notif.title}
                                  </span>
                                  <span className="text-[10px] text-[var(--color-civic-text-muted)] shrink-0 ml-2">
                                    {notif.createdAt ? formatDistanceToNow((notif as any).createdAt?.toDate ? (notif as any).createdAt.toDate() : notif.createdAt) : "Recently"} ago
                                  </span>
                                </div>
                                <p
                                  className={`text-xs line-clamp-2 ${!notif.readAt ? "text-[var(--color-civic-text-secondary)] font-medium" : "text-[var(--color-civic-text-muted)]"}`}
                                >
                                  {notif.message}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="p-3 border-t border-[var(--color-civic-border)] bg-[var(--color-civic-surface)] text-center">
                          <Link
                            to="/notifications"
                            className="text-sm font-bold text-[var(--color-civic-primary)] hover:underline"
                            onClick={() => setShowNotifDropdown(false)}
                          >
                            View All Notifications
                          </Link>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-4 bg-[var(--color-civic-surface)] p-1.5 pr-4 rounded-full border border-[var(--color-civic-border)] shadow-[var(--shadow-neumorphic)] ml-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-4 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-civic-primary)] rounded-full"
                  aria-label="View Profile"
                >
                  <div className="flex items-center justify-center h-8 w-8 bg-[var(--color-civic-surface-inset)] rounded-full shadow-[var(--shadow-neumorphic-inset)]">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <UserIcon className="h-4 w-4 text-[var(--color-civic-text-muted)]" />
                    )}
                  </div>
                  <span className="hidden sm:inline-block text-sm font-bold text-[var(--color-civic-text-primary)]">
                    {isCitizen(role) ? `${civicScore} pts` : role || "User"}
                  </span>
                </Link>
                <div className="h-4 w-px bg-[var(--color-civic-border)] mx-1 hidden sm:block" />
                <button
                  onClick={handleLogout}
                  className="text-[var(--color-civic-text-muted)] hover:text-[var(--color-civic-danger)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-civic-danger)] rounded-full p-1"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login">
              <NeumorphicButton size="sm" variant="secondary" className="gap-2">
                <LogIn className="h-4 w-4" />
                <span>{t("Login")}</span>
              </NeumorphicButton>
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 pb-[calc(120px+env(safe-area-inset-bottom))] md:pb-8 z-10">
        <Outlet />
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-civic-surface)]/80 backdrop-blur-xl p-3 border-t border-[var(--color-civic-border)] shadow-[0_-4px_30px_rgba(0,0,0,0.05)] z-[60] flex justify-around items-center rounded-t-3xl pb-safe overflow-x-auto">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/" &&
              location.pathname.startsWith(item.path + "/"));
          return (
            <Link key={item.path} to={item.path} className="shrink-0 mx-2">
              <div
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive ? mobileActiveColor : "text-[var(--color-civic-text-muted)] hover:bg-[var(--color-civic-surface-inset)]"}`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-bold tracking-wide uppercase">
                  {t(item.name)}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
