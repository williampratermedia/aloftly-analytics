# Roadmap: Aloftly Analytics

## Overview

Five phases build Aloftly strictly bottom-up: multi-tenant schema, auth, and observability instrumentation first (Phase 1), then the data pipeline infrastructure, adapter interface, Metrics Service abstraction, and anchor Shopify integration (Phase 2), then all remaining integration adapters with GA4 tackled first for the strongest cross-source demo story (Phase 3), then the full dashboard and widget layer (Phase 4), and finally billing, sharing, and production polish (Phase 5). The Metrics Service lives in Phase 2 alongside the adapter interface because they are a conceptual pair — one writes, one reads — and adapters built in Phases 2 and 3 must never write raw SQL that needs refactoring later. Observability tooling (Sentry, Vercel Analytics) ships in Phase 1 because the cost is near-zero and flying blind through four phases is not acceptable.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Multi-tenant schema, Supabase Auth, RLS, Next.js scaffold, CI/CD, and day-one observability
- [ ] **Phase 2: Pipeline Infrastructure + Shopify** - Adapter interface, Metrics Service abstraction, Inngest pipeline, webhook framework, and Shopify as the anchor integration
- [ ] **Phase 3: Remaining Integrations** - All six remaining adapters (GA4 first, then Intelligems, Gorgias, Clarity, KnoCommerce, Judge.me) completing the full data pipeline
- [ ] **Phase 4: Dashboard + Widgets** - All widget types, dashboard builder, templates, multi-store navigation, date range picker, onboarding wizard, and integration health UI
- [ ] **Phase 5: Product Completion** - Stripe billing, read-only sharing, CSV export, and error handling polish

## Phase Details

### Phase 1: Foundation
**Goal**: The application exists with a correct multi-tenant data model, secure authentication, deployable scaffold, and production observability instrumented from the first commit — every future phase builds on this without schema changes
**Depends on**: Nothing (first phase)
**Requirements**: FOUN-01, FOUN-02, FOUN-03, FOUN-04, FOUN-05, FOUN-06, FOUN-07, FOUN-08, FOUN-09, FOUN-10, FOUN-11, FOUN-12, FOUN-13, FOUN-14, PROD-07
**Success Criteria** (what must be TRUE):
  1. A new user can create an account with email/password or magic link and be provisioned an org, workspace, and store row automatically
  2. A user logged in as one org cannot query any data belonging to a different org — RLS blocks access at the database level, not just the application level
  3. The `metric_events` table exists with typed indexed columns for cross-source fields and a JSONB dimensions blob, partitioned correctly, ready to receive data from all 7 integrations
  4. The deployed app on Vercel returns a 200 for the health check route and CI passes on every push to main
  5. Sentry captures unhandled errors from the first deployed commit; Vercel Analytics is reporting Core Web Vitals — error visibility exists before any data pipeline is built
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Next.js 15 scaffold, Tailwind CSS v4, shadcn/ui, Drizzle ORM, Vercel deployment, CI/CD pipeline, Sentry instrumentation, Vercel Analytics
- [ ] 01-02-PLAN.md — Supabase schema: orgs, workspaces, stores, org_members, metric_events (partitioned), metric_definitions, sync_jobs, integration_connections, RLS policies, Vault functions, org provisioning trigger
- [ ] 01-03-PLAN.md — Supabase Auth (magic link + Google OAuth), typed client wrappers, RBAC module, session middleware, Vault TypeScript helpers, login page, dashboard shell

### Phase 2: Pipeline Infrastructure + Shopify
**Goal**: A working end-to-end data pipeline exists — integration adapter interface and Metrics Service abstraction defined as a paired set, Inngest orchestration running, webhook framework operational, and real Shopify data flowing into `metric_events` and queryable through the service layer
**Depends on**: Phase 1
**Requirements**: INFR-01, INFR-02, INFR-03, INFR-04, INFR-05, INFR-06, INFR-07, SHOP-01, SHOP-02, SHOP-03, SHOP-04
**Success Criteria** (what must be TRUE):
  1. A user can connect their Shopify store via OAuth and see a "Connected" status badge with last sync time
  2. Shopify order events arrive via webhook and appear in `metric_events` within seconds — no polling required
  3. The daily Inngest cron runs a full incremental Shopify sync with cursor-based pagination and updates `sync_jobs` with duration and status
  4. If a Shopify sync fails after all retries, `integration_connections.last_sync_status` shows "error" and the user sees a degraded state indicator — data does not silently go stale
  5. The Metrics Service is the only way to read from `metric_events` — a direct SQL query from any API route or widget is a build-time violation; Vercel KV caching is active and org context is enforced
  6. A second integration adapter built by following the pattern requires zero changes to the Inngest pipeline, webhook framework, or Metrics Service
**Plans**: TBD

Plans:
- [ ] 02-01: Integration adapter TypeScript interface, base class, Inngest client setup, /api/inngest endpoint, step function pipeline template
- [ ] 02-02: Webhook receiver framework — HMAC signature verification utility, webhook_events deduplication table, 200-immediate + async Inngest processing pattern
- [ ] 02-03: Shopify OAuth flow, encrypted token storage in Vault, Shopify webhook receiver, Shopify data sync Inngest function with onFailure handler
- [ ] 02-04: Metrics Service abstraction layer — `lib/metrics/service.ts`, Vercel KV cache integration (5-15 min TTL), /api/metrics endpoint, org context enforcement, typed query interface

### Phase 3: Remaining Integrations
**Goal**: All seven integration adapters are complete and real data from every source flows into `metric_events` — GA4 tackled first because Shopify + GA4 + Clarity is the minimum viable cross-source CRO story and the Google OAuth complexity is worth front-loading
**Depends on**: Phase 2
**Requirements**: GA4-01, GA4-02, GA4-03, INTL-01, INTL-02, GORG-01, GORG-02, GORG-03, GORG-04, CLAR-01, CLAR-02, CLAR-03, KNOC-01, KNOC-02, KNOC-03, JUDG-01, JUDG-02, JUDG-03
**Success Criteria** (what must be TRUE):
  1. A user can connect all six remaining integrations (GA4, Intelligems, Gorgias, Clarity, KnoCommerce, Judge.me) and see data flowing into the system for each
  2. Intelligems A/B test events arrive exclusively via webhook with no polling — the system has no cron attempting to poll an Intelligems REST endpoint
  3. Negative sentiment data from Gorgias (CSAT, ticket volume) and Judge.me (sub-4-star reviews) exists as queryable `metric_events` rows
  4. GA4 sessions, traffic sources, and page-level metrics are queryable via the Metrics Service alongside Shopify revenue context — the minimum viable cross-source CRO dataset exists
  5. All 7 integration connections show health status (last sync time, error state) queryable from a single `integration_connections` lookup
**Plans**: TBD

Plans:
- [ ] 03-01: GA4 Google OAuth 2.0 adapter — token refresh, encrypted storage, GA4 Data API sync (sessions, traffic sources, bounce rates, page metrics, device breakdown), hourly Inngest cron
- [ ] 03-02: Intelligems webhook adapter and Gorgias REST+webhook hybrid adapter (validates both sync patterns)
- [ ] 03-03: Clarity scheduled adapter, KnoCommerce scheduled adapter, Judge.me scheduled adapter

### Phase 4: Dashboard + Widgets
**Goal**: Users can log in, see all their integration data visualized in a configurable dashboard with pre-built templates, switch between stores, filter by date range, and understand the health of every connected integration
**Depends on**: Phase 3
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DASH-08, DASH-09, DASH-10, DASH-11, DASH-12, DASH-13, DASH-14, DASH-15, PROD-05
**Success Criteria** (what must be TRUE):
  1. A new user completing the onboarding wizard can connect their first store, connect their first integration, and see a pre-built CRO Audit dashboard with real data in under 10 minutes
  2. A user can add, remove, reorder, and configure any widget in the dashboard — the layout persists across page loads and browser sessions
  3. Switching between stores in the navigation updates all widget data to the selected store's context with no page reload
  4. A single widget failing to load (integration down, network error) shows an error state in that widget only — all other widgets continue to render normally
  5. The dashboard has at least 3 pre-built templates (CRO Audit, PDP Audit, Agency Client View) and 5 widget types (KPI card, line chart, bar chart, data table, funnel)
**Plans**: TBD

Plans:
- [ ] 04-01: Onboarding wizard (guided org creation, first store connection, first integration) and integration health UI (connection status badges, last sync time, error states with retry action)
- [ ] 04-02: Widget component library — KPI card, line chart, bar chart, data table, funnel — each self-contained with independent loading/error states via TanStack React Query; date range picker with presets (today, 7d, 30d, custom) and comparison period toggle; multi-store switcher in navigation
- [ ] 04-03: Dashboard builder — column layout selector, widget picker sidebar, @dnd-kit reorder, per-widget config panel, layout persistence, dashboard templates

### Phase 5: Product Completion
**Goal**: The product is launchable — users pay to access it, agencies can share dashboards with clients, data exports work, and errors surface with actionable recovery paths
**Depends on**: Phase 4
**Requirements**: PROD-01, PROD-02, PROD-03, PROD-04, PROD-06
**Success Criteria** (what must be TRUE):
  1. A new user selecting a plan is redirected to Stripe Checkout, completes payment, and is immediately provisioned with the correct tier limits — attempting to exceed limits (add a 4th store on Professional) is blocked with an upgrade prompt
  2. An agency user can generate a read-only share link for any dashboard and send it to a client who views the dashboard without logging in
  3. A user can export any widget's data as a CSV with accurate column headers
  4. When an integration sync fails, the user sees a "Re-sync" button in the integration health panel — clicking it triggers a manual re-sync and shows progress feedback
**Plans**: TBD

Plans:
- [ ] 05-01: Stripe subscription billing — Products/Prices for 4 tiers, Checkout redirect, webhook listener, plan_tier enforcement in API routes and Inngest jobs
- [ ] 05-02: Read-only dashboard sharing (token-based auth bypass, shared view route), CSV export (widget-level and dashboard-level)
- [ ] 05-03: Error handling polish — retry UI, connection troubleshooter

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/3 | Not started | - |
| 2. Pipeline Infrastructure + Shopify | 0/4 | Not started | - |
| 3. Remaining Integrations | 0/3 | Not started | - |
| 4. Dashboard + Widgets | 0/3 | Not started | - |
| 5. Product Completion | 0/3 | Not started | - |
