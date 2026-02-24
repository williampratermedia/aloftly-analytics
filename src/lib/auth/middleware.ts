import type { SupabaseClient } from '@supabase/supabase-js'

export interface OrgContext {
  orgId: string
  userId: string
  role: string
  user: NonNullable<Awaited<ReturnType<SupabaseClient['auth']['getUser']>>['data']['user']>
}

/**
 * Extracts org context from the authenticated user's JWT claims.
 *
 * Uses getUser() (not getSession()) per security best practice — getUser() re-validates
 * the JWT with the Supabase Auth server, preventing cookie forgery attacks.
 *
 * The org_id and user_role are injected into the JWT via the custom_access_token_hook
 * Postgres function registered in Supabase Dashboard → Authentication → Hooks.
 *
 * Returns null if the user is not authenticated.
 *
 * @example
 * const supabase = await getUserClient()
 * const ctx = await getOrgContext(supabase)
 * if (!ctx) redirect('/login')
 * const { orgId, userId, role } = ctx
 */
export async function getOrgContext(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>
): Promise<OrgContext | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  // Custom claims are injected by custom_access_token_hook into app_metadata
  // The hook injects org_id and user_role as top-level JWT claims
  // supabase-js surfaces these via user.app_metadata for service-role access
  // and via the JWT itself — we read from app_metadata as the canonical source
  const orgId = (user.app_metadata?.org_id as string | undefined) ?? null
  const role = (user.app_metadata?.user_role as string | undefined) ?? 'viewer'

  if (!orgId) return null

  return {
    orgId,
    userId: user.id,
    role,
    user,
  }
}
