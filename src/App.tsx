import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { Layout } from "./components/layout/Layout";
import { Home } from "./pages/Home";
import { Report } from "./pages/Report";
import { Issues } from "./pages/Issues";
import { IssueDetail } from "./pages/IssueDetail";
import { Admin } from "./pages/Admin";
import { Impact } from "./pages/Impact";
import { Profile } from "./pages/Profile";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="report" element={<Report />} />
              <Route path="issues" element={<Issues />} />
              <Route path="issues/:id" element={<IssueDetail />} />
              <Route path="admin" element={<Admin />} />
              <Route path="impact" element={<Impact />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
