import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { NotificationProvider } from "./context/NotificationContext";
import { Layout } from "./components/layout/Layout";
import { RequireAuth, RequirePermission } from "./components/RouteGuards";
import { Permission } from "./lib/auth/permissions";
import { Home } from "./pages/Home";
import { Report } from "./pages/Report";
import { Issues } from "./pages/Issues";
import { IssueDetail } from "./pages/IssueDetail";
import { Admin } from "./pages/Admin";
import { AdminUsers } from "./pages/AdminUsers";
import { Impact } from "./pages/Impact";
import { Profile } from "./pages/Profile";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { DepartmentDashboard } from "./pages/DepartmentDashboard";
import { Notifications } from "./pages/Notifications";
import { RequestRole } from "./pages/RequestRole";
import { RoleRequests } from "./pages/RoleRequests";
import { AuditLogs } from "./pages/AuditLogs";
import { Leaderboard } from "./pages/Leaderboard";
import { registerNotificationSubscribers } from "./lib/events/subscribers";

registerNotificationSubscribers();

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="issues" element={<Issues />} />
                <Route path="issues/:id" element={<IssueDetail />} />
                <Route path="impact" element={<Impact />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="forgot-password" element={<ForgotPassword />} />

                <Route element={<RequireAuth />}>
                  <Route path="report" element={<Report />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="apply-for-role" element={<RequestRole />} />
                  <Route path="leaderboard" element={<Leaderboard />} />
                </Route>

                <Route
                  element={
                    <RequirePermission
                      requiredPermission={Permission.VIEW_DEPT_DASHBOARD}
                    />
                  }
                >
                  <Route path="department" element={<DepartmentDashboard />} />
                </Route>

                <Route
                  element={
                    <RequirePermission
                      requiredPermission={Permission.VIEW_ADMIN_DASHBOARD}
                    />
                  }
                >
                  <Route path="admin" element={<Admin />} />
                </Route>

                <Route
                  element={
                    <RequirePermission
                      requiredPermission={Permission.MANAGE_USERS}
                    />
                  }
                >
                  <Route path="admin/users" element={<AdminUsers />} />
                </Route>

                <Route
                  element={
                    <RequirePermission
                      requiredPermission={Permission.MANAGE_ADMINS}
                    />
                  }
                >
                  <Route
                    path="admin/role-requests"
                    element={<RoleRequests />}
                  />
                </Route>

                <Route
                  element={
                    <RequirePermission
                      requiredPermission={Permission.VIEW_AUDIT_LOGS}
                    />
                  }
                >
                  <Route path="admin/audit-logs" element={<AuditLogs />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
