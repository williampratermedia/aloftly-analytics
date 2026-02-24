import { redirect } from 'next/navigation'

/**
 * Root route within (dashboard) group — redirects to /dashboard.
 * The middleware will further redirect to /login if not authenticated.
 */
export default function RootPage() {
  redirect('/dashboard')
}
