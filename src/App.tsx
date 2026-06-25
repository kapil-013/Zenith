import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { Layout } from "./components/layout/Layout";
import { RequireAuth, RequireRole } from "./components/RouteGuards";
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

export default function App() {
  return (
    <AuthProvider>
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
              </Route>
              
              <Route element={<RequireRole allowedRoles={["admin", "department"]} />}>
                <Route path="department" element={<DepartmentDashboard />} />
              </Route>

              <Route element={<RequireRole allowedRoles={["admin"]} />}>
                <Route path="admin" element={<Admin />} />
                <Route path="admin/users" element={<AdminUsers />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
