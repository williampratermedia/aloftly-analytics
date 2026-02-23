# Architecture Patterns

**Domain:** Multi-tenant analytics SaaS (Shopify CRO)
**Researched:** 2026-02-23
**Confidence:** HIGH (well-established domain patterns, validated against project decisions)

---

## Recommended Architecture

Aloftly follows a **layered ingest-normalize-serve** architecture. Raw data from 7 external providers flows inward through adapters, gets normalized into a unified event store, and is served outward through a metrics abstraction layer to a widget-based dashboard.

```
┌─────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                    │
│   Next.js App Router  ·  Dashboard Builder  ·  Widget Grid  │
└────────────────────────────┬────────────────────────────────┘
                             │ (React Server Components + SWR)
┌────────────────────────────▼────────────────────────────────┐
│                         API LAYER                            │
│    Next.js API Routes  ·  Webhook Listeners  ·  Auth Guard  │
└────────────────────────────┬────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
┌─────────▼──────┐  ┌────────▼───────┐  ┌──────▼──────────┐
│ METRICS SERVICE│  │  INNGEST JOBS  │  │  INTEGRATION    │
│   ABSTRACTION  │  │   (Pipeline)   │  │    ADAPTERS     │
└─────────┬──────┘  └────────┬───────┘  └──────┬──────────┘
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼──────────┐
│                      DATA LAYER                            │
│    Supabase Postgres  ·  RLS  ·  metric_events table      │
│    Vercel KV (Redis)  ·  Supabase Vault (credentials)     │
└────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    EXTERNAL PROVIDERS                         │
│  Shopify  ·  Clarity  ·  Intelligems  ·  KnoCommerce        │
│  Gorgias  ·  Judge.me  ·  GA4                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Boundaries

| Component | Responsibility | Communicates With | Location |
|-----------|---------------|-------------------|----------|
| **Dashboard Builder** | Widget layout management, column selection, widget ordering, per-widget config UI | Metrics Service (reads), API Layer (writes layout state) | `app/(dashboard)/` |
| **Widget Components** | Self-contained display units: fetch own data, manage own loading/error states | Metrics Service API routes only | `components/widgets/` |
| **API Layer** | Route handlers, auth enforcement, webhook reception, RLS-scoped DB queries | Metrics Service, Inngest, Supabase | `app/api/` |
| **Metrics Service** | Abstraction over DB queries; translates widget `query_config` into SQL; caches results | Supabase, Vercel KV | `lib/metrics/` |
| **Integration Adapters** | Standardized connect/disconnect/sync/testConnection/getAvailableMetrics per provider | External APIs, Inngest, Supabase | `lib/integrations/[provider]/` |
| **Inngest Pipeline** | Background job orchestration: scheduled sync, webhook processing, retry logic | Integration Adapters, Supabase | `inngest/functions/` |
| **Auth + RBAC Middleware** | Session validation, org context injection, role enforcement | Supabase Auth, API Layer | `middleware.ts`, `lib/auth/` |
| **Supabase RLS** | Database-level data isolation scoped to org_id/store_id | All DB queries | Supabase policies |
| **Supabase Vault** | Encrypted storage for OAuth tokens and API credentials | Integration Adapters (read), Settings API (write) | Supabase |
| **Vercel KV Cache** | Short-lived metric result caching; invalidated on new sync | Metrics Service | Vercel KV |
| **Stripe Billing** | Subscription tier enforcement, store limit gating | Auth middleware, Settings | `lib/billing/` |

---

## Data Flow

### Flow 1: Inbound Data (Webhook — real-time)

```
External Provider (Intelligems, Gorgias, Shopify)
  → POST /api/webhooks/[provider]
    → Validate signature + resolve org/store context
      → Inngest: emit("integration.webhook.received", { provider, payload })
        → Inngest function: adapter.sync(payload)
          → Normalize to metric_events row(s)
            → INSERT into metric_events (org_id, store_id, source, ...)
              → Invalidate Vercel KV cache for affected org+store
```

### Flow 2: Inbound Data (Scheduled Pull — Clarity, KnoCommerce, Judge.me, GA4)

```
Inngest cron trigger (per integration, per connected store)
  → Retrieve encrypted credentials from Supabase Vault
    → adapter.sync({ store_id, since: lastSyncAt })
      → Fetch from external API (server-side only)
        → Normalize to metric_events row(s)
          → Upsert into metric_events (conflict on source+event_id)
            → Update integration_connections.last_synced_at
              → Invalidate Vercel KV cache
```

### Flow 3: Widget Data (Read Path)

```
Browser → Widget component mounts
  → GET /api/metrics?widget_type=X&store_id=Y&range=30d
    → Auth middleware: validate session, inject org_id from JWT
      → Metrics Service: parse query_config, build SQL
        → Check Vercel KV cache (key: org+store+widget+range)
          → Cache HIT: return cached result
          → Cache MISS: query Supabase (RLS enforces org_id scope)
            → Cache result (TTL: 5min standard, 60s for high-freshness widgets)
              → Return typed MetricResult to widget
```

### Flow 4: Dashboard Layout (Read/Write)

```
User reorders widgets
  → PUT /api/dashboard/layout { widgets: [...], column_config }
    → Auth middleware: verify org membership + workspace ownership
      → UPDATE dashboard_layouts SET widgets=? WHERE user_id=? AND store_id=?
        → Return 200; client updates optimistically
```

### Flow 5: Integration Connect (OAuth)

```
User clicks "Connect Shopify"
  → GET /api/auth/shopify/start → redirect to Shopify OAuth
    → Shopify redirects to /api/auth/shopify/callback
      → Exchange code for token
        → Store token in Supabase Vault (encrypted)
          → INSERT integration_connections record
            → Emit Inngest: integration.connected (triggers initial sync)
```

---

## Multi-Tenancy Model

The tenancy hierarchy is: **Org → Workspace → Store**.

```
organizations
  └── workspaces (logical grouping, e.g., "Client: Acme Store")
        └── stores (Shopify store connections)
              └── integration_connections (per-store per-provider)
              └── dashboard_layouts (per-user per-store)
              └── metric_events (all normalized data)
```

**Key invariants (must never be violated):**
- Every `metric_events` row has `org_id` + `store_id`
- Every API route injects `org_id` from validated JWT — never from request body
- RLS policies on all tables: `WHERE org_id = auth.jwt() -> 'org_id'`
- Integration adapter calls never happen client-side
- Credentials accessed only via Supabase Vault with scoped service key

---

## Core Schema Shapes

### metric_events (the unified data spine)

```sql
CREATE TABLE metric_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations(id),
  store_id        uuid NOT NULL REFERENCES stores(id),
  source          text NOT NULL,          -- 'clarity' | 'intelligems' | 'gorgias' | ...
  event_type      text NOT NULL,          -- 'session' | 'ab_test_result' | 'survey_response' | ...
  event_id        text NOT NULL,          -- provider-native ID for deduplication
  occurred_at     timestamptz NOT NULL,   -- event time (not insert time)
  ingested_at     timestamptz NOT NULL DEFAULT now(),
  dimensions      jsonb DEFAULT '{}',     -- source-specific dimensions (test_name, variant, etc.)
  metrics         jsonb DEFAULT '{}',     -- numeric values (sessions, revenue, score, etc.)
  raw             jsonb,                  -- optional: full provider payload for re-processing
  UNIQUE (org_id, source, event_id)
);

CREATE INDEX ON metric_events (org_id, store_id, source, occurred_at DESC);
CREATE INDEX ON metric_events (org_id, store_id, event_type, occurred_at DESC);
```

### integration_connections

```sql
CREATE TABLE integration_connections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations(id),
  store_id        uuid NOT NULL REFERENCES stores(id),
  provider        text NOT NULL,           -- 'shopify' | 'clarity' | ...
  status          text NOT NULL,           -- 'active' | 'error' | 'disconnected'
  last_synced_at  timestamptz,
  last_error      text,
  config          jsonb DEFAULT '{}',      -- non-secret config (shop domain, etc.)
  vault_secret_id text,                    -- Supabase Vault reference for credentials
  UNIQUE (store_id, provider)
);
```

### dashboard_layouts

```sql
CREATE TABLE dashboard_layouts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id),
  store_id    uuid NOT NULL REFERENCES stores(id),
  org_id      uuid NOT NULL REFERENCES organizations(id),
  name        text NOT NULL DEFAULT 'Default',
  columns     int NOT NULL DEFAULT 2,       -- 1 | 2 | 3
  widgets     jsonb NOT NULL DEFAULT '[]',  -- ordered array of widget configs
  is_default  boolean DEFAULT false,
  UNIQUE (user_id, store_id, name)
);
```

### Widget config shape (stored in `widgets` JSONB array)

```typescript
interface WidgetConfig {
  id: string;                    // UUID, stable across reorders
  widget_type: WidgetType;       // 'kpi_card' | 'line_chart' | 'ab_test_card' | ...
  title: string;
  position: number;              // display order
  size: 'sm' | 'md' | 'lg';    // grid span
  query_config: {
    source?: string;             // filter to specific provider
    event_type?: string;
    metric_key: string;          // which metric to surface
    date_range: '7d' | '30d' | '90d' | 'custom';
    filters?: Record<string, string>;
  };
  display_config: {
    chart_type?: string;
    color_scheme?: string;
    show_comparison?: boolean;
    comparison_period?: '7d' | '30d';
  };
}
```

---

## Integration Adapter Pattern

Each integration lives in `lib/integrations/[provider]/index.ts` and implements this interface:

```typescript
interface IntegrationAdapter {
  provider: string;

  // Called during OAuth callback or API key submission
  connect(params: ConnectParams): Promise<ConnectionResult>;

  // Revoke tokens, remove Vault secret, update connection record
  disconnect(connectionId: string): Promise<void>;

  // Validate credentials are still valid
  testConnection(connectionId: string): Promise<HealthResult>;

  // Pull data since lastSyncAt, normalize, upsert to metric_events
  sync(connectionId: string, opts: SyncOptions): Promise<SyncResult>;

  // Declare what metrics this adapter can provide (for widget picker)
  getAvailableMetrics(): MetricDefinition[];
}
```

**Critical rule:** `sync()` is the only method Inngest calls. It must be idempotent (upsert, not insert). Credentials are fetched inside `sync()` from Supabase Vault — never passed as arguments.

---

## Inngest Pipeline Architecture

Inngest is the orchestration layer for all background work. It provides retries, observability, and rate limiting without managing infrastructure.

```typescript
// Event taxonomy
'integration/sync.scheduled'   → triggered by Inngest cron (per provider, per store)
'integration/sync.requested'   → triggered manually (e.g., "Sync now" button)
'integration/webhook.received' → triggered by webhook endpoint
'integration/connected'        → triggered after successful OAuth; fires initial sync
'integration/error.threshold'  → fires when N consecutive errors → update status to 'error'
```

**Inngest function pattern:**

```typescript
export const syncIntegration = inngest.createFunction(
  { id: "sync-integration", concurrency: { limit: 5 } },
  { event: "integration/sync.scheduled" },
  async ({ event, step }) => {
    const { connectionId, provider } = event.data;

    const adapter = await step.run("load-adapter", () =>
      getAdapter(provider)
    );

    const result = await step.run("execute-sync", () =>
      adapter.sync(connectionId, { since: event.data.since })
    );

    await step.run("update-sync-metadata", () =>
      updateConnectionSyncMeta(connectionId, result)
    );

    return result;
  }
);
```

**Scheduling pattern:** One Inngest cron function per provider (not per store). The cron function queries `integration_connections` for all active connections of that provider and fans out individual sync events.

---

## Metrics Service Abstraction

The Metrics Service is the read gateway. Widgets never touch the database directly.

```typescript
// lib/metrics/service.ts
export async function getMetric(
  ctx: { orgId: string; storeId: string },
  config: WidgetQueryConfig
): Promise<MetricResult> {
  const cacheKey = buildCacheKey(ctx, config);
  const cached = await kv.get(cacheKey);
  if (cached) return cached as MetricResult;

  const result = await queryMetricEvents(ctx, config);  // SQL via Drizzle
  await kv.set(cacheKey, result, { ex: 300 });          // 5min TTL
  return result;
}
```

**Why this boundary matters:** When query latency exceeds 2-3 seconds at scale (expected at >50M rows), swapping Postgres for ClickHouse is a one-file change in the metrics service. Widget components, API routes, and the cache layer are unaffected.

---

## Patterns to Follow

### Pattern 1: Org Context From JWT, Never Request Body

**What:** `org_id` is always extracted from the validated JWT inside middleware, never from `req.body` or query params.

**When:** Every API route that touches tenant-scoped data (all of them).

```typescript
// middleware.ts
export async function withOrgContext(req: Request) {
  const session = await getSession(req);
  if (!session) throw new UnauthorizedError();
  return {
    userId: session.user.id,
    orgId: session.user.user_metadata.org_id,  // set during onboarding
    role: session.user.user_metadata.role,
  };
}
```

**Why:** Prevents org-switching attacks where a user passes another org's ID in the request.

### Pattern 2: Widget Self-Containment

**What:** Each widget component owns its own data fetching, loading state, and error state. No shared data-fetching parent.

**When:** Always. No exceptions for "simpler" widgets.

```typescript
export function ABTestWidget({ config }: { config: WidgetConfig }) {
  const { data, isLoading, error } = useMetric(config.query_config);
  if (isLoading) return <WidgetSkeleton />;
  if (error) return <WidgetError message={error.message} />;
  return <ABTestDisplay data={data} displayConfig={config.display_config} />;
}
```

**Why:** Prevents one failing integration from cascading to blank the entire dashboard. Failure isolation is a first-class requirement.

### Pattern 3: Idempotent Sync

**What:** Every `sync()` call uses upsert with conflict on `(org_id, source, event_id)`. Never plain INSERT.

**When:** All integration adapters.

```typescript
await db.insert(metricEvents)
  .values(normalizedRows)
  .onConflictDoUpdate({
    target: [metricEvents.orgId, metricEvents.source, metricEvents.eventId],
    set: { metrics: sql`excluded.metrics`, ingested_at: sql`excluded.ingested_at` }
  });
```

**Why:** Inngest retries failed functions. Without idempotency, retries create duplicate rows and corrupt aggregate metrics.

### Pattern 4: Webhook Signature Validation Before Any Processing

**What:** Validate provider signature on every webhook before touching the database or emitting Inngest events.

```typescript
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('X-Intelligems-Signature');
  if (!validateSignature(body, signature, process.env.INTELLIGEMS_SECRET)) {
    return new Response('Unauthorized', { status: 401 });
  }
  // Only after this: emit Inngest event
}
```

**Why:** Unvalidated webhooks are an injection vector. Process nothing before verifying authenticity.

### Pattern 5: Declarative Widget Query Config

**What:** Widgets declare what data they need via a `query_config` JSON blob. The Metrics Service interprets it. Widgets never write SQL.

**Why:** Dashboard layouts (and therefore query configs) are stored in Postgres. If query logic lives in widget code, you can't change business logic without redeploying. If it's in the Metrics Service, you can fix query bugs without touching widget code.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side Integration Calls

**What goes wrong:** Widget calls external API (Clarity, Gorgias) directly from the browser.

**Why bad:** Exposes API credentials to end users. Breaks CORS. No caching layer. Cannot enforce org scoping.

**Instead:** All external API calls happen in Inngest functions or API routes server-side only.

### Anti-Pattern 2: Bypassing the Metrics Service

**What goes wrong:** API route queries `metric_events` directly with raw SQL, bypassing the service.

**Why bad:** Cache doesn't apply. ClickHouse migration requires touching every route. Org-scoping must be re-enforced manually each time.

**Instead:** All reads go through `lib/metrics/service.ts`. The service enforces cache and org context.

### Anti-Pattern 3: Storing Credentials in integration_connections.config

**What goes wrong:** OAuth tokens or API keys stored in a regular JSONB column (even if RLS-protected).

**Why bad:** Postgres column-level encryption is not the same as Vault. Application-level key rotation is hard. Any SQL injection or misconfigured RLS exposes all credentials in plaintext.

**Instead:** All secrets go to Supabase Vault. `integration_connections.vault_secret_id` stores only the reference.

### Anti-Pattern 4: Polling Instead of Inngest Crons

**What goes wrong:** A `setInterval` in a long-running process polls integration APIs every N minutes.

**Why bad:** Doesn't survive Vercel function cold starts. No retry logic. No observability. No rate limiting. Duplicates on restart.

**Instead:** Inngest cron triggers with explicit per-function concurrency limits.

### Anti-Pattern 5: Shared Dashboard Data Fetching Parent

**What goes wrong:** A `DashboardPage` component fetches all widget data in one request and distributes props to widgets.

**Why bad:** One failed integration (e.g., Clarity API is down) blocks the entire dashboard render. Partial data is better than no data.

**Instead:** Each widget fetches independently. Use React Suspense boundaries at the widget level.

### Anti-Pattern 6: Free-Form SQL in Widget Display Code

**What goes wrong:** Widget component constructs a SQL query string and passes it to Supabase client.

**Why bad:** No type safety. No cache layer. Org scoping must be manually appended every time. Injection risk.

**Instead:** Widget specifies `query_config`. API route calls Metrics Service. Drizzle generates typed SQL.

---

## Scalability Considerations

| Concern | At 100 stores | At 1K stores | At 10K stores |
|---------|--------------|--------------|---------------|
| metric_events query latency | Postgres fine (<50ms) | Add composite indexes, use date partitioning | Migrate to ClickHouse via metrics service swap |
| Inngest job fan-out | Default concurrency fine | Add per-org concurrency limits | Shard cron by org_id prefix |
| Webhook throughput | Single endpoint fine | Queue at Inngest layer (already doing this) | Add webhook verification cache |
| RLS overhead | Negligible (<1ms) | Negligible | Enable Postgres connection pooling (pgBouncer) |
| Cache hit rate | Low (small dataset) | Improves naturally | TTL tuning by widget type |
| Credential lookups | Vault per sync call | Add in-memory TTL cache (5 min) for read | Already handled by adapter |
| Dashboard API latency | <100ms | KV cache covers most reads | Read replicas for Postgres |

**Migration trigger for ClickHouse:** When `SELECT` on `metric_events` with 90-day range + 3+ filters consistently exceeds 2 seconds. The Metrics Service boundary makes this a localized backend change.

---

## Suggested Build Order

Dependencies flow strictly downward. Each layer must be stable before the layer above it builds on it.

### Layer 0: Foundation (must be first)
1. **Database schema** — `organizations`, `workspaces`, `stores`, `users`, RLS policies
2. **Auth + org context middleware** — Supabase Auth, JWT org_id injection, RBAC stubs
3. **Supabase Vault setup** — credential storage primitives

**Rationale:** Everything else depends on auth and multi-tenant schema being correct. Retrofitting org_id onto existing tables is a data migration nightmare.

### Layer 1: Data Pipeline (builds on Layer 0)
4. **Integration adapter interface** — TypeScript interface + base class only, no implementations
5. **Inngest setup** — client, event types, route handler at `/api/inngest`
6. **metric_events schema + indexes** — the normalized data spine
7. **First adapter: Shopify** — establishes the pattern; lowest API complexity; OAuth well-documented
8. **Webhook listener framework** — signature validation, Inngest emit pattern

**Rationale:** Shopify is the anchor integration. All CRO metrics need store context (revenue, orders). Build the Shopify adapter first and use it to validate the adapter interface before building the other six.

### Layer 2: Remaining Adapters (builds on Layer 1)
9. **Intelligems adapter** — webhook-based (different pattern from REST pollers); high user value
10. **Gorgias adapter** — REST + webhook hybrid; validates both paths work
11. **Clarity adapter** — REST poll only; validates scheduled sync path
12. **KnoCommerce adapter** — REST poll; straightforward
13. **Judge.me adapter** — REST poll; straightforward
14. **GA4 adapter** — most complex auth (Google OAuth); save for last

**Rationale:** Complete the data pipeline before building the display layer. Without real data flowing, the dashboard is untestable.

### Layer 3: Metrics Service (builds on Layers 0-2)
15. **Metrics Service core** — query builder, cache layer, org context enforcement
16. **Metric definitions** — per-source metric registry (feeds widget picker)
17. **API routes for metrics** — `/api/metrics` endpoint consumed by widgets

**Rationale:** The abstraction layer must exist before any widget fetches data. Widgets built before this layer exist will hardcode queries that are expensive to migrate.

### Layer 4: Dashboard + Widgets (builds on Layer 3)
18. **Widget component library** — KPI card, line chart, bar chart, table, funnel (with mocked data first)
19. **Dashboard builder** — layout state, column config, widget picker modal
20. **Dashboard layout persistence** — save/load from `dashboard_layouts` table
21. **Integration health UI** — connection status indicators, last sync time, error badges
22. **Onboarding flow** — org creation, first store connection, guided widget selection

**Rationale:** Build widgets with mock data first to establish visual language, then wire to Metrics Service. This lets frontend and backend work in parallel after Layer 3 is defined.

### Layer 5: Product Completion (builds on Layer 4)
23. **Stripe billing** — subscription tiers, store limit enforcement, upgrade flows
24. **Dashboard sharing** — read-only link generation, shared view route
25. **Dashboard templates** — pre-built layouts for common CRO workflows
26. **Error handling + retry UI** — "Re-sync" buttons, connection troubleshooter

---

## Critical Architecture Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| RLS policy misconfiguration (data leak between orgs) | Medium | Critical | Write RLS tests that assert cross-org access fails; run on every schema migration |
| Inngest function not idempotent (duplicate metric rows) | High (without care) | High | Enforce `UNIQUE(org_id, source, event_id)` at DB level; test retry scenarios |
| Credentials in wrong storage (plaintext in config column) | Medium | Critical | Code review checklist item; Vault usage linting |
| Widget bypassing Metrics Service | Medium | Medium | TypeScript module boundaries; no direct Supabase client import in widget files |
| Shopify webhook verification skipped under pressure | Medium | High | Validation in base webhook handler, not per-adapter |
| ClickHouse migration complexity underestimated | Low (V1) | Medium | Metrics Service boundary makes it localized; do not skip this abstraction |

---

## Sources

- Project context: `.planning/PROJECT.md` (HIGH confidence — authoritative)
- Multi-tenant SaaS patterns: Domain expertise, widely established (HIGH confidence)
- Inngest architecture: Official Inngest docs patterns (HIGH confidence — standard patterns)
- Supabase RLS: Standard Supabase multi-tenant pattern (HIGH confidence)
- ClickHouse migration pattern: Analytics SaaS industry standard (MEDIUM confidence — no specific version checked)
- Integration adapter pattern: Industry standard (Stripe SDK pattern, Prisma adapters) (HIGH confidence)
