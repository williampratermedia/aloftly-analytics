import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/db/schema/types'

/**
 * Browser Supabase client for use in "use client" components.
 * This client enforces RLS automatically via the user's session token.
 * Never use this in server components — use getUserClient() instead.
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
