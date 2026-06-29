import React, { useState, useEffect } from "react";
import { NeumorphicCard } from "../components/ui/card";
import { NeumorphicButton } from "../components/ui/button";
import { NeumorphicInput } from "../components/ui/input";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Users, Plus, ShieldBan } from "lucide-react";
import { auth } from "../lib/firebase";
import { isAdminOrSuperAdmin, hasPermission, Permission, isSuperAdmin, isDepartment, UserRole } from "../lib/auth/permissions";

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "department", departmentName: "" });
  const { user } = useAuth();
  const { addToast } = useToast();

  const fetchUsers = async () => {
    try {
      if (!auth.currentUser) return;
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      addToast("Failed to fetch users", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!auth.currentUser) return;
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      addToast(newUser.role === UserRole.DEPARTMENT ? "Department account created. Share these credentials securely." : "Admin account created.", "success");
      setShowModal(false);
      setNewUser({ name: "", email: "", password: "", role: "department", departmentName: "" });
      fetchUsers();
    } catch (e: any) {
      addToast(e.message, "error");
    }
  };

  const handleDisableUser = async (uid: string, disabled: boolean) => {
    try {
      if (!auth.currentUser) return;
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/admin/disable-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ uid, disabled })
      });
      if (!res.ok) throw new Error("Failed to update status");
      addToast(disabled ? "User disabled" : "User enabled", "success");
      fetchUsers();
    } catch (e) {
      addToast("Failed to update status", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--color-civic-text-primary)] tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-[var(--color-civic-admin)]" />
            User Management
          </h1>
          <p className="text-[var(--color-civic-text-secondary)] font-medium mt-2">Manage citizens, departments, and admins.</p>
        </div>
        <NeumorphicButton onClick={() => setShowModal(true)} variant="primary" className="gap-2 font-bold">
          <Plus className="h-4 w-4" />
          Create User
        </NeumorphicButton>
      </div>

      <NeumorphicCard className="p-0 overflow-hidden shadow-[var(--shadow-neumorphic)] border border-transparent">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-civic-surface-inset)] border-b border-[var(--color-civic-surface-inset)]">
                <th className="p-4 font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs">Name / Email</th>
                <th className="p-4 font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs">Role</th>
                <th className="p-4 font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs">Department</th>
                <th className="p-4 font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs">Status</th>
                <th className="p-4 font-bold text-[var(--color-civic-text-muted)] uppercase tracking-widest text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-[var(--color-civic-surface-inset)] last:border-0 hover:bg-[var(--color-civic-surface-inset)]/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-[var(--color-civic-text-primary)]">{u.name}</div>
                    <div className="text-xs text-[var(--color-civic-text-secondary)] font-medium">{u.email}</div>
                  </td>
                  <td className="p-4 capitalize">
                    <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${
                      isAdminOrSuperAdmin(u.role) ? 'bg-[var(--color-civic-admin)]/10 text-[var(--color-civic-admin)] shadow-sm border border-[var(--color-civic-admin)]/20' :
                      isDepartment(u.role) ? 'bg-[var(--color-civic-department)]/10 text-[var(--color-civic-department)] shadow-sm border border-[var(--color-civic-department)]/20' :
                      'bg-[var(--color-civic-surface-inset)] text-[var(--color-civic-text-secondary)] shadow-sm border border-transparent'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-[var(--color-civic-text-secondary)] font-medium">{u.departmentName || "-"}</td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${
                      u.status === 'disabled' ? 'bg-[var(--color-civic-danger)]/10 text-[var(--color-civic-danger)] shadow-sm border border-[var(--color-civic-danger)]/20' : 'bg-[var(--color-civic-status-confirmed)]/10 text-[var(--color-civic-status-confirmed)] shadow-sm border border-[var(--color-civic-status-confirmed)]/20'
                    }`}>
                      {u.status || "active"}
                    </span>
                  </td>
                  <td className="p-4">
                    {u.id !== user?.id && (!isAdminOrSuperAdmin(u.role) || isSuperAdmin(user?.role)) && (
                      <NeumorphicButton
                        size="sm"
                        variant={u.status === 'disabled' ? "primary" : "danger"}
                        onClick={() => handleDisableUser(u.id, u.status !== 'disabled')}
                        className="py-1 px-2 font-bold"
                      >
                        {u.status === 'disabled' ? "Enable" : <ShieldBan className="h-4 w-4" />}
                      </NeumorphicButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </NeumorphicCard>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--color-civic-text-primary)]/40 backdrop-blur-sm">
          <NeumorphicCard className="w-full max-w-md p-6 shadow-[var(--shadow-neumorphic-floating)]">
            <h2 className="text-xl font-extrabold mb-4 text-[var(--color-civic-text-primary)] tracking-tight">Create Admin/Department User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--color-civic-text-secondary)] mb-1">Name</label>
                <NeumorphicInput
                  required
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  placeholder="e.g. Traffic Admin"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-civic-text-secondary)] mb-1">Email</label>
                <NeumorphicInput
                  type="email"
                  required
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  placeholder="dept@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-civic-text-secondary)] mb-1">Temporary Password</label>
                <NeumorphicInput
                  required
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                  placeholder="minimum 6 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-civic-text-secondary)] mb-1">Role</label>
                <select
                  className="w-full bg-[var(--color-civic-surface-inset)] shadow-[var(--shadow-neumorphic-inset)] border border-transparent rounded-xl px-4 py-2.5 text-[var(--color-civic-text-primary)] font-medium focus:outline-none focus:border-[var(--color-civic-primary)]/50 transition-all appearance-none"
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="department">Department</option>
                  {hasPermission(user?.role, Permission.MANAGE_ADMINS) && <option value="admin">Admin</option>}
                </select>
              </div>
              {newUser.role === UserRole.DEPARTMENT && (
                <div>
                  <label className="block text-sm font-bold text-[var(--color-civic-text-secondary)] mb-1">Department</label>
                  <select
                    required
                    className="w-full bg-[var(--color-civic-surface-inset)] shadow-[var(--shadow-neumorphic-inset)] border border-transparent rounded-xl px-4 py-2.5 text-[var(--color-civic-text-primary)] font-medium focus:outline-none focus:border-[var(--color-civic-primary)]/50 transition-all appearance-none"
                    value={newUser.departmentName}
                    onChange={e => setNewUser({...newUser, departmentName: e.target.value})}
                  >
                    <option value="">Select Department...</option>
                    <option value="Road Maintenance">Road Maintenance</option>
                    <option value="Sanitation Department">Sanitation Department</option>
                    <option value="Water Board">Water Board</option>
                    <option value="Electrical Maintenance">Electrical Maintenance</option>
                    <option value="Drainage Department">Drainage Department</option>
                    <option value="Public Works">Public Works</option>
                    <option value="Traffic Management">Traffic Management</option>
                    <option value="Community Volunteers">Community Volunteers</option>
                    <option value="General Civic Helpdesk">General Civic Helpdesk</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2 mt-6">
                <NeumorphicButton type="button" onClick={() => setShowModal(false)} variant="ghost">Cancel</NeumorphicButton>
                <NeumorphicButton type="submit" variant="primary">Create User</NeumorphicButton>
              </div>
            </form>
          </NeumorphicCard>
        </div>
      )}
    </div>
  );
}
