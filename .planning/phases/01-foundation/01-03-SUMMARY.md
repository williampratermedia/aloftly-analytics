---
phase: 01-foundation
plan: 03
subsystem: auth
tags: [supabase, supabase-ssr, rbac, vault, middleware, nextjs, magic-link, oauth, google]

# Dependency graph
requires:
  - 01-02 (org_members table for JWT hook to inject org_id + user_role into claims)
provides:
  - createBrowserSupabaseClient() in src/lib/supabase/client.ts (browser client, RLS enforced)
  - getUserClient() in src/lib/supabase/server.ts (server client, cookie-based session, server-only)
  - getServiceClient() in src/lib/supabase/service.ts (service-role client, ingestion only, server-only)
  - hasRole() / hasPermission() in src/lib/auth/rbac.ts (4-tier RBAC: owner > admin > member > viewer)
  - getOrgContext() in src/lib/auth/middleware.ts (org_id + role extraction from JWT via getUser())
  - storeCredential() / getCredential() in src/lib/vault.ts (Vault RPC wrappers, server-only)
  - Session refresh middleware at src/middleware.ts (getUser() not getSession())
  - Login page at /login (magic link + Google OAuth, no passwords)
  - Auth callback at /auth/callback (PKCE code exchange)
  - Dashboard shell at /dashboard (server-auth check + minimal sidebar)
  - Database type stub at src/db/schema/types.ts (includes Vault RPC function signatures)
affects:
  - All Phase 2 adapters (use getUserClient/getServiceClient for data reads/writes)
  - All Phase 3 integration adapters (use getServiceClient for webhook ingestion)
  - Phase 4 dashboard UI (uses getUserClient, getOrgContext, hasPermission for UI rendering)
  - Phase 4 onboarding wizard (will update callback redirect from /dashboard to /onboarding)

# Tech tracking
tech-stack:
  added:
    - server-only (compile-time guard preventing server modules from being imported client-side)
    - shadcn/ui button, input, card components (via npx shadcn@latest add)
  patterns:
    - Three-client pattern: createBrowserSupabaseClient / getUserClient / getServiceClient
    - server-only import guard on all server-only modules (server.ts, service.ts, vault.ts)
    - getUser() over getSession() in all server-side auth checks (re-validates JWT with Supabase Auth server)
    - Cookie getAll/setAll pattern for @supabase/ssr session management in middleware
    - PKCE code exchange via exchangeCodeForSession in /auth/callback route
    - Form POST for sign-out (no client JS needed, SSR-compatible)

key-files:
  created:
    - src/lib/supabase/client.ts (createBrowserSupabaseClient — browser, RLS enforced)
    - src/lib/supabase/server.ts (getUserClient — server, cookie-based, server-only guard)
    - src/lib/supabase/service.ts (getServiceClient — service role, ingestion only, server-only)
    - src/lib/auth/rbac.ts (ROLE_HIERARCHY, hasRole, hasPermission, PERMISSION_ROLE_MAP)
    - src/lib/auth/middleware.ts (getOrgContext — extracts org_id + role from JWT via getUser())
    - src/lib/vault.ts (storeCredential, getCredential — Vault RPC wrappers, server-only)
    - src/db/schema/types.ts (Database type stub with Vault RPC signatures and enums)
    - src/middleware.ts (session refresh + route protection, getUser() pattern)
    - src/app/(auth)/login/page.tsx (magic link + Google OAuth login page)
    - src/app/(auth)/auth/callback/route.ts (PKCE code exchange, redirects to /dashboard)
    - src/app/(dashboard)/layout.tsx (server auth check + sidebar shell placeholder)
    - src/app/(dashboard)/dashboard/page.tsx (placeholder page proving auth flow end-to-end)
    - src/app/(dashboard)/page.tsx (root redirect to /dashboard)
    - src/app/api/auth/signout/route.ts (server-side sign out, redirects to /login)
    - src/components/ui/button.tsx (shadcn/ui)
    - src/components/ui/input.tsx (shadcn/ui)
    - src/components/ui/card.tsx (shadcn/ui)
  modified:
    - package.json (added server-only; shadcn components added to node_modules)

key-decisions:
  - "Database type stub (src/db/schema/types.ts) with Vault RPC signatures — Supabase CLI types not generated until project is live; stub provides compile-time safety for Vault RPC calls without requiring a running Supabase instance"
  - "getOrgContext reads from user.app_metadata (not JWT decode) — app_metadata is the surface supabase-js exposes custom hook claims on; avoids manual JWT parsing"
  - "Sign-out implemented as form POST to /api/auth/signout — no client-side JS required; server-side supabase.auth.signOut() clears the session cookie properly"
  - "Dashboard page at /dashboard (not (dashboard) root) — (dashboard)/page.tsx at root would conflict with src/app/page.tsx; moved placeholder to src/app/(dashboard)/dashboard/page.tsx"
  - "NEXT_PUBLIC_APP_URL env var referenced in signout route for redirect — avoids hardcoding localhost; falls back to localhost:3000 for local dev"

patterns-established:
  - "Always import from '@/lib/supabase/server' for server-side data reads (getUserClient); never use client.ts in server components"
  - "Always import from '@/lib/supabase/service' only in ingestion routes and sync jobs (never in user-facing query paths)"
  - "Always call supabase.auth.getUser() not getSession() in middleware and server components"
  - "Use getOrgContext() to extract org_id + role — never read JWT claims directly"
  - "Use hasPermission(role, permission) from rbac.ts for authorization checks; never hardcode role strings"

requirements-completed: [FOUN-02, FOUN-03, FOUN-04, FOUN-05]

# Metrics
duration: 25min
completed: 2026-02-23
---

# Phase 01 Plan 03: Auth Flow Summary

**Supabase Auth with magic link + Google OAuth, typed user/service client separation with server-only guards, 4-tier RBAC module, Vault TypeScript wrappers, and session middleware using getUser() for security**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-02-23T22:30:00Z
- **Completed:** 2026-02-23T22:55:00Z
- **Tasks:** 2
- **Files modified/created:** 17

## Accomplishments

- Created three typed Supabase client wrappers with correct access boundaries: browser client (RLS enforced via session), server client (cookie-based, server-only), service-role client (ingestion only, RLS bypassed, server-only)
- Implemented RBAC module with `ROLE_HIERARCHY` constant, `hasRole()` and `hasPermission()` helpers covering 4 roles (owner/admin/member/viewer) and 8 permissions
- Built complete auth flow: session-refreshing middleware using `getUser()`, magic link + Google OAuth login page, PKCE callback route, and authenticated dashboard shell
- Wrote Vault TypeScript wrappers (`storeCredential` / `getCredential`) that call Postgres RPC functions via service client — all guarded with `import 'server-only'`
- `npm run build` passes with all 7 routes rendering correctly; `npx tsc --noEmit` passes with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Typed Supabase client wrappers, RBAC module, Vault helpers** - `f3ec956` (feat)
2. **Task 2: Auth flow — middleware, login page, callback route, dashboard shell** - `50b15f6` (feat)

## Files Created/Modified

- `src/lib/supabase/client.ts` — `createBrowserSupabaseClient()` using `@supabase/ssr` `createBrowserClient`
- `src/lib/supabase/server.ts` — `getUserClient()` using `createServerClient` with cookie getAll/setAll; `import 'server-only'`
- `src/lib/supabase/service.ts` — `getServiceClient()` using `createClient` with service_role key; `import 'server-only'`; JSDoc warning
- `src/lib/auth/rbac.ts` — `ROLE_HIERARCHY`, `PERMISSION_ROLE_MAP`, `hasRole()`, `hasPermission()`
- `src/lib/auth/middleware.ts` — `getOrgContext()` extracting org_id + role from `user.app_metadata` via `getUser()`
- `src/lib/vault.ts` — `storeCredential()` + `getCredential()` calling Vault RPC functions; `import 'server-only'`
- `src/db/schema/types.ts` — `Database` type stub with Vault RPC signatures and enums (replace with Supabase CLI output when project is live)
- `src/middleware.ts` — session refresh + route protection; getUser() pattern; protects /dashboard and /settings; redirects authenticated users from /login
- `src/app/(auth)/login/page.tsx` — `"use client"` magic link form + Google OAuth button; no password fields; violet accent; shadcn/ui components
- `src/app/(auth)/auth/callback/route.ts` — PKCE `exchangeCodeForSession`; redirects to /dashboard (Phase 4 will add /onboarding for first-time users)
- `src/app/(dashboard)/layout.tsx` — server component; `getUser()` belt-and-suspenders check; dark slate sidebar placeholder; sign-out form
- `src/app/(dashboard)/dashboard/page.tsx` — "Dashboard" heading placeholder
- `src/app/(dashboard)/page.tsx` — root redirect to /dashboard
- `src/app/api/auth/signout/route.ts` — POST handler; `supabase.auth.signOut()` + redirect to /login
- `src/components/ui/button.tsx`, `input.tsx`, `card.tsx` — shadcn/ui components (new-york style, violet accent)

## Decisions Made

- **Database type stub includes Vault RPC signatures**: Without these, `SupabaseClient<Database>.rpc('store_integration_credential', ...)` fails TypeScript because the empty `Database = {}` type makes the `rpc` parameter typed as `undefined`. The stub encodes the function signatures established in 01-02's custom SQL migrations.
- **getOrgContext reads `user.app_metadata`**: The `custom_access_token_hook` injects `org_id` and `user_role` as JWT claims. supabase-js surfaces these at `user.app_metadata` (not `user.user_metadata` which is user-editable). This avoids manual JWT decoding with jose.
- **Sign-out as form POST**: Calling `supabase.auth.signOut()` server-side via an API route ensures the session cookie is properly cleared. A client-side sign-out with `createBrowserSupabaseClient().auth.signOut()` would also work but adds client JS to the sidebar layout.
- **Dashboard page at `/dashboard` not `(dashboard)/`**: Route group root pages map to the same URL as `src/app/page.tsx`. Created `src/app/(dashboard)/dashboard/page.tsx` to avoid the conflict.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed `server-only` package**
- **Found during:** Task 1 (creating Supabase client wrappers)
- **Issue:** `import 'server-only'` required by plan for server.ts, service.ts, vault.ts — package not in node_modules
- **Fix:** Ran `npm install server-only`
- **Files modified:** package.json, package-lock.json
- **Verification:** `npx tsc --noEmit` passes; `npm run build` passes
- **Committed in:** f3ec956 (Task 1 commit)

**2. [Rule 1 - Bug] Created `src/db/schema/types.ts` Database type stub**
- **Found during:** Task 1 (Vault helpers TypeScript compilation)
- **Issue:** `client.ts`, `server.ts`, `service.ts` all import `Database` type from `@/db/schema/types` — file didn't exist. The empty `Database = {}` stub caused `rpc()` TypeScript errors.
- **Fix:** Created type stub with correct Vault RPC function signatures, enum definitions; fixes compile errors
- **Files modified:** src/db/schema/types.ts (created)
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** f3ec956 (Task 1 commit)

**3. [Rule 3 - Blocking] Installed shadcn/ui components before login page**
- **Found during:** Task 2 (login page creation)
- **Issue:** Login page imports `Button`, `Input`, `Card` from `@/components/ui/` — components not yet installed
- **Fix:** Ran `npx shadcn@latest add button input card --yes`
- **Files modified:** src/components/ui/button.tsx, input.tsx, card.tsx (created)
- **Committed in:** f3ec956 (Task 1 commit, staged alongside other files)

---

**Total deviations:** 3 auto-fixed (1 Rule 1 bug, 2 Rule 3 blocking)
**Impact on plan:** All three deviations were prerequisite infrastructure gaps. No scope creep — each fix was directly required for task completion.

## User Setup Required

The following Supabase Dashboard steps are required before this auth flow works end-to-end:

1. **Set JWT expiry to 30 days** (locked user decision):
   - Supabase Dashboard → Authentication → Settings → JWT Expiry → Enter `2592000`

2. **Enable Google OAuth provider**:
   - Supabase Dashboard → Authentication → Providers → Google
   - Enter Google OAuth Client ID and Client Secret
   - Set authorized redirect URI: `{your-domain}/auth/callback`

3. **Set environment variables** in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your deployed URL
   ```

4. **Replace Database type stub** when Supabase project is live:
   ```bash
   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/db/schema/types.ts
   ```

## Next Phase Readiness

- Auth foundation complete — Phase 2 can start with OAuth adapter work
- `getUserClient()` and `getServiceClient()` are in place for all Phase 2 adapter data operations
- `hasPermission()` is ready for Phase 4 UI authorization gates
- Vault helpers are ready for Phase 2/3 integration credential storage
- Callback route redirects to `/dashboard` — Phase 4 should update to `/onboarding` for new users

---
*Phase: 01-foundation*
*Completed: 2026-02-23*
