import { UserRole } from "@prisma/client";

export type Permission =
  | "MANAGE_TENANT_SETTINGS"
  | "MANAGE_STAFF"
  | "MANAGE_PLANS"
  | "MEMBER_ONBOARDING"
  | "COLLECT_PAYMENTS"
  | "ISSUE_REFUNDS"
  | "FREEZE_CANCEL_MEMBERSHIP"
  | "VIEW_FINANCIAL_REPORTS"
  | "MANUAL_ATTENDANCE"
  | "VIEW_ASSIGNED_MEMBERS"
  | "CONFIGURE_DEVICES"
  | "SEND_BROADCASTS";

const ROLE_PERMISSIONS_MAP: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "MANAGE_TENANT_SETTINGS",
    "MANAGE_STAFF",
    "MANAGE_PLANS",
    "MEMBER_ONBOARDING",
    "COLLECT_PAYMENTS",
    "ISSUE_REFUNDS",
    "FREEZE_CANCEL_MEMBERSHIP",
    "VIEW_FINANCIAL_REPORTS",
    "MANUAL_ATTENDANCE",
    "VIEW_ASSIGNED_MEMBERS",
    "CONFIGURE_DEVICES",
    "SEND_BROADCASTS",
  ],
  GYM_OWNER: [
    "MANAGE_TENANT_SETTINGS",
    "MANAGE_STAFF",
    "MANAGE_PLANS",
    "MEMBER_ONBOARDING",
    "COLLECT_PAYMENTS",
    "ISSUE_REFUNDS",
    "FREEZE_CANCEL_MEMBERSHIP",
    "VIEW_FINANCIAL_REPORTS",
    "MANUAL_ATTENDANCE",
    "VIEW_ASSIGNED_MEMBERS",
    "CONFIGURE_DEVICES",
    "SEND_BROADCASTS",
  ],
  MANAGER: [
    "MANAGE_PLANS",
    "MEMBER_ONBOARDING",
    "COLLECT_PAYMENTS",
    "FREEZE_CANCEL_MEMBERSHIP",
    "VIEW_FINANCIAL_REPORTS",
    "MANUAL_ATTENDANCE",
    "VIEW_ASSIGNED_MEMBERS",
    "CONFIGURE_DEVICES",
    "SEND_BROADCASTS",
  ],
  FRONT_DESK: [
    "MEMBER_ONBOARDING",
    "COLLECT_PAYMENTS",
    "MANUAL_ATTENDANCE",
  ],
  TRAINER: [
    "VIEW_ASSIGNED_MEMBERS",
  ],
  ACCOUNTANT: [
    "COLLECT_PAYMENTS",
    "ISSUE_REFUNDS",
    "VIEW_FINANCIAL_REPORTS",
  ],
};

/**
 * Check if a role possesses a specific permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS_MAP[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if a role can access an operational module.
 */
export function canAccessModule(role: UserRole, module: "billing" | "members" | "attendance" | "settings" | "reports" | "devices"): boolean {
  switch (module) {
    case "billing":
      return hasPermission(role, "COLLECT_PAYMENTS") || hasPermission(role, "VIEW_FINANCIAL_REPORTS");
    case "members":
      return hasPermission(role, "MEMBER_ONBOARDING") || hasPermission(role, "VIEW_ASSIGNED_MEMBERS");
    case "attendance":
      return hasPermission(role, "MANUAL_ATTENDANCE") || role === "GYM_OWNER" || role === "MANAGER";
    case "settings":
      return hasPermission(role, "MANAGE_TENANT_SETTINGS") || hasPermission(role, "MANAGE_PLANS");
    case "reports":
      return hasPermission(role, "VIEW_FINANCIAL_REPORTS");
    case "devices":
      return hasPermission(role, "CONFIGURE_DEVICES");
    default:
      return false;
  }
}
