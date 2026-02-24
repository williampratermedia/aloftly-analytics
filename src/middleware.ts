import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next.js middleware — session refresh + route protection.
 *
 * CRITICAL: Uses getUser() NOT getSession() — getUser() re-validates the JWT
 * with the Supabase Auth server, preventing token forgery via cookie manipulation.
 * getSession() trusts the cookie as-is and is a security vulnerability server-side.
 *
 * Session management: Supabase tokens expire and must be refreshed on each request.
 * This middleware handles that refresh via the getAll/setAll cookie pattern.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // First pass: update the request cookies for downstream use
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // Second pass: create a new response with updated cookies
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not write any logic between createServerClient and getUser().
  // A simple mistake could make it very hard to debug issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes — always accessible
  const isPublicRoute =
    pathname === '/login' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/webhooks/')

  // Protected route prefixes
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/settings') ||
    // (dashboard) route group matches /dashboard prefix above
    // also handle direct child paths of the (dashboard) group
    pathname === '/'

  // Redirect unauthenticated users away from protected routes
  if (!user && isProtectedRoute && !isPublicRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users away from the login page
  if (user && pathname === '/login') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  // IMPORTANT: Return supabaseResponse to ensure session cookies are properly set.
  // Do NOT return NextResponse.next() directly — the refreshed session cookies
  // must be forwarded to the browser.
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (browser favicon request)
     * - public directory files (png, jpg, svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
