/**
 * Role-Based Access Control (RBAC) helpers.
 *
 * Role hierarchy (highest to lowest): owner > admin > member > viewer
 *
 * IMPORTANT: JWT claims carry org_id and user_role. When a user's role changes
 * in the database, the existing JWT retains the old role until it expires or the
 * session is refreshed. For sensitive role changes, call supabase.auth.signOut()
 * to force re-authentication with the updated claims.
 */

/** Ordered from highest privilege to lowest */
export const ROLE_HIERARCHY = ['owner', 'admin', 'member', 'viewer'] as const

export type OrgRole = (typeof ROLE_HIERARCHY)[number]

/**
 * Mapping of permissions to the minimum required role.
 * A user with a higher role also has all lower-role permissions.
 */
export const PERMISSION_ROLE_MAP: Record<string, OrgRole> = {
  manage_billing: 'owner',
  manage_team: 'admin',
  manage_integrations: 'admin',
  manage_workspaces: 'admin',
  use_dashboards: 'member',
  manage_own_integrations: 'member',
  view_dashboards: 'viewer',
  export_data: 'viewer',
} as const

/**
 * Returns true if userRole is equal to or higher in privilege than requiredRole.
 *
 * @example
 * hasRole('admin', 'member') // true  — admin outranks member
 * hasRole('viewer', 'admin') // false — viewer cannot perform admin actions
 * hasRole('owner', 'owner')  // true  — same role
 */
export function hasRole(userRole: string, requiredRole: string): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole as OrgRole)
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole as OrgRole)

  // Unknown roles have no access
  if (userIndex === -1 || requiredIndex === -1) return false

  // Lower index = higher privilege (owner is at index 0)
  return userIndex <= requiredIndex
}

/**
 * Returns true if the user's role grants the specified permission.
 *
 * @example
 * hasPermission('admin', 'manage_team')      // true
 * hasPermission('viewer', 'manage_billing')  // false
 * hasPermission('member', 'view_dashboards') // true
 */
export function hasPermission(userRole: string, permission: string): boolean {
  const requiredRole = PERMISSION_ROLE_MAP[permission]
  if (!requiredRole) return false
  return hasRole(userRole, requiredRole)
}
