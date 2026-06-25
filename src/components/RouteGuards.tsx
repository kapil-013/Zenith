import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert } from "lucide-react";
import { NeumorphicCard } from "./ui/card";

export function RequireAuth() {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  if (!user) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <NeumorphicCard className="p-8 max-w-sm w-full text-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold">Sign In Required</h2>
          <p className="text-slate-500 text-sm">Please sign in to access this page.</p>
        </NeumorphicCard>
      </div>
    );
  }
  return <Outlet />;
}

export function RequireRole({ allowedRoles }: { allowedRoles: string[] }) {
  const { user, role, loading } = useAuth();
  
  if (loading) return null;
  
  if (!user || !role || !allowedRoles.includes(role)) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <NeumorphicCard className="p-8 max-w-sm w-full text-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-slate-500 text-sm">You do not have permission to view this page.</p>
        </NeumorphicCard>
      </div>
    );
  }
  return <Outlet />;
}
