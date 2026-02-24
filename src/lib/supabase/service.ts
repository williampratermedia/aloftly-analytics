import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/db/schema/types'

/**
 * Service-role Supabase client.
 *
 * WARNING: Service role bypasses RLS. Only use in ingestion routes and sync jobs.
 * NEVER import this file in client components or user-facing query paths.
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser bundle.
 *
 * Valid use cases: webhook ingestion, sync jobs, Vault credential reads/writes.
 * Invalid use cases: user-facing data reads (use getUserClient() instead).
 */
export function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  )
}
