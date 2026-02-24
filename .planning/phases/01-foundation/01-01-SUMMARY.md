---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [nextjs, tailwind, shadcn, drizzle, sentry, vercel, typescript, postgres]

# Dependency graph
requires: []
provides:
  - Next.js 15 App Router project structure with TypeScript and src/ directory
  - Tailwind CSS v4 (CSS-first, no tailwind.config.ts) with violet-600 primary accent
  - shadcn/ui initialized with new-york style, violet/purple primary color
  - Health check endpoint at /api/health returning JSON {status, timestamp}
  - Drizzle ORM configured with postgres driver (PgBouncer-safe, prepare: false)
  - drizzle.config.ts pointing to src/db/schema/index.ts
  - Sentry error tracking for server, edge, and client (v10.39.0)
  - Vercel Analytics and SpeedInsights injected in root layout
  - GitHub Actions CI pipeline with lint + build steps
  - .env.example documenting all required environment variables
affects:
  - 01-02 (schema and auth — builds on this scaffold)
  - All future phases (the foundational Next.js project everything runs in)

# Tech tracking
tech-stack:
  added:
    - next@15.5.12
    - react@19.2.4
    - typescript@5.9.3
    - tailwindcss@4.2.1 (CSS-first, no config file)
    - "@tailwindcss/postcss@4.2.1"
    - shadcn/ui (new-york style, violet primary)
    - clsx + tailwind-merge (via shadcn)
    - drizzle-orm@0.45.1 + drizzle-kit@0.31.9
    - postgres@3.4.8
    - "@sentry/nextjs@10.39.0"
    - "@vercel/analytics"
    - "@vercel/speed-insights"
    - "@supabase/supabase-js + @supabase/ssr"
    - zod, sonner, next-themes, dotenv
  patterns:
    - Tailwind v4 CSS-first configuration via @theme in globals.css
    - shadcn/ui CSS variable system using oklch color values
    - Drizzle ORM with PgBouncer-safe postgres driver (prepare: false)
    - Sentry instrumentation via src/instrumentation.ts register() hook
    - Vercel Analytics as last children in RootLayout body

key-files:
  created:
    - package.json (Next.js 15 project manifest)
    - tsconfig.json (TypeScript strict mode, @/* alias)
    - next.config.ts (withSentryConfig wrapper)
    - postcss.config.mjs (Tailwind v4 PostCSS plugin)
    - drizzle.config.ts (Drizzle schema + migration config)
    - eslint.config.mjs (ESLint flat config via eslint-config-next)
    - components.json (shadcn/ui configuration)
    - src/app/globals.css (Tailwind v4 @theme with violet primary)
    - src/app/layout.tsx (RootLayout with Analytics + SpeedInsights)
    - src/app/page.tsx (placeholder landing page)
    - src/app/api/health/route.ts (GET handler returning {status, timestamp})
    - src/app/global-error.tsx (Sentry React error boundary)
    - src/lib/utils.ts (cn() helper via clsx + tailwind-merge)
    - src/db/index.ts (Drizzle client, server-only guard)
    - src/db/schema/index.ts (schema barrel export — empty placeholder)
    - src/instrumentation.ts (Sentry register + onRequestError)
    - src/instrumentation-client.ts (Sentry client init + onRouterTransitionStart)
    - sentry.server.config.ts (Sentry server SDK init)
    - sentry.edge.config.ts (Sentry edge SDK init)
    - .github/workflows/ci.yml (lint + build on push/PR to main)
    - .env.example (all required vars documented with comments)
  modified:
    - .gitignore (added .env.local, node_modules, .next, .vercel)

key-decisions:
  - "No tailwind.config.ts — Tailwind v4 uses CSS-first configuration via @theme in globals.css"
  - "shadcn/ui new-york style with violet-600 (#7c3aed / oklch 0.491 0.27 292.581) as primary"
  - "Drizzle postgres driver with prepare: false for PgBouncer transaction mode compatibility"
  - "Sentry withSentryConfig wraps next.config.ts — silent when not in CI, gracefully degrades without DSN"
  - "instrumentationHook experimental flag removed — no longer needed in Next.js 15"
  - "ESLint flat config via createRequire(import.meta.url) to import eslint-config-next CJS directly"
  - "Vercel Analytics and SpeedInsights injected as last body children in RootLayout"

patterns-established:
  - "CSS-first Tailwind: all theme customization in globals.css @theme block, never tailwind.config.ts"
  - "oklch color space for shadcn/ui CSS variables"
  - "server-only import guard on src/db/index.ts prevents client-side DB access"
  - "Sentry config split across server/edge/client files, loaded conditionally by NEXT_RUNTIME"

requirements-completed: [FOUN-13, FOUN-14, PROD-07]

# Metrics
duration: 45min
completed: 2026-02-23
---

# Phase 01 Plan 01: Application Scaffold + Observability Summary

**Next.js 15 App Router scaffold with Tailwind v4, shadcn/ui (violet primary), Drizzle ORM, Sentry v10, and Vercel Analytics — build passing, CI pipeline active**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-02-23T00:00:00Z
- **Completed:** 2026-02-23T00:45:00Z
- **Tasks:** 2
- **Files modified/created:** 21

## Accomplishments

- Scaffolded Next.js 15 App Router project from scratch (existing repo had no Next.js files)
- Initialized shadcn/ui with violet-600 (#7c3aed) as primary accent color, CSS-first Tailwind v4
- Instrumented Sentry v10.39.0 for server, edge, and client error tracking from the first commit
- Vercel Analytics and SpeedInsights injected in root layout — analytics active immediately on deploy
- GitHub Actions CI pipeline linting and building on every push/PR to main

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 15 with Tailwind v4, shadcn/ui, and Drizzle ORM** - `8979acb` (feat)
2. **Task 2: Instrument Sentry, Vercel Analytics, and CI/CD pipeline** - `7d5f70b` (feat)

**Plan metadata:** _(created in this step)_

## Files Created/Modified

- `package.json` — Next.js 15 project manifest with all dependencies
- `tsconfig.json` — TypeScript strict mode with @/* path alias
- `next.config.ts` — withSentryConfig wrapper for Sentry build integration
- `postcss.config.mjs` — Tailwind v4 @tailwindcss/postcss plugin
- `drizzle.config.ts` — Drizzle schema (src/db/schema/index.ts) + migrations output
- `eslint.config.mjs` — ESLint flat config via eslint-config-next
- `components.json` — shadcn/ui new-york style, neutral base, violet primary overridden in CSS
- `src/app/globals.css` — Tailwind v4 @theme with violet-600 primary, shadcn/ui CSS vars
- `src/app/layout.tsx` — RootLayout with Analytics + SpeedInsights as last body children
- `src/app/page.tsx` — Placeholder landing page with "Aloftly Analytics" heading
- `src/app/api/health/route.ts` — GET handler returning {status: 'ok', timestamp}
- `src/app/global-error.tsx` — Sentry React error boundary
- `src/lib/utils.ts` — cn() helper via clsx + tailwind-merge (updated by shadcn init)
- `src/db/index.ts` — Drizzle client with server-only guard and PgBouncer-safe config
- `src/db/schema/index.ts` — Empty schema barrel (schemas added in 01-02)
- `src/instrumentation.ts` — Sentry register() and onRequestError exports
- `src/instrumentation-client.ts` — Sentry client init and onRouterTransitionStart
- `sentry.server.config.ts` — Sentry server SDK init (tracesSampleRate: 0.1 in prod)
- `sentry.edge.config.ts` — Sentry edge SDK init (identical to server config)
- `.github/workflows/ci.yml` — Lint + build CI on push/PR to main, Node 20
- `.env.example` — All required env vars documented with source comments
- `.gitignore` — Added .env.local, node_modules, .next, .vercel, TypeScript build info

## Decisions Made

- **No tailwind.config.ts**: Tailwind v4 is CSS-first — all theme customization in globals.css @theme block. This is intentional and enforced by the plan.
- **shadcn/ui new-york style**: Initialized with --defaults flag; primary color overridden via CSS variables to violet-600 (oklch 0.491 0.27 292.581).
- **ESLint flat config**: Used `createRequire(import.meta.url)` to import the CJS eslint-config-next directly into an ESM config file, avoiding FlatCompat circular structure issue.
- **Sentry v10 API**: Removed deprecated `hideSourceMaps` and `automaticVercelMonitors` options that don't exist in v10 API. Used minimal `{org, project, silent}` config that works cleanly.
- **instrumentationHook removed**: Next.js 15 no longer needs the `experimental.instrumentationHook` flag — removed to prevent TypeScript type error.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed deprecated `experimental.instrumentationHook` from next.config.ts**
- **Found during:** Task 1 (initial build attempt)
- **Issue:** Next.js 15 no longer accepts `instrumentationHook` in experimental config — TypeScript compile error
- **Fix:** Removed the experimental block entirely; instrumentation is enabled by default in Next.js 15
- **Files modified:** next.config.ts
- **Verification:** Build passed after removal
- **Committed in:** 8979acb (Task 1 commit)

**2. [Rule 1 - Bug] Fixed ESLint circular structure error with FlatCompat**
- **Found during:** Task 1 (lint run)
- **Issue:** Using `FlatCompat` to extend `eslint-config-next` caused "Converting circular structure to JSON" error because eslint-config-next v16 exports flat config objects that FlatCompat can't handle
- **Fix:** Replaced FlatCompat with direct `createRequire(import.meta.url)` to import the CJS config directly into the ESM config file
- **Files modified:** eslint.config.mjs
- **Verification:** `npx eslint src/` runs cleanly, `npm run lint` passes
- **Committed in:** 8979acb (Task 1 commit)

**3. [Rule 1 - Bug] Removed deprecated Sentry v10 build options**
- **Found during:** Task 2 (build after Sentry integration)
- **Issue:** `hideSourceMaps`, `disableLogger`, and `automaticVercelMonitors` don't exist in @sentry/nextjs v10 `SentryBuildOptions` — TypeScript type error
- **Fix:** Removed deprecated options, kept only `{org, project, silent}` which work in v10
- **Files modified:** next.config.ts
- **Verification:** Build passes, Sentry wraps next config correctly
- **Committed in:** 7d5f70b (Task 2 commit)

**4. [Rule 2 - Missing Critical] Added `onRouterTransitionStart` export to instrumentation-client.ts**
- **Found during:** Task 2 (Sentry build output warning)
- **Issue:** Sentry v10 requires `onRouterTransitionStart` export from `instrumentation-client.ts` to instrument navigation transitions — missing would disable navigation tracking
- **Fix:** Added `export const onRouterTransitionStart = Sentry.captureRouterTransitionStart`
- **Files modified:** src/instrumentation-client.ts
- **Verification:** Sentry build warning resolved, export present
- **Committed in:** 7d5f70b (Task 2 commit)

---

**Total deviations:** 4 auto-fixed (2 bugs, 1 bug, 1 missing critical)
**Impact on plan:** All auto-fixes required for compatibility with the actual installed package versions (Next.js 15.5, Sentry v10). No scope creep.

## Issues Encountered

- `npx create-next-app` refused to run non-interactively with existing repo files — scaffolded manually instead. All required files were created explicitly, giving more control over the output.
- Sentry v10 API differs from v8/v9 docs referenced in plan — adapted `withSentryConfig` options to match actual TypeScript types.

## User Setup Required

The following external services must be configured before deployment works end-to-end:

**Vercel:**
- Import the `aloftly-analytics` GitHub repo as a Vercel project (Vercel Dashboard -> Add New -> Project)
- `VERCEL_TOKEN` is not needed in .env — Vercel's GitHub integration handles deployment automatically

**Sentry:**
- Create a Sentry project and add to .env.local / Vercel env vars:
  - `NEXT_PUBLIC_SENTRY_DSN` — Sentry Dashboard -> Project Settings -> Client Keys (DSN)
  - `SENTRY_ORG` — Organization Settings -> Organization Slug
  - `SENTRY_PROJECT` — Project Settings -> Project Slug
  - `SENTRY_AUTH_TOKEN` — Settings -> Auth Tokens (org:read + project:releases)

**Supabase:**
- Create a Supabase project and add to .env.local / Vercel env vars:
  - `NEXT_PUBLIC_SUPABASE_URL` — Project Settings -> API -> Project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Project Settings -> API -> anon public key
  - `SUPABASE_SERVICE_ROLE_KEY` — Project Settings -> API -> service_role secret
  - `DATABASE_URL` — Project Settings -> Database -> Connection String (pooled, Transaction mode)
  - `DATABASE_URL_DIRECT` — Project Settings -> Database -> Connection String (direct, non-pooled)

## Next Phase Readiness

- Next.js scaffold is complete — 01-02 (schema + auth) can be built on this foundation
- All observability is active from the first deploy (Sentry, Vercel Analytics, SpeedInsights)
- Drizzle is configured and ready for schema definitions in src/db/schema/
- No blockers for 01-02

---
*Phase: 01-foundation*
*Completed: 2026-02-23*
