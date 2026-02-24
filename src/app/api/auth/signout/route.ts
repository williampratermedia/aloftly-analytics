import { NextResponse } from 'next/server'
import { getUserClient } from '@/lib/supabase/server'

/**
 * Server-side sign out route.
 * Signs the user out of Supabase and redirects to /login.
 * Called by the sign out form in the dashboard sidebar.
 */
export async function POST() {
  const supabase = await getUserClient()
  await supabase.auth.signOut()

  return NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
    { status: 302 }
  )
}
