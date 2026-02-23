# Domain Pitfalls: Multi-Tenant Analytics SaaS with Third-Party Integrations

**Domain:** Multi-tenant CRO analytics SaaS (Shopify + 6 integrations)
**Project:** Aloftly Analytics
**Researched:** 2026-02-23
**Confidence:** HIGH for RLS/tenant isolation (well-documented failure mode); HIGH for webhook failures (established patterns); MEDIUM for Inngest-specific behaviors (training data, pre-August 2025)

---

## Critical Pitfalls

Mistakes that cause rewrites, data leaks, or production failures.

---

### Pitfall 1: Supabase RLS Bypassed by Service Role Client

**What goes wrong:**
The Supabase `service_role` client (initialized with `SUPABASE_SERVICE_ROLE_KEY`) bypasses ALL Row Level Security policies. Any query made through this client returns or mutates data across ALL tenants regardless of the authenticated user. If a developer reaches for the service client for convenience — or for background job context where there's no session — and that code path also handles user-facing queries, you have a cross-tenant data leak.

**Why it happens:**
- Inngest background jobs have no user session, so developers default to the service role client for all Inngest handlers
- The mistake propagates: service client gets used for ingestion AND for dashboard data reads because it "just works"
- No immediate error — data comes back, it just comes back for every tenant

**Consequences:**
- Tenant A sees Tenant B's analytics data in their dashboard
- Full data breach — all historical records exposed, not just recent ones
- Regulatory/compliance failure (GDPR, SOC2 aspirations)

**Prevention:**
- Establish a strict rule: the service role client is ONLY used for ingestion writes in background jobs, and ONLY after `org_id`/`store_id` is asserted from a trusted source (the job payload, not user input)
- Never use the service role client in any API route that processes user requests
- Create a typed wrapper:
  ```typescript
  // lib/supabase/server.ts
  export function getServiceClient() { /* only for trusted server ops */ }
  export function getUserClient(session) { /* for user-scoped queries, uses RLS */ }
  ```
- Add a lint rule or code review checklist item: any use of `SUPABASE_SERVICE_ROLE_KEY` outside `/lib/ingestion/` or `/jobs/` is a red flag

**Warning signs:**
- A developer says "I had to use the service client because the session wasn't available"
- API routes that use the service client "for performance"
- Dashboard widgets that sometimes show data they shouldn't

**Phase:** Address in Phase 1 (auth/multi-tenancy foundation) — establish the pattern before any integrations are built

---

### Pitfall 2: Missing org_id Scope on Unified metric_events Table

**What goes wrong:**
The unified `metric_events` table aggregates data from all 7 integrations. As integrations are added one by one, a developer adds a query for, say, Clarity data that filters by `store_id` but forgets `org_id`. Since `store_id` may be globally unique, this might never surface in development — but the moment two orgs connect the same Shopify store (impossible) OR the store ID generation has collision potential, you have a silent data mix.

More commonly: a query filters by `source = 'clarity'` and `store_id = X` but omits `org_id`. If RLS is configured only on `org_id` and a service client is in use (see Pitfall 1), the omission goes undetected until a tenant reports seeing wrong data.

**Why it happens:**
- RLS feels like a safety net, so developers get sloppy with explicit query filters
- Composite index on `(org_id, store_id, source, event_time)` not established early, so queries work without `org_id`
- Each integration is built by a different developer in a different sprint; no consistent query template

**Consequences:**
- Silent data bleed between tenants
- Wrong metrics shown on dashboards
- Near-impossible to audit retroactively

**Prevention:**
- Every query against `metric_events` MUST include `org_id` as the first filter — enforce this with a shared query builder utility
  ```typescript
  // lib/db/events.ts
  export function getEventsQuery(supabase, orgId: string, storeId: string) {
    return supabase
      .from('metric_events')
      .select('*')
      .eq('org_id', orgId)       // ALWAYS first
      .eq('store_id', storeId);  // ALWAYS second
  }
  ```
- Database: composite index `(org_id, store_id, source, event_time DESC)` in migration 001
- RLS policy on `metric_events` should assert `org_id = auth.jwt() ->> 'org_id'` as a double-check, not the only check

**Warning signs:**
- Queries against `metric_events` that don't reference `org_id` in the WHERE clause
- Dashboard load times that seem too fast (possibly reading unconstrained data)

**Phase:** Address in Phase 1 (schema design) — the composite index and query builder must exist before Phase 2 (first integration)

---

### Pitfall 3: Webhook Receivers Without Idempotency or Signature Verification

**What goes wrong:**
Intelligems, Gorgias, and Shopify all send webhooks. Without HMAC signature verification, any party can POST to your webhook endpoint and inject fake data. Without idempotency handling, Shopify's guaranteed-at-least-once delivery (they retry on any non-200 response) will create duplicate records.

**Why it happens:**
- Webhook receivers get built quickly as "just an endpoint" during integration sprints
- Idempotency feels like an optimization, not a safety requirement
- Developers test with manual curl requests where signatures are absent, so verification is commented out or skipped

**Consequences:**
- **Signature omission:** Competitor or bad actor can inject false A/B test results, fake support ticket data, or false review scores — corrupting the CRO recommendations
- **No idempotency:** Network retries or Shopify's aggressive retry logic creates 2-10x duplicate records in `metric_events`, corrupting all aggregated metrics. Revenue totals double, survey counts inflate.
- Both bugs are silent — the system keeps working, data is just wrong

**Prevention:**
- Create a shared `verifyWebhookSignature(request, secret, provider)` utility in Phase 1. Every webhook route calls it before processing — no exceptions
- Use the webhook's native deduplication ID as the idempotency key:
  - Shopify: `X-Shopify-Webhook-Id` header
  - Gorgias: ticket ID in payload
  - Intelligems: test event ID
- Store processed webhook IDs in a `webhook_events` table with a unique constraint on `(provider, webhook_id)`. Insert with `ON CONFLICT DO NOTHING` and return 200 immediately on duplicate
- Always return 200 to the webhook provider within 5 seconds — do the actual processing async (this is what Inngest is for)

**Warning signs:**
- Webhook handlers that do synchronous database work before returning
- No `webhook_events` deduplication table in the schema
- Signature verification conditional on an env var that's "off in development"

**Phase:** Address in Phase 2 (first webhook integration) — the pattern must be established on the FIRST webhook, not retrofitted onto all of them

---

### Pitfall 4: Shopify OAuth Token Storage and Rotation Failures

**What goes wrong:**
Shopify access tokens for offline (long-lived) access must be stored encrypted per-store. Three failure modes:
1. Tokens stored in plaintext in the database
2. Token refresh not handled — Shopify can rotate tokens; stale tokens cause silent integration failures that look like "no data"
3. OAuth callback does not validate the `state` parameter (CSRF) — allows token hijacking

**Why it happens:**
- OAuth is treated as "done" after the first working callback
- Token encryption is deferred as "we'll add it before launch"
- State parameter validation is skipped in development because the happy path works fine without it

**Consequences:**
- Plaintext tokens: database breach exposes all connected Shopify stores
- Token staleness: integration silently stops fetching data; dashboards show stale metrics with no error visible to the user
- CSRF omission: attacker can complete an OAuth flow as the victim user and connect their store to attacker's org

**Prevention:**
- Encrypt tokens at the application layer before writing to Supabase (AES-256, key in env):
  ```typescript
  // lib/crypto.ts
  export function encryptToken(token: string): string { /* ... */ }
  export function decryptToken(cipher: string): string { /* ... */ }
  ```
- Generate a cryptographically random `state` param on OAuth initiation, store it in the user's session, verify it matches on callback — hard reject mismatches
- Store `token_updated_at` on the integration record; build a background check job that pings Shopify's token validity endpoint and alerts (or re-initiates OAuth) on failure
- When a Shopify API call returns 401, immediately flag the integration as `requires_reauth` and surface it in the UI

**Warning signs:**
- Tokens stored in `TEXT` column without any encryption wrapper
- No `state` parameter in the OAuth authorization URL
- No mechanism for detecting expired/rotated tokens

**Phase:** Address in Phase 2 (Shopify integration) — must be correct on first implementation, not retrofitted

---

### Pitfall 5: Inngest Job Failures Are Silent Without Dead Letter Handling

**What goes wrong:**
Inngest runs background sync jobs for each integration. When a sync fails (API rate limit, third-party outage, schema mismatch), Inngest retries with exponential backoff. Without explicit failure tracking:
- The user sees no indication their data isn't syncing
- After Inngest exhausts retries, the event is dropped silently
- The last successful sync timestamp becomes stale; dashboard shows "current" data that's days old

**Why it happens:**
- Inngest's retry behavior feels like reliability ("it'll retry automatically")
- Failure callbacks are optional in Inngest's API and easy to skip
- Integration health UX is always deferred as "nice to have"

**Consequences:**
- Users make CRO decisions on stale data they believe is current
- Support tickets spike when syncs fail silently during a third-party API outage
- Revenue impact if A/B test data stops flowing during an active test

**Prevention:**
- On every Inngest function, implement the `onFailure` callback:
  ```typescript
  export const syncClarityData = inngest.createFunction(
    {
      id: 'sync-clarity',
      onFailure: async ({ event, error }) => {
        await markIntegrationSyncFailed(event.data.storeId, 'clarity', error.message);
      },
    },
    { event: 'integration/clarity.sync' },
    async ({ event, step }) => { /* ... */ }
  );
  ```
- Store `last_sync_at`, `last_sync_status`, and `last_sync_error` on every integration record
- Dashboard UI should show a "sync status" indicator per integration — stale data (> 24h) should be visually flagged
- Build a health-check job that runs every hour and alerts (Slack/email) if any store's integration hasn't synced successfully in > 4 hours

**Warning signs:**
- Inngest functions with no `onFailure` handler
- No `last_sync_at` column on integration tables
- No integration health status visible in the dashboard UI

**Phase:** Address in Phase 3 (background job infrastructure) — establish the pattern on the FIRST Inngest function

---

### Pitfall 6: Unified metric_events Schema Too Rigid or Too Loose

**What goes wrong:**
The `metric_events` table must handle 7 different data sources with radically different event shapes — a Clarity session, an Intelligems A/B variant assignment, a KnoCommerce survey response, a Gorgias ticket, and a Judge.me review have almost nothing in common structurally.

**Too rigid:** Adding typed columns for every source (`clarity_session_id`, `intelligems_variant`, etc.) creates a wide sparse table — most columns null for any given row. Adding source 8 requires a schema migration.

**Too loose:** Dumping everything into a JSONB `metadata` column makes every cross-source query slow and forces the application to understand each source's schema at query time. Indexes on JSONB are coarse; query plans degrade at scale.

**Why it happens:**
- The unified table feels elegant in planning but the schema evolves organically per integration sprint
- JSONB is reached for as a "flexible" escape hatch
- No upfront decision on what fields are cross-source (queryable) vs source-specific (opaque)

**Consequences:**
- At 10M+ rows (realistic for a multi-store org with Clarity data), JSONB queries without precise GIN indexes become full table scans
- Adding a new integration requires touching every existing query to handle the new source
- Reporting queries become unmanageable

**Prevention:**
- Define the schema split upfront:
  - **Common columns (indexed):** `id`, `org_id`, `store_id`, `source`, `event_type`, `event_time`, `session_id`, `user_id`, `value` (numeric for aggregations)
  - **Source-specific columns (JSONB):** `metadata JSONB` — but only for data that is NEVER filtered on, only displayed
  - Never query `metadata` in WHERE clauses — if you need to filter on it, it should be a real column
- Create separate summary/aggregate tables for dashboard queries — don't query `metric_events` raw for dashboards
- Add a GIN index on `metadata` only if needed for specific use cases, not by default

**Warning signs:**
- Dashboard queries doing `WHERE metadata->>'field' = 'value'`
- `metric_events` table with 20+ columns where most are nullable
- Query times growing linearly with row count

**Phase:** Address in Phase 1 (schema design) — the boundary between common and metadata columns must be decided before any data flows in

---

## Moderate Pitfalls

### Pitfall 7: Multi-Store Context Not Enforced in Next.js Middleware

**What goes wrong:**
Users can connect multiple Shopify stores. The active store context (which store's dashboard you're viewing) is typically stored as a query param or in session state. If middleware doesn't validate that the requested `store_id` belongs to the authenticated user's org, a user can enumerate or switch to another org's store by manipulating the URL.

**Prevention:**
- Next.js middleware should validate `store_id` ownership on every request to `/dashboard/[storeId]/*`
- Never trust `store_id` from the URL alone — validate against the user's org in the middleware:
  ```typescript
  // middleware.ts
  const store = await getStoreForOrg(storeId, orgId);
  if (!store) return NextResponse.redirect('/unauthorized');
  ```
- Cache the store-to-org mapping in Redis/Supabase for performance

**Warning signs:**
- Store ID taken directly from URL params without ownership validation
- No middleware guard on dashboard routes

**Phase:** Address in Phase 2 (multi-store auth) alongside Shopify OAuth

---

### Pitfall 8: Third-Party API Rate Limits Not Modeled Per Tenant

**What goes wrong:**
Microsoft Clarity, Shopify, and KnoCommerce all have rate limits. In a single-tenant scenario, hitting a rate limit blocks that sync. In multi-tenant, all tenants share the same API credentials context — a large tenant's sync can trigger rate limiting that blocks ALL tenant syncs simultaneously.

**Prevention:**
- Queue Inngest sync jobs with per-store throttling, not per-integration
- Implement exponential backoff at the Inngest function level, not the API call level
- For Clarity's Data Export API (which has documented export quotas), track export job IDs per store and don't re-request until the previous export completes
- Store `last_api_call_at` and respect per-integration rate limit windows before re-queuing

**Warning signs:**
- A single Inngest job that syncs ALL stores for an integration in a loop
- No per-store rate limit tracking in the database

**Phase:** Address in Phase 3 (ingestion pipeline) when building the first sync job

---

### Pitfall 9: Dashboard Widget State Not Isolated From Shared Data Fetching

**What goes wrong:**
Widgets are self-contained (per CLAUDE.md spec). If a parent component or shared context fetches data and passes it down, a loading failure in one widget can cascade and block all other widgets. The inverse: if each widget independently calls the same underlying endpoint 7 times for 7 widgets, the dashboard hammers the database on every load.

**Prevention:**
- Each widget fetches its own data via SWR with a deduplicated cache key — SWR prevents duplicate network requests for identical keys automatically
- Widget loading/error states are entirely local — no shared loading state provider
- Add a Supabase-level materialized view or summary table for the most commonly fetched dashboard metrics; widgets read from the summary, not raw `metric_events`

**Warning signs:**
- A `DashboardContext` that fetches all data on mount and passes down to widgets
- Multiple widgets hitting `/api/events?source=clarity` simultaneously without SWR deduplication

**Phase:** Address in Phase 4 (dashboard builder) — establish widget data-fetching pattern on the first widget

---

### Pitfall 10: Stripe/Billing Not Gating Integration Access

**What goes wrong:**
If a user downgrades or their payment fails, they should lose access to premium integrations. Without enforcement at the API and query level, a churned customer continues to receive data syncs, consuming API quota and compute.

**Prevention:**
- Store subscription status on the org record with a `plan_tier` field
- API routes for premium integrations check `org.plan_tier` before processing
- Inngest jobs check integration entitlement before running — a disabled or lapsed org's sync jobs should no-op, not fail noisily
- Supabase RLS cannot enforce billing — this must be application-layer

**Warning signs:**
- No `plan_tier` or `subscription_status` on the org table
- Integration data flowing for orgs with `status = 'cancelled'`

**Phase:** Address in Phase 5 (billing) but the schema placeholder (`plan_tier` column) must exist from Phase 1

---

### Pitfall 11: Intelligems Webhook Listener Designed as a REST Poller

**What goes wrong:**
Intelligems doesn't offer a REST polling API for test results — their data delivery model is webhook-based. If the initial integration is architected as a cron job that polls an Intelligems endpoint, the integration will never work correctly. The CLAUDE.md spec explicitly flags this, but it's worth documenting the consequence:

**Prevention:**
- Build a `/api/webhooks/intelligems` POST endpoint that receives test events
- Register the webhook URL in Intelligems' configuration pointing to this endpoint
- Process the webhook payload async via Inngest (receive fast, process slow)
- Never build a cron job to "check for new Intelligems results"

**Warning signs:**
- An Inngest cron trigger attempting to poll an Intelligems API
- Questions about "what's the Intelligems REST API endpoint for test results"

**Phase:** Address in Phase 2 (Intelligems integration) — the architecture is fixed, not a choice

---

## Minor Pitfalls

### Pitfall 12: Supabase Edge Function Cold Starts Affecting Webhook Receipt

**What goes wrong:**
If webhook receivers are implemented as Supabase Edge Functions (rather than Next.js API routes), cold starts can cause 2-5 second delays on the first request. Shopify's webhook timeout is 5 seconds before it considers the delivery failed and retries. Cold starts + processing time can exceed this window, triggering retry storms.

**Prevention:**
- Implement webhook receivers as Next.js API routes on Vercel (always-warm for incoming traffic), not Supabase Edge Functions
- The route should do nothing except: verify signature, store raw payload to a `webhook_queue` table, return 200 — all in under 200ms
- Inngest picks up from the queue asynchronously

**Warning signs:**
- Webhook endpoints implemented as `supabase/functions/` rather than `app/api/webhooks/`

**Phase:** Establish pattern in Phase 2 (first webhook)

---

### Pitfall 13: Judge.me and KnoCommerce Data Assumed Real-Time

**What goes wrong:**
Both Judge.me and KnoCommerce provide APIs with pagination, not webhooks. Review scores and survey responses are fetched on a schedule. Developers sometimes build these integrations to show "current" data when the data is actually up to N hours old depending on sync frequency. Users making CRO decisions based on review sentiment need to understand the data freshness.

**Prevention:**
- Always display `last_synced_at` per data source on every widget that shows fetched-not-streamed data
- Don't represent daily-synced data with present-tense language ("Your review score is 4.7") — use past-tense attribution ("As of [date], your review score was 4.7")
- Build sync frequency as a configurable option per integration (hourly vs daily) based on plan tier

**Phase:** Address in Phase 3 (scheduled ingestion) and Phase 4 (dashboard UX)

---

### Pitfall 14: Supabase RLS Policy Evaluation Performance

**What goes wrong:**
RLS policies execute on every row in a query result. Poorly written policies — especially those calling functions or doing subqueries — can multiply query time by 10-100x. A policy like `EXISTS (SELECT 1 FROM orgs WHERE id = auth.uid())` runs that subquery for every row.

**Prevention:**
- Write RLS policies that reference JWT claims directly, not subqueries:
  ```sql
  -- Good: reads JWT claim, no subquery
  CREATE POLICY "tenant_isolation" ON metric_events
    USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

  -- Bad: subquery per row
  CREATE POLICY "tenant_isolation" ON metric_events
    USING (org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid()));
  ```
- Include `org_id` in the Supabase JWT custom claims (set via Auth hooks) so RLS can compare without subqueries
- Test RLS policy performance with `EXPLAIN ANALYZE` before merging any migration that touches policies

**Warning signs:**
- RLS policies using `EXISTS` or `IN (SELECT ...)`
- Query time for simple selects growing after adding RLS

**Phase:** Address in Phase 1 (schema + RLS setup)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Phase 1: Schema Design | Too-loose metric_events schema (JSONB overuse) | Define common vs metadata columns before writing any integration |
| Phase 1: RLS Setup | Service role client bypasses RLS | Establish typed client wrappers before any data routes are built |
| Phase 1: RLS Setup | RLS policies with subqueries degrade performance | Use JWT claims in policies; no subqueries |
| Phase 2: Shopify OAuth | CSRF state param omission | Implement state validation from the first OAuth flow |
| Phase 2: Shopify OAuth | Plaintext token storage | Encrypt tokens at application layer from the first integration |
| Phase 2: Intelligems | Poller instead of listener | Webhook receiver only; no REST poller |
| Phase 2: Any webhook | Missing signature verification | Shared verification utility used before any webhook processing |
| Phase 2: Any webhook | Duplicate processing on retry | Idempotency table with unique constraint on (provider, webhook_id) |
| Phase 3: Inngest jobs | Silent failures after retry exhaustion | onFailure handler + integration sync status tracking required |
| Phase 3: Sync jobs | Rate limits affect all tenants | Per-store throttling in Inngest, not per-integration |
| Phase 3: Sync jobs | Webhook handlers doing sync work | Return 200 immediately; enqueue to Inngest; process async |
| Phase 4: Dashboard | Widget data fetching cascade failures | SWR with deduped keys; fully isolated widget error states |
| Phase 4: Dashboard | Raw metric_events queries in widgets | Summary/aggregate tables for dashboard queries |
| Phase 5: Billing | Data flowing to lapsed orgs | plan_tier check in API routes and Inngest jobs |

---

## Sources

**Confidence note:** Network tools (WebSearch, WebFetch) were unavailable in this research session. All findings are from training data (knowledge cutoff August 2025). The pitfalls documented here are well-established in the Supabase, Next.js, Shopify, and multi-tenant SaaS ecosystems and represent patterns documented repeatedly in official documentation, community post-mortems, and production incident reports. Confidence ratings:

- Supabase RLS bypass via service role: HIGH — documented in official Supabase multi-tenant guides
- RLS policy performance with subqueries: HIGH — documented in Supabase official docs (prefer JWT claims)
- Shopify webhook retry behavior and 5s timeout: HIGH — documented in Shopify Partner docs
- Shopify OAuth state param requirement: HIGH — standard OAuth 2.0 security requirement
- Inngest onFailure handler pattern: MEDIUM — based on Inngest documentation pre-August 2025; verify current API
- Intelligems webhook-only delivery: HIGH — stated explicitly in project context (CLAUDE.md)
- JSONB performance at scale: HIGH — well-documented PostgreSQL behavior

**Recommended verification when tools are available:**
- Inngest: verify current `onFailure` callback API signature at https://www.inngest.com/docs
- Supabase RLS JWT claims: verify custom claims setup at https://supabase.com/docs/guides/auth/jwts
- Shopify webhooks: verify current timeout and retry behavior at https://shopify.dev/docs/apps/build/webhooks
