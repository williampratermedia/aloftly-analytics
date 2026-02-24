import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * PKCE code exchange route — handles both magic link and Google OAuth callbacks.
 *
 * Supabase sends users here after authentication with a `code` search parameter.
 * This route exchanges the code for a session using the PKCE flow.
 *
 * Magic link flow: user clicks link in email → Supabase redirects here with code
 * OAuth flow: user authorizes Google → Google redirects to Supabase → Supabase redirects here
 *
 * On success: redirect to /dashboard (or `next` param if provided)
 * On failure: redirect to /login?error=auth-code-error
 *
 * NOTE: The onboarding wizard (PROD-05) is Phase 4 scope.
 * Phase 4 will update this redirect to /onboarding for first-time users.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Default to /dashboard — onboarding wizard redirect will be added in Phase 4
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Code missing or exchange failed — redirect to login with error flag
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}
