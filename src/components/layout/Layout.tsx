import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { NeumorphicButton } from "../ui/button";
import { DemoGuide } from "../DemoGuide";

export function Layout() {
  const { user, signInWithGoogle, logout } = useAuth();
  const { stats } = useUserStats();
  const location = useLocation();
  const [demoMode, setDemoMode] = useState(() => {
    return localStorage.getItem("demoMode") === "true";
  });

  useEffect(() => {
    localStorage.setItem("demoMode", String(demoMode));
  }, [demoMode]);

  const navItems = [
    { name: "Explore", path: "/issues", icon: MapPin },
    { name: "Report", path: "/report", icon: PlusCircle },
    { name: "Impact", path: "/impact", icon: BarChart3 },
    ...(user ? [{ name: "Profile", path: "/profile", icon: UserIcon }] : []),
    ...(user?.role === "Admin"
      ? [{ name: "Admin", path: "/admin", icon: LayoutDashboard }]
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Decorative background blurs */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none z-[-1]" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-green-100/40 rounded-full blur-[120px] pointer-events-none z-[-1]" />

      {demoMode && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 text-center text-sm font-bold shadow-md relative z-[60] flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-300" />
          Demo Mode Active: Follow the guided steps to see Community Hero in
          action.
        </div>
      )}

      <header className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between bg-white/40 backdrop-blur-xl border-b border-white/60 shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
        <Link
          to="/"
          className="flex items-center gap-2 text-blue-600 font-bold text-xl tracking-tight hover:scale-105 transition-transform"
        >
          <div className="p-1.5 bg-white/60 rounded-lg shadow-sm border border-white">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <span>Community Hero</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2 bg-white/30 backdrop-blur-md p-1 rounded-2xl border border-white/50 shadow-sm">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/" &&
                location.pathname.startsWith(item.path + "/"));
            return (
              <Link key={item.path} to={item.path}>
                <NeumorphicButton
                  variant={isActive ? "primary" : "ghost"}
                  size="sm"
                  className={`gap-2 rounded-xl transition-all ${isActive ? "shadow-md bg-blue-600 hover:bg-blue-700" : "hover:bg-white/50"}`}
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
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${demoMode ? "bg-indigo-100 text-indigo-700 border-indigo-200 shadow-inner" : "bg-white/60 text-slate-500 border-white shadow-sm hover:bg-white"}`}
          >
            <Sparkles
              className={`h-3.5 w-3.5 ${demoMode ? "text-indigo-500" : "text-slate-400"}`}
            />
            Demo Mode
          </button>

          {user ? (
            <div className="flex items-center gap-4 bg-white/40 p-1.5 pr-4 rounded-full border border-white/60 shadow-sm">
              <div className="flex items-center justify-center h-8 w-8 bg-white rounded-full shadow-sm">
                <UserIcon className="h-4 w-4 text-slate-500" />
              </div>
              <span className="hidden sm:inline-block text-sm font-bold text-slate-700">
                {stats.points} pts
              </span>
              <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />
              <button
                onClick={logout}
                className="text-slate-500 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <NeumorphicButton
              size="sm"
              onClick={signInWithGoogle}
              className="gap-2 bg-white shadow-sm hover:shadow-md border border-white/60"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </NeumorphicButton>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 z-10">
        <Outlet />
      </main>

      {/* Demo Guide Component */}
      {demoMode && <DemoGuide />}

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-xl p-3 border-t border-white/60 shadow-[0_-4px_30px_rgba(0,0,0,0.05)] z-[60] flex justify-around items-center rounded-t-3xl pb-safe">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/" &&
              location.pathname.startsWith(item.path + "/"));
          return (
            <Link key={item.path} to={item.path}>
              <div
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive ? "text-blue-600 bg-blue-50" : "text-slate-500 hover:bg-slate-100"}`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-semibold">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
