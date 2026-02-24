# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-23)

**Core value:** One unified dashboard where a CRO team can see all of their on-site optimization data — from every tool, every store — in one place.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 5 (Foundation)
Plan: 2 of 3 in current phase
Status: In progress
Last activity: 2026-02-23 — Completed 01-02 (Multi-tenant database schema, migrations, RLS, Vault)

Progress: [██░░░░░░░░] 13%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 25 min
- Total execution time: 0.83 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2/3 | 50 min | 25 min |

**Recent Trend:**
- Last 5 plans: 01-01 (45 min), 01-02 (5 min)
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: Strict build order enforced — schema+auth before adapters, Metrics Service before widgets
- [Init]: All 7 integrations must ship in Phase 3 before any dashboard work begins
- [Init]: Intelligems is webhook-only — no REST polling endpoint exists; build listener only
- [Init]: Metrics Service is the sole read gateway — widgets never query metric_events directly
- [Revision 2026-02-23]: Metrics Service (INFR-06) moved to Phase 2 — paired with adapter interface (02-01); adapters in Phase 2 and 3 must use the service layer, never raw SQL
- [Revision 2026-02-23]: Sentry + Vercel Analytics (PROD-07) moved to Phase 1 — instrumented in 01-01 scaffold; observability active from first deployed commit
- [Revision 2026-02-23]: GA4 moved to first plan in Phase 3 (03-01) — Google OAuth complexity front-loaded; Shopify + GA4 + Clarity is the minimum viable cross-source CRO demo story
- [Revision 2026-02-23]: Phase 4 plan rebalanced — 04-01 is onboarding wizard + integration health UI; date range picker and multi-store switcher moved to 04-02 alongside widget library
- [01-01]: No tailwind.config.ts — Tailwind v4 uses CSS-first configuration via @theme in globals.css
- [01-01]: shadcn/ui new-york style with violet-600 (#7c3aed) as primary accent color
- [01-01]: Drizzle postgres driver with prepare: false for PgBouncer transaction mode compatibility
- [01-01]: Sentry withSentryConfig wraps next.config.ts — silent when not in CI, gracefully degrades without DSN
- [01-02]: metric_events RANGE partitioned on recorded_at only (not composite with store_id) — store_id filtering via composite index; sub-partitioning would require one partition per store per month
- [01-02]: Custom SQL migrations in src/db/migrations/custom/ — Drizzle cannot generate PARTITION BY, auth.jwt() RLS, or cross-schema triggers
- [01-02]: metricEventsShape defined as const (not pgTable) to provide TypeScript shape without conflicting with raw SQL CREATE TABLE
- [01-02]: workspace_members RLS uses documented subquery exception — only table without direct org_id column; subquery on workspaces (small cardinality, indexed)

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 3]: Tremor free tier status must be verified before Phase 4 widget development begins — if unavailable, use custom Recharts + shadcn/ui Card components
- [Phase 3]: Intelligems webhook payload schema is not publicly documented — obtain from provider before building the adapter
- [Phase 3]: KnoCommerce REST API documentation needs verification — auth model and rate limits unknown
- [Phase 2]: Verify Supabase Vault + Drizzle pattern for reading secrets in server-side adapter code before starting OAuth implementation

## Session Continuity

Last session: 2026-02-23
Stopped at: Completed 01-02-PLAN.md — Multi-tenant schema, Drizzle migrations, RLS policies, Vault functions, JWT hook
Resume file: None
