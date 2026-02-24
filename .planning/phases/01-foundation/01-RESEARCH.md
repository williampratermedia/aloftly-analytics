# Phase 1: Foundation - Research

**Researched:** 2026-02-23
**Domain:** Next.js 15 App Router scaffold, Supabase Auth (SSR), multi-tenant schema with RLS, Drizzle ORM, Tailwind v4 + shadcn/ui, Sentry + Vercel Analytics
**Confidence:** HIGH (core stack well-documented; verified against official sources)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Auth & signup experience**
- Magic link + Google OAuth only — no passwords
- 30-day session duration; re-auth only on sensitive actions
- Post-signup: quick setup wizard (2-3 steps: name org, connect first Shopify store, pick first integration) before landing on dashboard
- Wizard connects to the guided empty state on the dashboard — both reinforce the onboarding path

**Org & role model**
- Hierarchy: Org → Workspaces → Stores (three-level)
  - Agency = org, clients = workspaces, each client can have multiple stores
  - Solo store owner: one workspace, one store — extra layer is invisible to them
- Four roles: Owner, Admin, Member, Viewer
  - Owner: full control including billing
  - Admin: team management, integration management, workspace management
  - Member: use dashboards, manage integrations within assigned workspaces
  - Viewer: view dashboards + export data (CSV). No config changes.
- Workspace-scoped access: members/viewers can be assigned to specific workspaces (essential for agencies where freelancers shouldn't see all clients)
- Team invites via email invite link with role pre-assigned by owner/admin

**App shell & navigation**
- Left sidebar, fixed width (not collapsible). Hamburger menu on mobile.
- Sidebar structure (top to bottom):
  - Workspace switcher dropdown at top (like Linear's team switcher)
  - Dashboards
  - Stores
  - Integrations
  - Settings
  - User avatar at bottom → dropdown for profile, org settings, billing, logout
- Full settings page for detailed management (org, billing, team, profile) in addition to the avatar dropdown
- Breadcrumbs at top of content area showing navigation path (Workspace > Store > Dashboard)
- Empty dashboard state: guided checklist ("Connect your first store" → "Add an integration" → "View your data")
- Clean neutral palette: white/gray surfaces, light content area
- Dark slate sidebar
- Violet/purple accent color (#7c3aed / violet-600) — inspired by Propbinder.com's purple palette applied to dashboard context

### Claude's Discretion
- Org name handling during setup wizard (auto-generate from email domain vs ask)
- Loading states and skeleton patterns
- Exact spacing, typography scale, and shadow system
- Error state designs
- Mobile breakpoint behavior beyond hamburger menu
- Schema details: metric_events partitioning strategy, index priorities, JSONB dimensions shape

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUN-01 | Multi-tenant database schema with org → workspace → store hierarchy and RLS on all tables | Architecture Patterns: Multi-Tenant Schema; Drizzle schema definitions |
| FOUN-02 | Supabase Auth with email/password and magic link sign-in | NOTE: User locked to magic link + Google OAuth only (no passwords). @supabase/ssr package; auth quickstart pattern. |
| FOUN-03 | Role-based access control (owner, admin, member, viewer) with org and workspace-level roles | Custom Access Token Hook; app_metadata storage; RLS policy patterns |
| FOUN-04 | RLS policies using JWT claims (org_id injected via custom claims, no subqueries) | Custom Access Token Hook pattern; auth.jwt() RLS syntax verified |
| FOUN-05 | Typed Supabase client wrappers — getUserClient(session) for user reads, getServiceClient() restricted to ingestion only | @supabase/ssr createBrowserClient/createServerClient; service role client pattern |
| FOUN-06 | metric_events unified table with typed indexed columns and JSONB dimensions blob, partitioned by (store_id, recorded_at) | PostgreSQL declarative partitioning; JSONB GIN index pattern |
| FOUN-07 | metric_definitions registry table with display names, units, aggregation methods, and categories | Standard Drizzle table definition; no external library needed |
| FOUN-08 | sync_jobs tracking table with status, cursor position, error details, duration metrics | Standard Drizzle table definition; enum status column pattern |
| FOUN-09 | Encrypted credential storage via Supabase Vault | vault.create_secret / vault.decrypted_secrets; service_role RPC pattern |
| FOUN-10 | white_label_config JSONB field on organizations table | Drizzle jsonb() column; stored day one, UI deferred |
| FOUN-11 | feature_flags JSONB field on organizations table | Drizzle jsonb() column |
| FOUN-12 | plan_tier column on organizations table | Drizzle varchar/enum column |
| FOUN-13 | Next.js 15 App Router scaffold with TypeScript, Tailwind CSS v4, shadcn/ui, Drizzle ORM | Standard Stack section; installation commands |
| FOUN-14 | Deployment to Vercel with CI/CD pipeline | GitHub Actions + Vercel; CI pattern |
| PROD-07 | Sentry error tracking and Vercel Analytics instrumentation | @sentry/nextjs; @vercel/analytics; instrumentation.ts pattern |
</phase_requirements>

---

## Summary

Phase 1 establishes every structural element the product depends on: the Next.js 15 scaffold, the database schema, authentication, and day-one observability. The tech stack is well-established and well-documented — Next.js 15 + App Router, Supabase (Auth + Postgres + Vault), Drizzle ORM, Tailwind v4, and shadcn/ui are all mature and actively maintained as of early 2026.

The most nuanced areas are (1) multi-tenancy via Supabase custom access token hooks — JWT claims must carry `org_id`, `workspace_ids`, and `role` so RLS policies never need subqueries, and (2) the `metric_events` table design — partitioned by `(store_id, recorded_at)` with a JSONB `dimensions` blob for source-specific data alongside typed indexed columns for cross-source queryable fields.

The two client wrappers (`getUserClient` and `getServiceClient`) are a critical guard: user-context reads enforce RLS naturally; service-role reads are restricted to ingestion-only server paths. This boundary must be established in Phase 1 or it will be retrofitted across every future phase.

**Primary recommendation:** Bootstrap with `create-next-app@latest` (TypeScript + Tailwind + App Router), wire Supabase Auth SSR immediately, write the full schema via Drizzle migrations before any UI work, and instrument Sentry + Vercel Analytics in the first deployment commit.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.x | App framework, routing, API routes, middleware | Locked in CONTEXT.md; React 19 + App Router + Turbopack default |
| TypeScript | 5.x | Type safety across the full stack | Default with create-next-app; strict mode required |
| Tailwind CSS | v4.x | Utility-first styling | Locked in CONTEXT.md; v4 CSS-first config, no tailwind.config.js needed |
| shadcn/ui | latest | Component primitives built on Radix UI + Tailwind | Locked in CONTEXT.md; fully updated for Tailwind v4 + React 19 |
| Drizzle ORM | 0.38.x+ | Type-safe ORM for Postgres | Locked in CONTEXT.md; SQL-like syntax, migration tooling via drizzle-kit |
| @supabase/supabase-js | 2.x | Supabase client SDK | Required for auth, RPC calls, and storage |
| @supabase/ssr | 0.5.x+ | Cookie-based auth for SSR/App Router | Required for Next.js server components + middleware auth |
| @sentry/nextjs | 8.x | Error monitoring and performance tracing | Required by PROD-07; v8.28.0+ for onRequestError hook |
| @vercel/analytics | 1.x | Page view + Core Web Vitals tracking | Required by PROD-07; single component injection |
| postgres | 3.x | Raw postgres driver for Drizzle | Recommended driver for Drizzle + Supabase connection pooler |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| drizzle-kit | 0.29.x+ | Schema migrations and DB push CLI | Dev tooling; generate + migrate or push commands |
| dotenv | 16.x | Environment variable loading | Used in drizzle.config.ts and server-only scripts |
| tsx | 4.x | TypeScript execution for scripts | Dev tooling only; run seed/migration scripts directly |
| @vercel/speed-insights | 1.x | Core Web Vitals tracking complement | Optional but recommended alongside @vercel/analytics |
| next-themes | 0.4.x | Theme provider for dark/light mode | Light-mode-first; scaffold theme provider early even if not used immediately |
| sonner | 1.x | Toast notifications | shadcn/ui now recommends sonner over the deprecated toast component |
| zod | 3.x | Schema validation for API routes and forms | Pair with React Hook Form for server actions and form validation |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Drizzle ORM | Prisma | Prisma has slower migrations and runtime overhead; Drizzle is SQL-first and faster — matches this project's SQL-heavy schema |
| Drizzle ORM | Supabase client queries only | No type inference for complex queries; Drizzle provides typed schema that mirrors Postgres exactly |
| @supabase/ssr | auth-helpers-nextjs (deprecated) | auth-helpers-nextjs is deprecated — @supabase/ssr is the replacement; do not use the old package |
| Custom JWT decode | jose | jose is what @supabase/ssr uses internally; prefer supabase session object over manual JWT decode in app code |
| Sentry | Datadog | Sentry has first-class Next.js App Router support with onRequestError hook; Datadog has no equivalent native integration |

**Installation:**
```bash
# Scaffold
npx create-next-app@latest aloftly-analytics --typescript --tailwind --app --src-dir --import-alias "@/*"

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Drizzle
npm install drizzle-orm postgres dotenv
npm install -D drizzle-kit tsx

# Sentry
npm install @sentry/nextjs

# Vercel Analytics
npm install @vercel/analytics @vercel/speed-insights

# UI
npx shadcn@latest init

# Utilities
npm install sonner zod next-themes
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group: unauthenticated pages
│   │   ├── login/page.tsx        # Magic link + Google OAuth
│   │   └── auth/callback/route.ts # Supabase PKCE code exchange
│   ├── (dashboard)/              # Route group: authenticated pages
│   │   ├── layout.tsx            # Sidebar + breadcrumbs shell
│   │   ├── onboarding/           # Post-signup wizard
│   │   ├── [workspaceId]/        # Workspace-scoped routes
│   │   │   ├── dashboard/
│   │   │   ├── stores/
│   │   │   ├── integrations/
│   │   │   └── settings/
│   │   └── settings/             # Org-level settings
│   ├── api/                      # Route handlers (webhooks, health)
│   │   └── health/route.ts
│   ├── layout.tsx                # Root layout (providers, analytics)
│   ├── global-error.tsx          # Sentry error boundary
│   └── globals.css               # Tailwind v4 CSS entry
├── db/
│   ├── index.ts                  # Drizzle client (server-only)
│   ├── schema/
│   │   ├── auth.ts               # orgs, workspaces, stores, users, org_members
│   │   ├── metrics.ts            # metric_events, metric_definitions
│   │   ├── sync.ts               # sync_jobs, integration_connections
│   │   └── index.ts              # barrel export
│   └── migrations/               # Drizzle-kit generated migration files
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # getUserClient() — browser client
│   │   ├── server.ts             # getUserClient(session) — server client
│   │   └── service.ts            # getServiceClient() — service role, server-only
│   ├── auth/
│   │   ├── middleware.ts         # org context injection helper
│   │   └── rbac.ts               # Role hierarchy + permission checks
│   └── utils.ts                  # cn() and other shared utilities
├── components/
│   ├── ui/                       # shadcn/ui primitives (generated)
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── breadcrumbs.tsx
│   │   └── workspace-switcher.tsx
│   └── auth/
│       ├── login-form.tsx
│       └── magic-link-sent.tsx
├── hooks/                        # Client-side custom hooks
├── middleware.ts                 # Supabase session refresh + route protection
├── instrumentation.ts            # Sentry server/edge init
└── instrumentation-client.ts     # Sentry client init
drizzle.config.ts
sentry.server.config.ts
sentry.edge.config.ts
```

---

### Pattern 1: Supabase SSR Client Wrappers

**What:** Three distinct client types: browser client (for client components), server client (for server components/actions, uses cookies), service client (for ingestion only, uses service_role key).

**When to use:** Browser client in `"use client"` components; server client in server components and server actions for user-context reads with RLS enforced; service client ONLY in ingestion routes and sync jobs that need to bypass RLS.

**Example:**
```typescript
// src/lib/supabase/server.ts — user-context server client (RLS enforced)
// Source: https://supabase.com/docs/guides/auth/server-side/advanced-guide
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/db/schema/types'

export async function getUserClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

// src/lib/supabase/service.ts — service role client (RLS bypassed — ingestion ONLY)
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/db/schema/types'

export function getServiceClient() {
  // NOTE: Never expose SUPABASE_SERVICE_ROLE_KEY to the client bundle
  // This file must only be imported in server-only paths
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
```

---

### Pattern 2: Middleware — Session Refresh + Route Protection

**What:** Next.js middleware intercepts every request to refresh the Supabase session cookie and redirect unauthenticated users. This is mandatory with @supabase/ssr — sessions expire without middleware refresh.

**When to use:** Always. This is the session management backbone.

**Example:**
```typescript
// src/middleware.ts
// Source: https://supabase.com/docs/guides/auth/quickstarts/nextjs
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

### Pattern 3: Custom Access Token Hook — Injecting org_id + role into JWT

**What:** A Postgres function registered as a Supabase auth hook that runs before every token issuance. Reads the user's org membership from the database and injects `org_id`, `workspace_ids`, and `role` into JWT claims. RLS policies then use `auth.jwt()->>'org_id'` with no subqueries.

**When to use:** Required for FOUN-03 and FOUN-04. Must be set up before any RLS policies that reference org context.

**CRITICAL:** The hook ONLY modifies the JWT — not the auth response object. To read custom claims in server components, decode the access token or read from session.

**Example:**
```sql
-- Postgres function registered as Custom Access Token Hook
-- Source: https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  claims jsonb;
  user_org_id uuid;
  user_role text;
begin
  -- Look up the user's primary org membership
  select om.org_id, om.role
  into user_org_id, user_role
  from public.org_members om
  where om.user_id = (event->>'user_id')::uuid
  limit 1;

  claims := event->'claims';

  if user_org_id is not null then
    claims := jsonb_set(claims, '{org_id}', to_jsonb(user_org_id::text));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  end if;

  return jsonb_build_object('claims', claims);
end;
$$;

-- Grant execute to supabase_auth_admin role (required for hook)
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
```

**RLS policy using JWT claim (no subquery):**
```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security
create policy "org_isolation"
on public.stores
for all
using (org_id = (auth.jwt()->>'org_id')::uuid);
```

---

### Pattern 4: Drizzle Schema — Multi-Tenant Tables

**What:** Drizzle schema definitions for the org/workspace/store hierarchy with correct foreign keys, indexes, and Postgres-native types.

**Example:**
```typescript
// src/db/schema/auth.ts
// Source: https://orm.drizzle.team/docs/get-started/supabase-new
import {
  pgTable, uuid, text, varchar, timestamp, jsonb, boolean, index, pgEnum
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const planTierEnum = pgEnum('plan_tier', ['starter', 'professional', 'agency', 'enterprise'])
export const orgRoleEnum = pgEnum('org_role', ['owner', 'admin', 'member', 'viewer'])

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  planTier: planTierEnum('plan_tier').notNull().default('starter'),
  featureFlags: jsonb('feature_flags').notNull().default({}),
  whiteLabelConfig: jsonb('white_label_config').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('workspaces_org_id_idx').on(t.orgId)])

export const stores = pgTable('stores', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  shopifyDomain: varchar('shopify_domain', { length: 255 }).notNull(),
  displayName: text('display_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('stores_org_id_idx').on(t.orgId),
  index('stores_workspace_id_idx').on(t.workspaceId),
])

export const orgMembers = pgTable('org_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(), // references auth.users(id)
  role: orgRoleEnum('role').notNull().default('member'),
  invitedAt: timestamp('invited_at', { withTimezone: true }),
  joinedAt: timestamp('joined_at', { withTimezone: true }),
}, (t) => [
  index('org_members_org_id_idx').on(t.orgId),
  index('org_members_user_id_idx').on(t.userId),
])
```

---

### Pattern 5: metric_events Partitioned Table

**What:** The unified events table partitioned by `(store_id, recorded_at)`. Postgres declarative range partitioning on `recorded_at` is the standard approach; store_id is included in the partition key to enable partition pruning by store in queries. JSONB `dimensions` column holds source-specific display data with a GIN index for future querying.

**Partitioning decision (Claude's discretion):** Monthly range partitions on `recorded_at`. Monthly is the correct choice for this product: CRO data is queried in 7/30/90-day windows, not sub-day; monthly partitions are operationally simple and avoid the overhead of daily partition management. Weekly partitions add complexity without meaningful query benefit for this access pattern.

**Example:**
```sql
-- Partitioned parent table (run via Drizzle migration using sql`` tagged template)
-- Source: https://www.postgresql.org/docs/current/ddl-partitioning.html
create table public.metric_events (
  id          uuid          not null default gen_random_uuid(),
  store_id    uuid          not null,
  org_id      uuid          not null,
  source      varchar(50)   not null,  -- 'shopify' | 'clarity' | 'intelligems' | etc.
  metric_key  varchar(100)  not null,  -- matches metric_definitions.key
  value       numeric(20,4) not null,
  recorded_at timestamptz   not null,
  synced_at   timestamptz   not null default now(),
  dimensions  jsonb         not null default '{}',
  primary key (id, recorded_at)
) partition by range (recorded_at);

-- Indexes on parent (inherited by partitions)
create index metric_events_store_id_recorded_at_idx
  on public.metric_events (store_id, recorded_at desc);
create index metric_events_org_id_idx
  on public.metric_events (org_id);
create index metric_events_source_metric_key_idx
  on public.metric_events (source, metric_key);
create index metric_events_dimensions_gin_idx
  on public.metric_events using gin (dimensions);

-- Initial monthly partitions (create at least 3 months ahead)
create table metric_events_2026_02
  partition of metric_events
  for values from ('2026-02-01') to ('2026-03-01');

create table metric_events_2026_03
  partition of metric_events
  for values from ('2026-03-01') to ('2026-04-01');
```

**NOTE:** Drizzle ORM does not natively support `CREATE TABLE ... PARTITION BY` syntax as of early 2026. Use Drizzle's `sql` tagged template in a migration file to run this DDL directly. The partition management (creating future partitions) should be handled by a Supabase Edge Function cron or pg_cron job.

---

### Pattern 6: Supabase Vault — Storing Integration Credentials

**What:** Vault stores encrypted secrets using pgsodium. Integration OAuth tokens and API keys are written as Vault secrets (with the integration_connections row storing the secret ID, not the value). Secrets are read server-side via RPC functions restricted to service_role.

**Example:**
```sql
-- Function to store a credential (called from server-side ingestion code)
-- Source: https://supabase.com/docs/guides/database/vault
create or replace function private.store_integration_credential(
  p_secret text,
  p_name text,
  p_description text default null
) returns uuid
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  secret_id uuid;
begin
  select vault.create_secret(p_secret, p_name, p_description) into secret_id;
  return secret_id;
end;
$$;

-- Restrict to service_role only
revoke all on function private.store_integration_credential from public, anon, authenticated;
grant execute on function private.store_integration_credential to service_role;

-- Function to retrieve a credential
create or replace function private.get_integration_credential(p_secret_id uuid)
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  secret_value text;
begin
  select decrypted_secret into secret_value
  from vault.decrypted_secrets
  where id = p_secret_id;
  return secret_value;
end;
$$;

revoke all on function private.get_integration_credential from public, anon, authenticated;
grant execute on function private.get_integration_credential to service_role;
```

```typescript
// Server-side TypeScript to read a credential (service client only)
// src/lib/vault.ts
import { getServiceClient } from '@/lib/supabase/service'

export async function getCredential(secretId: string): Promise<string> {
  const client = getServiceClient()
  const { data, error } = await client.rpc('get_integration_credential', {
    p_secret_id: secretId
  })
  if (error) throw new Error(`Vault read failed: ${error.message}`)
  return data as string
}
```

**IMPORTANT:** When inserting secrets via SQL directly, Supabase statement logging will record the plaintext secret. Turn off statement logging (`ALTER SYSTEM SET log_statement = 'none'`) or use the Vault API through the SDK — not raw SQL INSERT — to avoid credential exposure in logs.

---

### Pattern 7: Sentry + Vercel Analytics Instrumentation

**What:** Sentry captures unhandled server, edge, and client errors from the first deployment. Vercel Analytics captures Core Web Vitals. Both are wired at the root layout level with minimal configuration.

**Files required:**
```
instrumentation.ts          # Server/edge registration (root)
instrumentation-client.ts   # Client-side init
sentry.server.config.ts     # Server SDK config
sentry.edge.config.ts       # Edge SDK config
app/global-error.tsx        # React render error boundary
```

**Example:**
```typescript
// instrumentation.ts
// Source: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = (await import('@sentry/nextjs')).captureRequestError
```

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: false,
})
```

```typescript
// app/layout.tsx — Vercel Analytics in root layout
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

```typescript
// next.config.ts
import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // your config
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
})
```

---

### Pattern 8: Auth Callback Route — PKCE Code Exchange

**What:** After magic link or OAuth redirect, Supabase sends users to `/auth/callback?code=xxx`. This route exchanges the code for a session and redirects to the appropriate destination.

**Example:**
```typescript
// src/app/(auth)/auth/callback/route.ts
// Source: https://supabase.com/docs/guides/auth/quickstarts/nextjs
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/onboarding'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
```

---

### Pattern 9: Org Provisioning on First Sign-in

**What:** After a user signs up (magic link or OAuth), a Supabase Database Function (trigger on `auth.users`) auto-provisions an org, workspace, and org_member row. This ensures a new user always lands in a valid org context.

**When to use:** Better than application-level provisioning — the database trigger runs atomically and cannot be skipped by client bugs.

**Example:**
```sql
-- Trigger function: auto-provision on first sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  new_workspace_id uuid;
begin
  -- Create org from email domain or raw email
  insert into public.organizations (name, slug, plan_tier)
  values (
    split_part(new.email, '@', 2),  -- default org name (Claude's discretion: overridable in wizard)
    lower(replace(split_part(new.email, '@', 2), '.', '-')) || '-' || substr(gen_random_uuid()::text, 1, 6),
    'starter'
  )
  returning id into new_org_id;

  -- Create default workspace
  insert into public.workspaces (org_id, name, slug)
  values (new_org_id, 'My Workspace', 'my-workspace')
  returning id into new_workspace_id;

  -- Make user an Owner
  insert into public.org_members (org_id, user_id, role, joined_at)
  values (new_org_id, new.id, 'owner', now());

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

### Anti-Patterns to Avoid

- **Using `auth-helpers-nextjs`:** This package is deprecated. The replacement is `@supabase/ssr`. Any tutorial using `createMiddlewareClient` from auth-helpers is outdated.
- **RLS policies with subqueries for org_id:** Subqueries in RLS execute per-row and kill performance at scale. Use JWT claims (`auth.jwt()->>'org_id'`) exclusively — that is why FOUN-04 specifies "no subqueries."
- **Exposing `SUPABASE_SERVICE_ROLE_KEY` to client:** Service role bypasses RLS entirely. This key must only exist in server-side code and never in `NEXT_PUBLIC_*` variables.
- **Calling `getServiceClient()` in user-facing query paths:** Service client is for ingestion only. User-facing reads must go through `getUserClient()` so RLS enforces org isolation.
- **Running Vault INSERT via raw SQL in development:** Statement logging will capture plaintext secrets. Always insert via SDK RPC or the Supabase dashboard Vault UI.
- **Drizzle schema push to production:** `drizzle-kit push` is for local dev only. Production uses `drizzle-kit generate` + `drizzle-kit migrate` with explicit migration files reviewed before execution.
- **Skipping the `instrumentation.ts` file for Sentry:** The App Router requires `instrumentation.ts` for server-side error capture. Without it, only client errors are tracked. The `onRequestError` export is required for server error capture (requires @sentry/nextjs v8.28.0+).
- **Tailwind v4 with `tailwind.config.js`:** v4 uses CSS-first config via `@theme` directive in globals.css. No `tailwind.config.js` or `tailwind.config.ts` is needed or used.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session cookie management in SSR | Custom cookie-based auth | @supabase/ssr | PKCE flow, token rotation, cookie synchronization — dozens of edge cases across server/client boundary |
| JWT validation in middleware | Manual JWT decode + verify | @supabase/ssr createServerClient + getUser() | getUser() re-validates against Supabase Auth server, not just signature; prevents token forgery |
| Component primitives (modals, dropdowns, tooltips) | Custom accessible components | shadcn/ui + Radix UI | Accessibility (ARIA, keyboard nav, focus trap) is extremely hard to get right; Radix solves it |
| Error boundary for React render errors | Custom ErrorBoundary | global-error.tsx + Sentry.captureException | Sentry's integration captures the full component stack trace, not just the error message |
| Encrypted secret storage | Encrypt/decrypt in application code | Supabase Vault + pgsodium | Vault handles key rotation, at-rest encryption, and authenticated encryption; application-level crypto introduces key management risk |
| Multi-tenant RLS enforcement | Application-level org filtering | Postgres RLS + JWT claims | Application filters can be bypassed by bugs; RLS enforces at the database level regardless of application layer |

**Key insight:** Multi-tenancy bugs are catastrophic (data leakage between orgs). Never rely on application-layer filtering as the sole guard — always enforce at the database level via RLS.

---

## Common Pitfalls

### Pitfall 1: Stale Session After JWT Claim Update

**What goes wrong:** If `org_id` or `role` changes in the database (e.g., user is promoted to Admin), the existing JWT still carries the old claim until it expires. The user may see incorrect permissions until their session is refreshed.

**Why it happens:** JWT claims are baked into the token at issuance. The custom access token hook only runs when a new token is issued.

**How to avoid:** For role/org changes, call `supabase.auth.signOut()` then prompt re-login, or use Supabase's session invalidation to force a token refresh. Document this behavior in the RBAC module.

**Warning signs:** User sees "access denied" on a resource they should have access to, or retains access to a resource after being demoted.

---

### Pitfall 2: Supabase Connection Pooler + Prepared Statements

**What goes wrong:** Drizzle with `postgres` driver fails with cryptic errors when Supabase's connection pooler is in "Transaction" mode (the default for pooled connections).

**Why it happens:** Supabase uses PgBouncer in Transaction mode by default. PgBouncer does not support prepared statements across connections.

**How to avoid:** Always set `{ prepare: false }` when constructing the postgres client for pooled connections:
```typescript
const client = postgres(process.env.DATABASE_URL!, { prepare: false })
```
Use the pooled connection string for the app and the direct connection string for migrations.

**Warning signs:** `prepared statement "..." does not exist` or `cannot use a prepared statement in a transaction-mode pooler` errors.

---

### Pitfall 3: Drizzle schema.ts Does Not Auto-Create Partitions

**What goes wrong:** Defining `metric_events` in Drizzle schema and running `drizzle-kit push` or `migrate` creates the table but without partitioning — Drizzle's ORM layer does not support `PARTITION BY` DDL.

**Why it happens:** Drizzle ORM abstracts away Postgres-specific DDL features that are not cross-dialect.

**How to avoid:** Create `metric_events` and its partitions via raw SQL in a Drizzle migration file using the `sql` tagged template literal. The Drizzle schema can include a type-safe reference to the table columns for query building, but the actual `CREATE TABLE ... PARTITION BY` must be raw SQL.

**Warning signs:** Table creates without error but partition queries fail at runtime; `pg_partitioned_table` system catalog is empty for the table.

---

### Pitfall 4: `getUser()` vs `getSession()` — Security Critical

**What goes wrong:** Using `supabase.auth.getSession()` in server code trusts the session stored in the cookie without re-validation against Supabase Auth. A tampered cookie could grant false authentication.

**Why it happens:** `getSession()` reads from the cookie and returns whatever is there. `getUser()` re-validates the JWT with Supabase Auth's server.

**How to avoid:** Always use `supabase.auth.getUser()` in server components and middleware to confirm the user is authenticated. `getSession()` is acceptable only for non-security-sensitive UI reads where performance matters more.

**Warning signs:** Auth bypass via forged cookies (security vulnerability, not a visible runtime error).

---

### Pitfall 5: Vault Statement Logging

**What goes wrong:** Running `SELECT vault.create_secret('my_actual_api_key')` via SQL exposes the secret in Supabase's query logs.

**Why it happens:** PostgreSQL logs statements by default; Supabase captures these logs. The plaintext secret value appears in the log entry.

**How to avoid:** Use the Supabase Vault UI in the dashboard to insert secrets, or call the vault function via SDK RPC (which does not log parameter values the same way). Never run Vault insert operations in CI/CD pipelines or migration scripts.

**Warning signs:** API keys appear in Supabase project logs.

---

### Pitfall 6: Tailwind v4 Class Generation Changes

**What goes wrong:** Some Tailwind v3 utility classes have been renamed, restructured, or removed in v4. Components copy-pasted from v3 tutorials or shadcn/ui pre-v4 docs may silently have broken styles.

**Why it happens:** Tailwind v4 is a CSS-first rewrite. The `@apply` directive still works but configuration approach is different.

**How to avoid:** Use `npx shadcn@latest init` which auto-configures v4 compatibility. Run `npx @tailwindcss/upgrade` if migrating from v3. Review shadcn/ui's Tailwind v4 docs (https://ui.shadcn.com/docs/tailwind-v4) before starting.

**Warning signs:** Styles appear unstyled or incorrectly styled; browser dev tools show Tailwind classes not generating CSS.

---

## Code Examples

### Drizzle Config with Supabase Pooled + Direct URLs

```typescript
// drizzle.config.ts
// Source: https://orm.drizzle.team/docs/get-started/supabase-new
import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './src/db/migrations',
  schema: './src/db/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    // Use direct (non-pooled) connection for migrations
    url: process.env.DATABASE_URL_DIRECT!,
  },
})
```

### Health Check Route

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
}
```

### metric_definitions Table (Drizzle)

```typescript
// src/db/schema/metrics.ts
import { pgTable, uuid, varchar, text, jsonb, timestamp } from 'drizzle-orm/pg-core'

export const metricDefinitions = pgTable('metric_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 100 }).notNull().unique(), // e.g. 'clarity.rage_clicks'
  source: varchar('source', { length: 50 }).notNull(),    // e.g. 'clarity'
  displayName: text('display_name').notNull(),
  unit: varchar('unit', { length: 50 }),                   // e.g. 'count', 'percent', 'currency'
  aggregationMethod: varchar('aggregation_method', { length: 50 }).notNull().default('sum'),
  category: varchar('category', { length: 50 }),           // e.g. 'engagement', 'revenue', 'ab_test'
  description: text('description'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

### sync_jobs Table (Drizzle)

```typescript
// src/db/schema/sync.ts
import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core'
import { organizations } from './auth'

export const syncStatusEnum = pgEnum('sync_status', ['pending', 'running', 'succeeded', 'failed', 'retrying'])

export const syncJobs = pgTable('sync_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  storeId: uuid('store_id').notNull(),
  source: varchar('source', { length: 50 }).notNull(),
  status: syncStatusEnum('status').notNull().default('pending'),
  cursor: text('cursor'),                          // last synced position (offset, timestamp, etc.)
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  durationMs: integer('duration_ms'),
  errorDetails: jsonb('error_details'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

### integration_connections Table (Drizzle)

```typescript
// also in src/db/schema/sync.ts
import { boolean } from 'drizzle-orm/pg-core'

export const integrationConnections = pgTable('integration_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  storeId: uuid('store_id').notNull(),
  source: varchar('source', { length: 50 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  vaultSecretId: uuid('vault_secret_id'),          // FK to vault.secrets.id
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  lastSyncStatus: syncStatusEnum('last_sync_status'),
  errorDetails: jsonb('error_details'),
  settings: jsonb('settings').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2023-2024 | Deprecated; causes middleware session issues in App Router |
| `tailwind.config.js` with v3 | CSS-first `@theme` directive in globals.css with v4 | 2025 (v4.0) | No config file needed; content detection automatic |
| shadcn/ui toast component | sonner | 2025 | shadcn/ui deprecated their own toast in favor of sonner |
| `pages/` Router | `app/` Router | 2022-2023 | App Router is the standard; Pages Router is in maintenance mode |
| `createMiddlewareClient` | `createServerClient` from @supabase/ssr | 2023-2024 | Direct replacement; old API removed |
| Sentry `_app.tsx` HOC wrapping | `instrumentation.ts` + `onRequestError` | Next.js 15 + Sentry v8.28 | App Router has no `_app.tsx`; new pattern is the standard |
| Manual RLS subquery: `auth.uid() IN (SELECT user_id FROM org_members WHERE org_id = X)` | JWT claim: `auth.jwt()->>'org_id' = X` | 2023-2024 | Subqueries execute per-row; JWT claim is O(1) |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Do not use. Replaced by `@supabase/ssr`.
- `supabase.auth.session()`: Removed in supabase-js v2. Use `supabase.auth.getSession()` or (preferred server-side) `supabase.auth.getUser()`.
- Tailwind v3 config-based setup: Do not use tailwind.config.js with v4.

---

## Open Questions

1. **Drizzle + metric_events partition automation**
   - What we know: Drizzle cannot generate PARTITION BY DDL. Partitions must be pre-created and future partitions managed separately.
   - What's unclear: Whether to use pg_cron (a Supabase-supported extension) or a Supabase Edge Function cron to create next-month partitions automatically.
   - Recommendation: Use pg_cron for partition creation — it runs inside Postgres, requires no external scheduler, and Supabase supports it. Implement in 01-02 (schema plan) with a note that this is a maintenance detail.

2. **Supabase custom access token hook + workspace_ids**
   - What we know: JWT custom claims carry `org_id` and `role`. Workspace membership is also needed for workspace-scoped access control.
   - What's unclear: Whether to embed all `workspace_ids[]` as a JWT array claim or handle workspace-level access control at the application layer (middleware reads workspace membership table).
   - Recommendation: Do NOT embed workspace_ids in JWT — it bloats the token and requires session invalidation on every workspace membership change. Instead, enforce org_id at the DB level via RLS and check workspace access at the middleware/server component level with a service client call. Flag this as an architectural decision for the planning phase.

3. **Vercel Analytics in self-hosted or non-Vercel environments**
   - What we know: @vercel/analytics works only when deployed to Vercel (or with Vercel's Analytics dashboard enabled for the project).
   - What's unclear: Whether local dev tracking is needed or beneficial.
   - Recommendation: Standard practice is to only activate Analytics on deployed previews and production. No local dev tracking needed. Add a `NEXT_PUBLIC_ANALYTICS_ENABLED` env check if needed.

---

## Sources

### Primary (HIGH confidence)

- https://nextjs.org/docs/app/getting-started/installation — Next.js 15 App Router scaffold
- https://nextjs.org/blog/next-15 — Next.js 15 release notes
- https://supabase.com/docs/guides/auth/quickstarts/nextjs — Supabase Auth quickstart with Next.js
- https://supabase.com/docs/guides/auth/server-side/advanced-guide — SSR client patterns
- https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook — JWT custom claims hook
- https://supabase.com/docs/guides/database/postgres/row-level-security — RLS patterns
- https://supabase.com/docs/guides/database/vault — Supabase Vault
- https://orm.drizzle.team/docs/get-started/supabase-new — Drizzle + Supabase setup
- https://ui.shadcn.com/docs/tailwind-v4 — shadcn/ui + Tailwind v4
- https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/ — Sentry Next.js manual setup
- https://www.postgresql.org/docs/current/ddl-partitioning.html — PostgreSQL partitioning

### Secondary (MEDIUM confidence)

- https://vercel.com/docs/analytics/quickstart — Vercel Analytics setup (verified from official Vercel docs)
- https://makerkit.dev/blog/tutorials/supabase-vault — Vault + Drizzle pattern (makerkit, verified against official Vault docs)
- https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac — Custom claims RBAC

### Tertiary (LOW confidence)

- Multiple Medium/DEV community guides cross-referencing above official docs — used for confirmation, not as primary sources

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified against official docs; versions confirmed current as of 2026-02
- Architecture: HIGH — patterns derived from official Supabase and Next.js docs, cross-verified
- Pitfalls: HIGH for most; MEDIUM for Vault statement logging (verified in Vault docs, not independently reproducible)
- Drizzle partitioning limitation: HIGH — confirmed via Drizzle GitHub and docs search

**Research date:** 2026-02-23
**Valid until:** 2026-08-23 (stable stack — 6 months; re-verify Supabase auth hook API and Drizzle version before executing)
