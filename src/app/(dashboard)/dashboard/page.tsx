/**
 * Dashboard placeholder page.
 * Proves the end-to-end auth flow works: login → callback → dashboard.
 *
 * This will be replaced with the full dashboard builder in Phase 4.
 */
export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Dashboard
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">
        You are signed in. The full CRO dashboard will be built in Phase 4.
      </p>
    </div>
  )
}
