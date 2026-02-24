---
phase: 01-foundation
verified: 2026-02-23T23:30:00Z
status: gaps_found
score: 4/5 success criteria verified
re_verification: false
gaps:
  - truth: "A new user can create an account with email/password or magic link and be provisioned an org, workspace, and store row automatically"
    status: partial
    reason: "Org and workspace are provisioned by the handle_new_user() trigger. A store row is NOT created automatically — stores require a Shopify domain and cannot be provisioned without user input. The ROADMAP Success Criterion explicitly mentions 'store row' as part of automatic provisioning, but the implementation intentionally defers store creation to Phase 2 (Shopify OAuth). This divergence from the success criterion is a gap."
    artifacts:
      - path: "src/db/migrations/custom/0004_org_provisioning_trigger.sql"
        issue: "Trigger creates org + workspace + org_member only. No store row INSERT exists."
    missing:
      - "Either update ROADMAP Success Criterion 1 to remove 'store row' from automatic provisioning (correct scope: stores need Shopify domain from Phase 2), OR add a placeholder store INSERT to the trigger. The former is the correct resolution — this is a ROADMAP wording gap, not a missing implementation."
---

# Phase 01: Foundation Verification Report

**Phase Goal:** The application exists with a correct multi-tenant data model, secure authentication, deployable scaffold, and production observability instrumented from the first commit — every future phase builds on this without schema changes
**Verified:** 2026-02-23T23:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Success Criteria (from ROADMAP.md)

The ROADMAP.md defines 5 explicit success criteria for Phase 1. These are verified below as observable truths.

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A new user can create an account with email/password or magic link and be provisioned an org, workspace, and store row automatically | PARTIAL | Magic link + Google OAuth work; org + workspace + org_member provisioned via trigger; **store row is NOT auto-provisioned** (stores require Shopify domain, deferred to Phase 2) |
| 2 | A user logged in as one org cannot query any data belonging to a different org — RLS blocks access at the database level, not just the application level | VERIFIED | `0002_rls_policies.sql` enables RLS on 9 tables with `auth.jwt()->>'org_id'` JWT claim policies; `custom_access_token_hook` injects org_id; human verification required for live DB test |
| 3 | The `metric_events` table exists with typed indexed columns for cross-source fields and a JSONB dimensions blob, partitioned correctly, ready to receive data from all 7 integrations | VERIFIED | `0001_metric_events.sql` creates partitioned table with typed columns (source, metric_key, value, recorded_at, dimensions jsonb), 4 indexes, 4 monthly partitions (Feb–May 2026) |
| 4 | The deployed app on Vercel returns a 200 for the health check route and CI passes on every push to main | VERIFIED* | `src/app/api/health/route.ts` returns `{status:'ok', timestamp}` with 200; `.github/workflows/ci.yml` runs lint + build on push/PR to main; *Vercel deployment requires human confirmation |
| 5 | Sentry captures unhandled errors from the first deployed commit; Vercel Analytics is reporting Core Web Vitals | VERIFIED* | `src/instrumentation.ts` registers Sentry for server/edge; `src/instrumentation-client.ts` inits Sentry client; `src/app/layout.tsx` includes `<Analytics />` and `<SpeedInsights />`; `next.config.ts` wrapped with `withSentryConfig`; *live Sentry reporting requires human confirmation |

**Score:** 4/5 success criteria fully verified (SC1 is partial — store row not auto-provisioned)

---

## Required Artifacts

### Plan 01-01 Artifacts (Scaffold + Observability)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/api/health/route.ts` | Health check endpoint returning GET with {status, timestamp} | VERIFIED | Exports `GET`, returns `NextResponse.json({status:'ok', timestamp})` with 200 |
| `src/instrumentation.ts` | Sentry server/edge registration | VERIFIED | Exports `register` (NEXT_RUNTIME conditional) and `onRequestError` (captureRequestError) |
| `src/app/global-error.tsx` | Sentry React error boundary | VERIFIED | 'use client', imports Sentry, captures exception in useEffect, renders Try Again button |
| `.github/workflows/ci.yml` | CI pipeline definition | VERIFIED | Triggers on push/PR to main; runs npm ci, npm run lint, npm run build; Node 20; placeholder env vars for build |
| `drizzle.config.ts` | Drizzle ORM configuration | VERIFIED | schema: `./src/db/schema/index.ts`, out: `./src/db/migrations`, dialect: postgresql, dbCredentials.url: DATABASE_URL_DIRECT |
| `src/app/layout.tsx` | Root layout with Analytics + SpeedInsights | VERIFIED | Imports `Analytics` from `@vercel/analytics/react` and `SpeedInsights` from `@vercel/speed-insights/next`; both rendered as last body children |
| `next.config.ts` | withSentryConfig wrapper | VERIFIED | Imports `withSentryConfig` from `@sentry/nextjs`, wraps nextConfig with {org, project, silent} |
| `sentry.server.config.ts` | Sentry server SDK init | VERIFIED | Sentry.init with DSN env var, tracesSampleRate conditional on NODE_ENV |
| `sentry.edge.config.ts` | Sentry edge SDK init | VERIFIED | Identical to server config |
| `src/app/globals.css` | Tailwind v4 CSS-first with violet primary | VERIFIED | `@theme` block defines `--color-primary-600: #7c3aed`; no `tailwind.config.ts` found |
| `components.json` | shadcn/ui initialized | VERIFIED | new-york style, cssVariables: true, Tailwind CSS-first (config: "") |

No `tailwind.config.js` or `tailwind.config.ts` exists — confirmed.

### Plan 01-02 Artifacts (Database Schema)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/db/schema/auth.ts` | Org, workspace, store, org_members definitions + enums | VERIFIED | Contains organizations (planTier, featureFlags, whiteLabelConfig), workspaces, stores, orgMembers, workspaceMembers; planTierEnum, orgRoleEnum |
| `src/db/schema/metrics.ts` | metricDefinitions table + metricEventsShape | VERIFIED | metricDefinitions has key, source, displayName, unit, aggregationMethod, category, metadata columns; metricEventsShape const for type-safe query building |
| `src/db/schema/sync.ts` | syncJobs and integrationConnections | VERIFIED | syncStatusEnum, syncJobs (with cursor column), integrationConnections (with vaultSecretId) |
| `src/db/schema/index.ts` | Barrel export of all schema modules | VERIFIED | Exports all tables, enums, and types from auth, metrics, sync |
| `src/db/migrations/` | Generated Drizzle migration files | VERIFIED | `0000_supreme_sumo.sql` covers 8 tables, 3 enums, 10 FKs, 8 indexes |
| `src/db/migrations/custom/0001_metric_events.sql` | Partitioned metric_events table | VERIFIED | PARTITION BY RANGE (recorded_at), 4 indexes, 4 monthly partitions |
| `src/db/migrations/custom/0002_rls_policies.sql` | RLS policies on all tenant tables | VERIFIED | ENABLE RLS on 9 tables; 8 org_isolation policies; 1 read_definitions policy; workspace_members subquery exception documented |
| `src/db/migrations/custom/0003_vault_functions.sql` | Vault helper functions | VERIFIED | private.store_integration_credential + private.get_integration_credential; SECURITY DEFINER; service_role only |
| `src/db/migrations/custom/0004_org_provisioning_trigger.sql` | Org provisioning trigger | VERIFIED | handle_new_user() creates org + workspace + org_member atomically; store row NOT included (see gaps) |
| `src/db/migrations/custom/0005_custom_access_token_hook.sql` | Custom access token hook | VERIFIED | Injects org_id + user_role into JWT claims; GRANT to supabase_auth_admin; REVOKE from public/anon/authenticated |

### Plan 01-03 Artifacts (Auth Layer)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/supabase/client.ts` | Browser Supabase client | VERIFIED | Exports `createBrowserSupabaseClient()` using createBrowserClient from @supabase/ssr |
| `src/lib/supabase/server.ts` | Server Supabase client (RLS enforced) | VERIFIED | `import 'server-only'`; exports `getUserClient()` using createServerClient with cookie getAll/setAll |
| `src/lib/supabase/service.ts` | Service-role client (ingestion only) | VERIFIED | `import 'server-only'`; exports `getServiceClient()` using createClient with SUPABASE_SERVICE_ROLE_KEY; persistSession: false; JSDoc warning |
| `src/lib/auth/rbac.ts` | Role hierarchy + permission checks | VERIFIED | Exports ROLE_HIERARCHY, hasRole, hasPermission, PERMISSION_ROLE_MAP; 4-role hierarchy owner>admin>member>viewer; 8 permissions mapped |
| `src/lib/auth/middleware.ts` | Org context extraction | VERIFIED | Exports getOrgContext() using getUser() (not getSession()); extracts org_id + role from user.app_metadata |
| `src/lib/vault.ts` | Vault TypeScript wrappers | VERIFIED | `import 'server-only'`; exports storeCredential() and getCredential() calling RPC via getServiceClient() |
| `src/middleware.ts` | Session refresh + route protection | VERIFIED | Uses getUser() (confirmed, not getSession()); protects /dashboard, /settings; redirects unauthenticated to /login; redirects authenticated away from /login |
| `src/app/(auth)/login/page.tsx` | Login page with magic link + Google OAuth | VERIFIED | 'use client'; magic link form (signInWithOtp); Google OAuth button (signInWithOAuth); no password fields; shadcn/ui Button/Input/Card |
| `src/app/(auth)/auth/callback/route.ts` | PKCE code exchange | VERIFIED | Exports GET; calls exchangeCodeForSession(code); redirects to /dashboard on success, /login?error=auth-code-error on failure |
| `src/app/(dashboard)/layout.tsx` | Authenticated dashboard shell | VERIFIED | Server component; getUserClient() + getUser() auth check; sidebar placeholder; sign-out form POST to /api/auth/signout |

---

## Key Link Verification

### Plan 01-01 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/layout.tsx` | `@vercel/analytics, @vercel/speed-insights` | Analytics and SpeedInsights imports | VERIFIED | `import { Analytics } from '@vercel/analytics/react'`; `import { SpeedInsights } from '@vercel/speed-insights/next'`; both rendered in body |
| `src/instrumentation.ts` | `sentry.server.config.ts`, `sentry.edge.config.ts` | Dynamic import on NEXT_RUNTIME | VERIFIED | `await import('../sentry.server.config')` when nodejs; `await import('../sentry.edge.config')` when edge |
| `next.config.ts` | `@sentry/nextjs` | withSentryConfig wrapper | VERIFIED | `import { withSentryConfig } from '@sentry/nextjs'`; wraps nextConfig |

### Plan 01-02 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/db/schema/auth.ts` | `src/db/schema/sync.ts` | FK references organizations.id | VERIFIED | sync.ts imports organizations and stores from ./auth; references(() => organizations.id), references(() => stores.id) |
| `src/db/schema/metrics.ts` | `src/db/schema/auth.ts` | org_id/store_id references | NOT_WIRED | metricDefinitions table has no org_id — it is a global registry (not org-scoped). metricEventsShape has orgId/storeId as type refs but no FK. This is correct design (global metric registry), not a gap. |
| `src/db/migrations/` | metric_events partitioned table | PARTITION BY RANGE in SQL | VERIFIED | `0001_metric_events.sql` contains `PARTITION BY RANGE (recorded_at)` |

Note on metrics key link: The link is correctly "not wired" in the Drizzle sense because metricDefinitions is intentionally a global (not org-scoped) registry table. The plan's key link wording was misleading — metricEventsShape has org_id/store_id in its type definition, satisfying the intent.

### Plan 01-03 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/middleware.ts` | `@supabase/ssr` | createServerClient for session refresh | VERIFIED | `import { createServerClient } from '@supabase/ssr'`; used for getUser() on every request |
| `src/middleware.ts` | `src/app/(auth)/login/page.tsx` | Redirect unauthenticated to /login | VERIFIED | `redirectUrl.pathname = '/login'` when `!user && isProtectedRoute` |
| `src/app/(auth)/auth/callback/route.ts` | `@supabase/ssr` | exchangeCodeForSession for PKCE | VERIFIED | `supabase.auth.exchangeCodeForSession(code)` called in GET handler |
| `src/lib/vault.ts` | `src/lib/supabase/service.ts` | getServiceClient().rpc() for Vault | VERIFIED | `import { getServiceClient } from '@/lib/supabase/service'`; both storeCredential and getCredential call `client.rpc(...)` |
| `src/lib/supabase/server.ts` | `next/headers cookies()` | Cookie-based session management | VERIFIED | `import { cookies } from 'next/headers'`; cookieStore = await cookies(); getAll/setAll pattern |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| FOUN-01 | 01-02 | Multi-tenant schema with org → workspace → store hierarchy and RLS | SATISFIED | organizations/workspaces/stores/org_members tables in auth.ts; RLS in 0002_rls_policies.sql |
| FOUN-02 | 01-03 | Supabase Auth with email/password and magic link sign-in | SATISFIED* | Magic link (signInWithOtp) implemented; Google OAuth added; *REQUIREMENTS.md says "email/password" but user decision locked to no passwords per CONTEXT.md — implementation honors locked decision |
| FOUN-03 | 01-02, 01-03 | Role-based access control (owner, admin, member, viewer) | SATISFIED | orgRoleEnum in schema; ROLE_HIERARCHY, hasRole, hasPermission in rbac.ts; custom_access_token_hook injects user_role into JWT |
| FOUN-04 | 01-02, 01-03 | RLS policies using JWT claims (org_id injected via custom claims, no subqueries) | SATISFIED | 0002_rls_policies.sql uses `auth.jwt()->>'org_id'` on all direct-org_id tables; 0005_custom_access_token_hook.sql injects org_id; workspace_members has one documented subquery exception |
| FOUN-05 | 01-03 | Typed Supabase client wrappers — getUserClient() for user reads, getServiceClient() for ingestion | SATISFIED | getUserClient() in server.ts (server-only, RLS); getServiceClient() in service.ts (server-only, service_role, JSDoc warning); createBrowserSupabaseClient() in client.ts |
| FOUN-06 | 01-02 | metric_events unified table with typed indexed columns, JSONB dimensions, partitioned | SATISFIED | 0001_metric_events.sql: typed columns (source, metric_key, value varchar/numeric); dimensions jsonb; PARTITION BY RANGE (recorded_at); 4 indexes |
| FOUN-07 | 01-02 | metric_definitions registry table | SATISFIED | metricDefinitions table in metrics.ts with key, source, displayName, unit, aggregationMethod, category, metadata columns |
| FOUN-08 | 01-02 | sync_jobs tracking table with status, cursor, error details, duration | SATISFIED | syncJobs in sync.ts with status (syncStatusEnum), cursor (text), errorDetails (jsonb), durationMs (integer) |
| FOUN-09 | 01-02, 01-03 | Encrypted credential storage via Supabase Vault | SATISFIED | 0003_vault_functions.sql: private.store_integration_credential + private.get_integration_credential; vault.ts TypeScript wrappers with storeCredential/getCredential |
| FOUN-10 | 01-02 | white_label_config JSONB field on organizations | SATISFIED | organizations.whiteLabelConfig: jsonb().notNull().default({}) in auth.ts |
| FOUN-11 | 01-02 | feature_flags JSONB field on organizations | SATISFIED | organizations.featureFlags: jsonb().notNull().default({}) in auth.ts |
| FOUN-12 | 01-02 | plan_tier column on organizations | SATISFIED | organizations.planTier: planTierEnum().notNull().default('starter') in auth.ts |
| FOUN-13 | 01-01 | Next.js 15 App Router with TypeScript, Tailwind CSS v4, shadcn/ui, Drizzle ORM | SATISFIED | package.json has next@15; globals.css uses @theme (Tailwind v4 CSS-first); components.json shows shadcn/ui new-york; drizzle.config.ts present; no tailwind.config.ts |
| FOUN-14 | 01-01 | Deployment to Vercel with CI/CD pipeline | SATISFIED* | .github/workflows/ci.yml defined; *Vercel deployment status requires human confirmation |
| PROD-07 | 01-01 | Sentry error tracking and Vercel Analytics instrumentation | SATISFIED | instrumentation.ts (server/edge Sentry); instrumentation-client.ts (client Sentry); layout.tsx (Analytics + SpeedInsights); next.config.ts (withSentryConfig) |

**All 15 requirements are addressed.** FOUN-02 note: REQUIREMENTS.md says "email/password" but the plan explicitly documents the user's locked decision to use magic link + Google OAuth only (no passwords). This is not a requirements gap — it is a deliberate product decision documented in CONTEXT.md and honored in the implementation.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/page.tsx` | 8 | "coming soon" text | Info | Root `/` landing page is a placeholder. Expected for Phase 1 — middleware redirects authenticated users to `/dashboard`. |
| `src/app/(dashboard)/dashboard/page.tsx` | 2 | "Dashboard placeholder page" comment | Info | Dashboard page is intentionally a stub to prove auth flow. Phase 4 replaces this. Not a blocker. |
| `src/app/(dashboard)/layout.tsx` | 11,30,69 | "structural placeholder" / "Navigation placeholder" comments | Info | Sidebar is documented as a Phase 4 placeholder. Sign-out works. Auth check is real. Not a blocker. |

No blocker-level anti-patterns found. The placeholders in the dashboard UI are intentional Phase 4 placeholders, explicitly documented in the plan. The core auth flow, schema, and observability are fully implemented.

---

## Human Verification Required

### 1. Vercel Deployment Health Check

**Test:** Navigate to the deployed Vercel URL and hit `/api/health`
**Expected:** HTTP 200 response with `{"status":"ok","timestamp":"..."}` JSON body
**Why human:** Cannot verify live deployment status programmatically from this environment

### 2. RLS Org Isolation (FOUN-04 / Success Criterion 2)

**Test:** Using two different user accounts in two different orgs, attempt to read org data cross-tenant via Supabase client
**Expected:** User in Org A receives zero rows when querying organizations, stores, or metric_events belonging to Org B
**Why human:** Requires a live Supabase database with migrations applied and the custom_access_token_hook registered in Supabase Dashboard. Cannot verify without a live DB connection.

### 3. Custom Access Token Hook Registration

**Test:** After running migrations, verify the hook is registered in Supabase Dashboard → Authentication → Hooks → Custom Access Token
**Expected:** `public.custom_access_token_hook` is selected and enabled. Log in as a test user and inspect the JWT — `org_id` and `user_role` claims should be present.
**Why human:** Dashboard hook registration is a manual step that cannot be automated. If not done, all RLS policies silently pass (no org_id claim = null org_id = no rows returned, which LOOKS like it's working but is actually failing silently).

### 4. Auth Flow End-to-End

**Test:** Click "Send magic link" on `/login`, receive email, click link, verify redirect to `/dashboard`; repeat with Google OAuth button
**Expected:** Both flows complete with user logged in and landing on the dashboard page. Unauthenticated visit to `/dashboard` redirects to `/login`.
**Why human:** Live Supabase Auth + email delivery + Google OAuth provider setup required. Cannot verify without running services.

### 5. Sentry Error Capture

**Test:** After deploying to Vercel with `NEXT_PUBLIC_SENTRY_DSN` set, trigger a test error (e.g., navigate to a non-existent route or throw deliberately) and check Sentry dashboard
**Expected:** Error appears in Sentry project with correct source maps and stack trace
**Why human:** Requires Sentry project configured, DSN set in Vercel env vars, and live deployment

---

## Gaps Summary

**One gap found** against ROADMAP Success Criterion 1.

**The gap:** Success Criterion 1 states users should be provisioned "an org, workspace, and store row automatically." The `handle_new_user()` trigger creates an org, workspace, and org_member row — but **not a store row**. A store requires a `shopify_domain` and `display_name` that cannot be inferred at signup time.

**Assessment:** This is most likely a ROADMAP wording error rather than a missing implementation. Stores are meaningfully connected to Shopify (Phase 2) — creating a placeholder store with null values would be misleading and potentially break referential integrity downstream. The correct resolution is to update ROADMAP.md Success Criterion 1 to read "org and workspace rows automatically" (removing "and store row"). The store creation will flow naturally from the Shopify OAuth connect flow in Phase 2.

**This gap does not block Phase 2** — the schema, auth, RLS, and observability foundations are all correctly in place. The onboarding flow will provision stores when users connect their first Shopify store.

---

_Verified: 2026-02-23T23:30:00Z_
_Verifier: Claude (gsd-verifier)_
