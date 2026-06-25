import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useUserStats } from "../../hooks/useUserStats";
import {
  MapPin,
  PlusCircle,
  LayoutDashboard,
  BarChart3,
  User as UserIcon,
  LogIn,
  LogOut,
  ShieldAlert,
  Sparkles,
  Users
} from "lucide-react";
import { NeumorphicButton } from "../ui/button";
import { DemoGuide } from "../DemoGuide";

export function Layout() {
  const { user, role, logout } = useAuth();
  const { stats } = useUserStats();
  const location = useLocation();
  const navigate = useNavigate();
  const [demoMode, setDemoMode] = useState(() => {
    return localStorage.getItem("demoMode") === "true";
  });

  useEffect(() => {
    localStorage.setItem("demoMode", String(demoMode));
  }, [demoMode]);

  const navItems = [
    { name: "Explore", path: "/issues", icon: MapPin },
    { name: "Impact", path: "/impact", icon: BarChart3 },
  ];

  if (!user) {
    navItems.push({ name: "Login", path: "/login", icon: LogIn });
  } else if (role === "citizen") {
    navItems.splice(1, 0, { name: "Report", path: "/report", icon: PlusCircle });
    navItems.push({ name: "Profile", path: "/profile", icon: UserIcon });
  } else if (role === "department") {
    navItems.push({ name: "Dashboard", path: "/department", icon: LayoutDashboard });
    navItems.push({ name: "Profile", path: "/profile", icon: UserIcon });
  } else if (role === "admin") {
    navItems.push({ name: "Admin", path: "/admin", icon: LayoutDashboard });
    navItems.push({ name: "Users", path: "/admin/users", icon: Users });
    navItems.push({ name: "Profile", path: "/profile", icon: UserIcon });
  }

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const activeVariant = role === 'admin' ? 'admin' : role === 'department' ? 'department' : 'primary';
  const mobileActiveColor = role === 'admin' ? 'text-[var(--color-civic-admin)] bg-[var(--color-civic-admin-soft)]' : 
                            role === 'department' ? 'text-[var(--color-civic-department)] bg-[var(--color-civic-department-soft)]' : 
                            'text-[var(--color-civic-primary)] bg-[var(--color-civic-primary-soft)]';

  return (
    <div className="min-h-[100dvh] flex flex-col relative overflow-x-hidden">
      {/* Decorative background blurs and grid */}
      <div className="fixed inset-0 pointer-events-none z-[-1]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-civic-border)_1px,transparent_1px)] [background-size:24px_24px] opacity-50" />
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[var(--color-civic-primary-soft)] rounded-full blur-[150px] opacity-40" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[var(--color-civic-secondary-soft)] rounded-full blur-[150px] opacity-40" />
      </div>

      {demoMode && (
        <div className="bg-[var(--color-civic-text-primary)] text-white px-4 py-2 text-center text-sm font-bold shadow-md relative z-[60] flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--color-civic-secondary-soft)]" />
          Demo Mode Active: Follow the guided steps to see Community Hero in action.
        </div>
      )}

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
                  {item.name}
                </NeumorphicButton>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setDemoMode(!demoMode)}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${demoMode ? "bg-[var(--color-civic-surface-inset)] text-[var(--color-civic-primary)] border-[var(--color-civic-primary)]/30 shadow-[var(--shadow-neumorphic-inset)]" : "bg-[var(--color-civic-surface)] text-[var(--color-civic-text-secondary)] border-[var(--color-civic-border)] shadow-[var(--shadow-neumorphic)]"}`}
          >
            <Sparkles
              className={`h-3.5 w-3.5 ${demoMode ? "text-[var(--color-civic-primary)]" : "text-[var(--color-civic-text-muted)]"}`}
            />
            Demo Mode
          </button>

          {user ? (
            <div className="flex items-center gap-4 bg-[var(--color-civic-surface)] p-1.5 pr-4 rounded-full border border-[var(--color-civic-border)] shadow-[var(--shadow-neumorphic)]">
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
                {role === "citizen" ? `${stats.points} pts` : role}
              </span>
              <div className="h-4 w-px bg-[var(--color-civic-border)] mx-1 hidden sm:block" />
              <button
                onClick={handleLogout}
                className="text-[var(--color-civic-text-muted)] hover:text-[var(--color-civic-danger)] transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link to="/login">
              <NeumorphicButton
                size="sm"
                variant="secondary"
                className="gap-2"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </NeumorphicButton>
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 pb-[calc(120px+env(safe-area-inset-bottom))] md:pb-8 z-10">
        <Outlet />
      </main>

      {/* Demo Guide Component */}
      {demoMode && <DemoGuide />}

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
                <span className="text-[10px] font-bold tracking-wide uppercase">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
