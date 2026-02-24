import { redirect } from 'next/navigation'
import { getUserClient } from '@/lib/supabase/server'

/**
 * Authenticated dashboard shell layout.
 *
 * Belt-and-suspenders auth check in addition to middleware protection.
 * This ensures the dashboard is never rendered without a valid user session
 * even if middleware is misconfigured.
 *
 * This is a structural placeholder — the full sidebar with workspace switcher,
 * nav links, breadcrumbs, and user avatar will be built in Phase 4.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await getUserClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen">
      {/* Left sidebar — structural placeholder for Phase 4 */}
      <aside
        className="fixed left-0 top-0 h-full w-64 flex flex-col z-40"
        style={{ background: '#0f172a' }} /* slate-900 */
      >
        {/* Wordmark */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M9 3L15 7.5V12L9 15L3 12V7.5L9 3Z"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 3V15M3 7.5L15 7.5"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeOpacity="0.5"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">
              Aloftly
            </span>
          </div>
        </div>

        {/* Navigation placeholder — Phase 4 will fill this */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-2 py-1.5 text-xs font-medium text-white/30 tracking-wider uppercase">
            Navigation
          </p>
          {[
            { label: 'Dashboards', path: '/dashboard' },
            { label: 'Stores', path: '/stores' },
            { label: 'Integrations', path: '/integrations' },
            { label: 'Settings', path: '/settings' },
          ].map((item) => (
            <a
              key={item.path}
              href={item.path}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-white/60 hover:text-white hover:bg-white/8 active:bg-white/12 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/20 flex-shrink-0" />
              {item.label}
            </a>
          ))}
        </nav>

        {/* User section — sign out */}
        <div className="px-3 pb-4 border-t border-white/10 pt-4">
          <div className="px-2.5 mb-3">
            <p className="text-xs text-white/40 truncate">{user.email}</p>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 ml-64 min-h-screen bg-neutral-50">
        {children}
      </main>
    </div>
  )
}

/**
 * Client-side sign out button.
 * Must be a separate component since it uses browser Supabase client.
 */
function SignOutButton() {
  return (
    <form action="/api/auth/signout" method="POST">
      <button
        type="submit"
        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm text-white/50 hover:text-white/80 hover:bg-white/8 active:bg-white/12 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 text-left"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="flex-shrink-0"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Sign out
      </button>
    </form>
  )
}
