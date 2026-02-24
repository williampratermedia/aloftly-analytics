import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/db/schema/types'

/**
 * Server Supabase client with cookie-based session management.
 * This client enforces RLS — it reads the user's session from cookies.
 * Use this in server components and server actions for all user-facing data reads.
 *
 * NEVER use getServiceClient() for user-facing reads — it bypasses RLS.
 */
export async function getUserClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll is called from middleware where cookies cannot be set.
            // This is safe to ignore — middleware handles cookie updates separately.
          }
        },
      },
    }
  )
}
