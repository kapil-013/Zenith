export enum UserRole {
  GUEST = "guest",
  CITIZEN = "citizen",
  DEPARTMENT = "department",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

export enum Permission {
  VIEW_PROFILE = "VIEW_PROFILE",
  EDIT_PROFILE = "EDIT_PROFILE",
  REPORT_ISSUE = "REPORT_ISSUE",
  VERIFY_ISSUE = "VERIFY_ISSUE",
  MANAGE_ASSIGNED_ISSUES = "MANAGE_ASSIGNED_ISSUES",
  UPDATE_ISSUE_STATUS = "UPDATE_ISSUE_STATUS",
  VIEW_ANALYTICS = "VIEW_ANALYTICS",
  ASSIGN_DEPARTMENT = "ASSIGN_DEPARTMENT",
  MANAGE_DEPARTMENTS = "MANAGE_DEPARTMENTS",
  MANAGE_USERS = "MANAGE_USERS",
  MANAGE_ADMINS = "MANAGE_ADMINS",
  VIEW_AUDIT_LOGS = "VIEW_AUDIT_LOGS",
  MANAGE_PLATFORM = "MANAGE_PLATFORM",
  CONFIGURE_SYSTEM = "CONFIGURE_SYSTEM",
  EMERGENCY_OVERRIDE = "EMERGENCY_OVERRIDE",
  EXPORT_REPORTS = "EXPORT_REPORTS",
  VIEW_ADMIN_DASHBOARD = "VIEW_ADMIN_DASHBOARD",
  VIEW_DEPT_DASHBOARD = "VIEW_DEPT_DASHBOARD",
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.GUEST]: [],
  [UserRole.CITIZEN]: [
    Permission.VIEW_PROFILE,
    Permission.EDIT_PROFILE,
    Permission.REPORT_ISSUE,
    Permission.VERIFY_ISSUE,
  ],
  [UserRole.DEPARTMENT]: [
    Permission.VIEW_PROFILE,
    Permission.MANAGE_ASSIGNED_ISSUES,
    Permission.UPDATE_ISSUE_STATUS,
    Permission.VIEW_DEPT_DASHBOARD,
    Permission.EXPORT_REPORTS,
  ],
  [UserRole.ADMIN]: [
    Permission.VIEW_PROFILE,
    Permission.VIEW_ANALYTICS,
    Permission.ASSIGN_DEPARTMENT,
    Permission.MANAGE_DEPARTMENTS,
    Permission.MANAGE_USERS,
    Permission.VIEW_ADMIN_DASHBOARD,
    Permission.EXPORT_REPORTS,
  ],
  [UserRole.SUPER_ADMIN]: [
    Permission.VIEW_PROFILE,
    Permission.VIEW_ANALYTICS,
    Permission.ASSIGN_DEPARTMENT,
    Permission.MANAGE_DEPARTMENTS,
    Permission.MANAGE_USERS,
    Permission.MANAGE_ADMINS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.MANAGE_PLATFORM,
    Permission.CONFIGURE_SYSTEM,
    Permission.EMERGENCY_OVERRIDE,
    Permission.VIEW_ADMIN_DASHBOARD,
    Permission.EXPORT_REPORTS,
  ],
};

export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  const userRole = role as UserRole;
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
}

export function hasAnyPermission(role: string | null | undefined, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

export function hasAllPermissions(role: string | null | undefined, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

export function isCitizen(role: string | null | undefined): boolean {
  return role === UserRole.CITIZEN;
}

export function isDepartment(role: string | null | undefined): boolean {
  return role === UserRole.DEPARTMENT;
}

export function isAdmin(role: string | null | undefined): boolean {
  return role === UserRole.ADMIN;
}

export function isSuperAdmin(role: string | null | undefined): boolean {
  return role === UserRole.SUPER_ADMIN;
}

export function isAdminOrSuperAdmin(role: string | null | undefined): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
}
