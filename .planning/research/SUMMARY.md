# Project Research Summary

**Project:** Aloftly Analytics — Shopify CRO Analytics SaaS
**Domain:** Multi-tenant SaaS analytics dashboard with third-party data ingestion
**Researched:** 2026-02-23
**Confidence:** MEDIUM-HIGH (architecture and pitfall patterns HIGH; stack versions MEDIUM; competitor features MEDIUM)

## Executive Summary

Aloftly is a Shopify-focused CRO analytics platform that aggregates data from seven sources (Shopify, Microsoft Clarity, Intelligems, KnoCommerce, Gorgias, Judge.me, GA4) into one unified dashboard. The product occupies a genuine market gap: competitors like Triple Whale ($429+/mo) and Polar Analytics ($720+/mo) focus on marketing attribution and ad spend, while Aloftly focuses on on-site experience data — heatmaps, A/B tests, surveys, support sentiment, and reviews — at a fraction of the price. The core technical challenge is not building any one integration but building a data pipeline architecture that normalizes fundamentally different event shapes from seven providers into a queryable unified store, while keeping each widget resilient to failures in any individual integration.

The recommended approach is a layered ingest-normalize-serve architecture built strictly bottom-up: multi-tenant schema and auth first, then data pipeline infrastructure, then individual integration adapters, then a metrics service abstraction, then the dashboard and widget layer, and finally billing and product completion. This ordering is non-negotiable — retrofitting multi-tenancy onto an existing schema is a data migration nightmare, and widgets built before the metrics service abstraction exists will embed hardcoded queries that are expensive to fix. The stack is well-matched to the requirements: Next.js 15 App Router, Supabase (Postgres + Auth + Vault), Drizzle ORM, Inngest for background job orchestration, and Vercel KV for caching.

The dominant risk in this project is data isolation failure. The Supabase service role client bypasses all Row Level Security — if it leaks into user-facing API routes (a common shortcut in background job code), tenants will see each other's data. The second major risk is the unified `metric_events` table schema: too rigid and it requires migrations for every new integration; too loose (JSONB overuse) and query performance degrades at scale. Both of these must be decided and locked in Phase 1, before a single integration is built. Secondary risks include webhook idempotency (Shopify retries aggressively), Inngest silent failures after retry exhaustion, and OAuth token storage security.

---

## Key Findings

### Recommended Stack

The user's pre-selected stack is validated and sound. The key upgrade is Next.js 15 (not 14 — 15 is the current stable release with improved caching defaults and the `after()` API useful for post-response webhook acknowledgment). Tailwind CSS v4 is the 2026 standard but has breaking changes from v3 — all AI-generated Tailwind code in the ecosystem is v3, which creates tutorial debt. Drizzle ORM is the correct choice over Prisma for this project due to better support for complex analytical queries and no connection pooling friction with Supabase serverless.

Several libraries not in the original spec are essential: Zod for runtime validation of every webhook payload and integration API response (non-negotiable), TanStack React Query v5 for client-side widget data fetching with deduplication, nuqs for URL-based dashboard state (store switching, date ranges), and @dnd-kit for the V1 widget reorder UI. Tremor's free tier status needs verification before the widget layer is built — if insufficient, custom Recharts + shadcn/ui Card components are a clean alternative that gives 100% ownership of widget code.

**Core technologies:**
- **Next.js 15 (App Router):** Full-stack React framework — Server Components eliminate boilerplate for dashboard views; Vercel-native with edge runtime for auth middleware
- **Supabase (Postgres + Auth + Vault):** Primary data store, identity management, and encrypted credential storage — RLS is the correct multi-tenancy primitive; Vault is mandatory for OAuth tokens
- **Drizzle ORM 0.38+:** Type-safe query builder — SQL-first approach suits complex analytical queries; no connection pooling complications with Supabase serverless
- **Inngest 3.x:** Event-driven background job orchestration — step functions match the multi-step sync pattern exactly (fetch, transform, upsert, update health); serverless-native with retries and fan-out built in
- **Vercel KV (Upstash Redis):** Cross-request caching with 5-15 minute TTL for integration data; rate limiting on webhook endpoints
- **@supabase/ssr:** Correct package for Next.js App Router auth (replaces deprecated @supabase/auth-helpers-nextjs)
- **Zod 3.x:** Runtime schema validation for all inbound webhook payloads and integration API responses
- **TanStack React Query 5.x:** Client-side data fetching for widgets with SWR deduplication
- **Recharts 2.x:** SVG-based composable chart primitives for dashboard visualizations
- **Stripe:** Subscription billing for 4-tier model; Checkout redirect avoids client-side Stripe in V1

### Expected Features

All 7 integrations must ship in V1 — this is the core product pitch. Missing even one weakens the "unified CRO view" positioning. The multi-tenant schema (org → workspace → store) must also be in V1 because it cannot be retrofitted. The dashboard builder in V1 is a column-based widget picker with reorder (not full canvas drag-and-drop), which is explicitly scoped to keep the feature tractable.

**Must have (table stakes):**
- Supabase Auth + RBAC (owner/admin/viewer roles) — gates all data access; must be first
- Multi-tenant schema (org → workspace → store) — cannot be added after data flows in
- All 7 integration adapters (Shopify, Clarity, Intelligems, KnoCommerce, Gorgias, Judge.me, GA4)
- Integration health monitoring (last synced, error states, status badges) — trust signal
- Dashboard builder with column layout, widget picker, and reorder capability
- KPI cards + line/bar charts + table widget as minimum visualization primitives
- Date range picker with comparison periods — expected by every analytics user
- Multi-store switching — agencies will not adopt without this
- Read-only shareable links — agency reporting workflow baseline
- Stripe billing with plan limit enforcement
- Onboarding wizard — complex integration setup requires guided first-run to prevent churn
- Pre-built dashboard templates (minimum 3: CRO Audit, PDP Audit, Agency Client View)
- CSV export — first-week request from any analytics buyer

**Should have (competitive differentiators):**
- Heatmap summary widget (Clarity click rate + scroll depth) — biggest CRO differentiator; no competitor shows this in a unified dashboard
- A/B test result cards (Intelligems) — real-time via webhooks; currently spreadsheet-based for most teams
- Post-purchase survey snapshots (KnoCommerce) — completes the voice-of-customer picture
- Negative sentiment surfacing from Gorgias + Judge.me together — proactively flags product/page problems alongside CVR
- Pre-built CRO templates — removes cold start problem; competitors have none
- AI-ready unified schema (`metric_events` with pgvector slots reserved) — no user-visible feature in V1 but enables V3 AI layer without pipeline rework

**Defer to V2+:**
- Scheduled PDF/email reports — shareable links cover the V1 agency use case
- Dashboard comments and annotations
- White-label UI rendering (store config fields in V1 schema; rendering logic in V2+)
- Client portal (scoped viewer login beyond read-only share links)
- Full canvas drag-and-drop (V2 after validating demand for widget reorder)

**Explicitly out of scope (anti-features):**
- Marketing attribution modeling — Triple Whale's territory; competing here is a losing war
- Ad spend analytics (Facebook, Google Ads) — AgencyAnalytics' lane
- AI analysis in V1 — requires training data volume that V1 cannot support
- Session recording viewer (embedded) — link out to Clarity instead
- Native A/B test creation — Intelligems' job; do not build a competing testing tool

### Architecture Approach

The architecture is a layered ingest-normalize-serve pipeline. Raw data from 7 providers flows through typed integration adapters into a unified `metric_events` table via Inngest background jobs. The Metrics Service abstraction sits between the database and every widget — it handles query translation from declarative `query_config` JSON, enforces org context, and manages Vercel KV caching. Widgets never touch the database directly. This boundary is critical: when Postgres query latency exceeds acceptable thresholds at scale (expected around 50M+ rows), the ClickHouse migration is a one-file change in the Metrics Service with zero widget or API route changes required.

**Major components:**
1. **Integration Adapters** (`lib/integrations/[provider]/`) — typed interface with connect/disconnect/sync/testConnection; sync() is idempotent (upsert on conflict); credentials fetched from Supabase Vault inside sync(), never passed as arguments
2. **Inngest Pipeline** (`inngest/functions/`) — one cron per provider (not per store); cron fans out sync events per active connection; step functions for fetch, transform, upsert, update health; onFailure handlers mandatory
3. **Metrics Service** (`lib/metrics/`) — read gateway for all widgets; translates widget query_config into SQL; checks Vercel KV cache first (5-minute TTL standard); enforces org_id context on every query
4. **API Layer** (`app/api/`) — route handlers, webhook receivers, auth guards; org_id injected from validated JWT — never from request body
5. **Widget Components** (`components/widgets/`) — fully self-contained; each fetches its own data via React Query; independent loading/error states; failure in one widget cannot cascade to others
6. **Supabase RLS** — database-level isolation on all tables; policies use JWT claims directly (no subqueries); double-check layer beneath application-level org enforcement
7. **Dashboard Builder** (`app/(dashboard)/`) — layout state in `dashboard_layouts` table (JSONB widget array); column config + widget picker + reorder via @dnd-kit

### Critical Pitfalls

1. **Supabase service role client bypasses RLS** — the service role client must NEVER appear in user-facing API routes; create typed `getServiceClient()` (ingestion only) and `getUserClient(session)` (all user reads) wrappers from day one; add this as a code review checklist item

2. **metric_events schema too loose (JSONB overuse)** — decide upfront which columns are cross-source and queryable (typed columns with indexes) vs source-specific and display-only (JSONB `dimensions`/`metrics` blobs); never WHERE-filter on JSONB fields; if you need to filter on it, it needs a real column

3. **Webhook receivers without signature verification and idempotency** — create a shared `verifyWebhookSignature()` utility used before any webhook processing; store processed webhook IDs in a `webhook_events` table with unique constraint on (provider, webhook_id); always return 200 within 200ms and process async via Inngest

4. **Inngest silent failures after retry exhaustion** — every Inngest function needs an `onFailure` callback that updates `integration_connections.last_sync_status`; users need to see stale data warnings in the dashboard UI; build a health-check cron that alerts if any store hasn't synced in >4 hours

5. **Intelligems must be webhook-only, not polled** — there is no REST polling endpoint for Intelligems test results; build a `/api/webhooks/intelligems` POST receiver and register the URL in Intelligems config; never build a cron that attempts to poll an Intelligems REST endpoint

---

## Implications for Roadmap

Based on the architecture research's explicit build order and pitfall phase warnings, the suggested phase structure has 5 layers with 26 discrete build items:

### Phase 1: Foundation (Multi-Tenancy + Auth + Schema)
**Rationale:** Everything else depends on auth and multi-tenant schema being correct. Retrofitting org_id onto existing tables after data flows in is a data migration nightmare. The three critical schema decisions (RLS client wrappers, metric_events column split, RLS JWT claim policies) must all be made here.
**Delivers:** Organizations, workspaces, stores, users schema with RLS; Supabase Auth with @supabase/ssr; org context middleware injecting org_id from JWT; Supabase Vault primitives; Drizzle ORM + migration tooling; metric_events table with composite index; `plan_tier` column placeholder on org table
**Features addressed:** Auth + RBAC, multi-tenant schema (prerequisite for everything)
**Pitfalls avoided:** Service role bypass (Pitfall 1), missing org_id scope (Pitfall 2), RLS subquery performance (Pitfall 14), metric_events schema rigidity (Pitfall 6)
**Research flag:** Standard patterns — no phase research needed; Supabase RLS multi-tenant setup is well-documented

### Phase 2: Data Pipeline Infrastructure + Shopify Integration
**Rationale:** Shopify is the anchor integration that provides revenue context for all CRO metrics. It must be first because it establishes the integration adapter pattern, OAuth flow, webhook receiver framework, and Inngest pipeline that all subsequent integrations will copy. Getting this wrong means rewriting 6 more adapters.
**Delivers:** Integration adapter TypeScript interface and base class; Inngest client + event types + /api/inngest endpoint; Shopify OAuth with state param validation and encrypted token storage; Shopify webhook receiver with signature verification + idempotency table; first Inngest sync function with onFailure handler; integration_connections schema; webhook_events deduplication table
**Features addressed:** Shopify integration (anchor), integration health monitoring (schema layer)
**Pitfalls avoided:** Shopify OAuth CSRF and plaintext token storage (Pitfall 4), webhook signature and idempotency (Pitfall 3), Inngest silent failures (Pitfall 5), multi-store context enforcement (Pitfall 7)
**Research flag:** Needs research during planning — Shopify API versioning, Data Export API rate limits, and current @shopify/shopify-api v10 OAuth patterns should be verified

### Phase 3: Remaining Integration Adapters
**Rationale:** Complete the full data pipeline before building any display layer. Without real data flowing through all 7 adapters, the dashboard is untestable and the metrics service has no data to query. The order within this phase matters: webhook-based adapters (Intelligems) are architecturally different from REST pollers (Clarity, KnoCommerce, Judge.me, GA4) and should be built early to validate both paths.
**Delivers:** Intelligems webhook adapter (establishes webhook-only pattern); Gorgias adapter (REST + webhook hybrid, validates both sync paths); Clarity adapter (scheduled REST poll, exports via Data Export API); KnoCommerce adapter (REST poll); Judge.me adapter (REST poll); GA4 adapter (most complex — Google OAuth, save for last); per-store rate limit throttling in Inngest; sync frequency configuration
**Features addressed:** All 7 integration adapters, negative sentiment surfacing (Gorgias + Judge.me), A/B test cards (Intelligems), survey snapshots (KnoCommerce), heatmap summaries (Clarity)
**Pitfalls avoided:** Intelligems as poller instead of listener (Pitfall 11), rate limits affecting all tenants (Pitfall 8), webhook handlers doing synchronous work (Pitfall 12), Judge.me/KnoCommerce data freshness misrepresentation (Pitfall 13)
**Research flag:** Needs research for each integration — Clarity Data Export API quota limits, KnoCommerce API documentation, Gorgias webhook event types, Judge.me pagination behavior, and GA4 Data API authentication should all be verified per integration before building each adapter

### Phase 4: Metrics Service + Dashboard + Widgets
**Rationale:** The Metrics Service abstraction must exist before any widget fetches real data. The ClickHouse migration path depends on this boundary. Widgets can be built with mock data first while the Metrics Service is finalized, allowing frontend and backend work to proceed in parallel after the API contract is defined. The dashboard builder and widget library are the most visible product deliverables and unblock the full user-facing product.
**Delivers:** Metrics Service core (query builder, Vercel KV cache layer, org context enforcement); metric definitions registry (feeds widget picker); /api/metrics endpoint; KPI card, line chart, bar chart, table, and funnel widget components; dashboard builder (column config + widget picker modal + @dnd-kit reorder); dashboard layout persistence in dashboard_layouts table; integration health UI (connection status indicators, last sync time, error badges); date range picker with comparison periods; multi-store switcher in nav; onboarding wizard; pre-built dashboard templates (3 minimum)
**Features addressed:** Dashboard builder, all widget types, integration health monitoring, date range picker, multi-store switching, onboarding wizard, pre-built templates
**Pitfalls avoided:** Widget data fetching cascade failures via SWR deduplication (Pitfall 9), raw metric_events queries in widgets (use Metrics Service), widget bypassing Metrics Service (anti-pattern 2)
**Research flag:** Standard patterns for React Query + Next.js App Router widget architecture; @dnd-kit sortable patterns are well-documented; Tremor free tier status MUST be verified before this phase begins

### Phase 5: Product Completion (Billing + Sharing + Polish)
**Rationale:** Stripe billing can only be built after the auth and account model exist. Read-only sharing requires the dashboard builder to exist. Dashboard templates require all widgets to be available. This phase completes the product for launch.
**Delivers:** Stripe subscription billing with Products and Prices for 4-tier model; plan limit enforcement at API and Inngest job level; upgrade/downgrade flows; read-only shareable link generation with token-based auth bypass; shared view route; CSV export at widget and dashboard level; error handling with retry UI ("Re-sync" buttons, connection troubleshooter); Sentry instrumentation across all API routes and Inngest functions; Resend transactional email (magic links, billing notifications, integration failure alerts)
**Features addressed:** Stripe billing, read-only sharing, CSV export, error handling, monitoring
**Pitfalls avoided:** Data flowing to lapsed/cancelled orgs (Pitfall 10) — plan_tier check in API routes and Inngest jobs
**Research flag:** Standard patterns — Stripe Billing with webhooks to Inngest is well-documented; Sentry Next.js App Router setup is documented

### Phase Ordering Rationale

- **Layers before interfaces:** The database schema and auth must be stable before any API route references them; the adapter interface must be stable before any adapter is implemented; the Metrics Service must exist before any widget fetches data. Skipping layers to ship visible features faster creates technical debt that compounds across every integration.
- **Shopify first, GA4 last:** Shopify is the simplest OAuth integration and the most critical data source; GA4 is the most complex (Google's auth flow) and is needed for funnel visualization but not for the core CRO widget set.
- **Data complete before display:** All 7 adapters complete before the dashboard builder is wired to real data. Building the widget UI with mock data first lets design and frontend iterate without waiting for ingestion to stabilize.
- **Billing late, schema fields early:** The `plan_tier` column must exist in Phase 1 so Inngest jobs and API routes can reference it from day one, even if enforcement is added in Phase 5.

### Research Flags

**Needs research during planning:**
- **Phase 2 (Shopify):** Shopify API version (pin to specific quarterly release), current @shopify/shopify-api v10 OAuth patterns, offline access token behavior, webhook event catalog for Shopify
- **Phase 3 (Each adapter):** Clarity Data Export API quota limits and export job lifecycle; KnoCommerce REST API documentation and auth model; Gorgias webhook events vs polling; Judge.me pagination and rate limits; GA4 Data API authentication and quota behavior; Intelligems webhook payload schema
- **Phase 4 (Dashboard):** Tremor free tier current status — must verify at tremor.so before building widget components; determines whether to use Tremor or custom Recharts + shadcn/ui cards

**Standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** Supabase RLS multi-tenant setup, @supabase/ssr for Next.js App Router, Drizzle ORM with Supabase — all well-documented with official guides
- **Phase 5 (Billing/Sharing):** Stripe Billing with subscription webhooks, Sentry App Router instrumentation — established patterns with comprehensive documentation

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Core technology choices validated; exact patch versions not confirmed without live npm check; Tremor free tier status LOW confidence — must verify before Phase 4 |
| Features | MEDIUM | Competitor feature matrix from training data (August 2025); specific integration API capabilities (especially KnoCommerce, Intelligems) need live API verification during Phase 3 planning |
| Architecture | HIGH | Layered ingest-normalize-serve is an established multi-tenant analytics pattern; component boundaries and data flows are well-reasoned and internally consistent; build order derived from explicit dependency analysis |
| Pitfalls | HIGH | RLS service role bypass, webhook idempotency, JSONB performance, and Shopify OAuth CSRF are well-documented failure modes with official sources; Inngest onFailure API signature is MEDIUM (pre-August 2025 training data) |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Tremor free tier status:** MUST verify at tremor.so before Phase 4 begins. If free tier is insufficient, plan for custom Recharts + shadcn/ui Card widget components. This does not block Phase 1-3 but must be resolved before widget development starts.

- **Intelligems webhook payload schema:** No public documentation was available in training data. The webhook payload shape (what fields are sent, how A/B test variants are represented, how statistical significance is communicated) needs to be obtained from Intelligems directly or via their developer documentation before the Phase 3 Intelligems adapter is built.

- **KnoCommerce API documentation:** KnoCommerce's REST API is less publicly documented than the other integrations. Verify authentication model (API key vs OAuth), available endpoints, rate limits, and response schema before Phase 3 planning.

- **Clarity Data Export API quotas:** Microsoft Clarity's Data Export API has documented export quotas (number of concurrent exports, retention window). These affect the Inngest sync frequency and job design for the Clarity adapter. Verify current limits in Phase 3 planning.

- **Inngest onFailure API signature:** Verify the current `onFailure` callback API at inngest.com/docs before Phase 3. The pattern is directionally correct but the exact API shape may have changed since training data cutoff (August 2025).

- **Supabase Vault integration with Drizzle:** Vault secret references are stored in `integration_connections.vault_secret_id` as text. The Vault read API uses the Supabase client, not Drizzle. Verify the correct pattern for reading Vault secrets in server-side integration adapter code before Phase 2.

---

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` and `CLAUDE.md` — authoritative project requirements and architecture decisions
- Supabase official documentation — RLS multi-tenant patterns, @supabase/ssr migration from auth-helpers, JWT custom claims
- Next.js 15 official documentation — App Router, Server Components, instrumentation.ts
- Shopify Partner documentation — webhook retry behavior, 5-second timeout, OAuth state param requirements
- Standard OAuth 2.0 security requirements — CSRF state parameter validation

### Secondary (MEDIUM confidence)
- Inngest documentation (training data, pre-August 2025) — step function patterns, concurrency, onFailure callbacks
- Drizzle ORM documentation (training data) — Supabase integration, upsert patterns, migration setup
- TanStack Query v5 documentation (training data) — widget data fetching, SWR deduplication
- Triple Whale and Polar Analytics feature sets (training data) — competitor analysis for feature positioning
- @dnd-kit documentation (training data) — drag-and-drop, react-beautiful-dnd deprecation

### Tertiary (LOW confidence — verify before use)
- Tremor open-source vs paid transition — status unclear; verify at tremor.so before Phase 4
- KnoCommerce REST API — limited public documentation in training data; verify with Intelligems/KnoCommerce developer docs
- Intelligems webhook payload schema — not publicly documented; obtain from provider

---
*Research completed: 2026-02-23*
*Ready for roadmap: yes*
