export const permissionKeys = [
  "view_suppliers",
  "create_suppliers",
  "edit_suppliers",
  "delete_suppliers",
  "publish_suppliers",
  "manage_addresses",
  "manage_users",
  "manage_owners",
  "process_claims",
  "view_audit",
  "manage_settings",
] as const;

export type PermissionKey = (typeof permissionKeys)[number];
