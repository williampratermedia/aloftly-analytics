# Technology Stack

**Project:** Aloftly Analytics — Shopify CRO Analytics SaaS
**Researched:** 2026-02-23
**Confidence:** MEDIUM-HIGH (core choices validated against known ecosystem; specific patch versions LOW confidence without live npm lookup)

---

## Validated Stack (User's Choices Confirmed)

The pre-selected stack is sound for this use case. Each decision is validated below with rationale and any concerns flagged.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 15.x (App Router) | Full-stack React framework | App Router is the production-stable path for 2025+. Server Components eliminate boilerplate data-fetching for dashboard views. Vercel-native with edge runtime support. |
| TypeScript | 5.x | Type safety across full stack | Non-negotiable for a multi-integration SaaS — catches integration shape mismatches at compile time, not runtime. |
| React | 19.x | UI runtime | Ships with Next.js 15. React 19 stable; concurrent features (Suspense, transitions) matter for dashboard loading states. |

**Concern — Next.js 14 vs 15:** The project spec says "Next.js 14+" but Next.js 15 is now the stable current release. Build on 15 from the start. Next.js 14 reached its feature ceiling and 15 introduced stable `<Form>`, improved caching defaults, and the `after()` API for post-response work (relevant for webhook acknowledgment patterns). **Recommendation: Use Next.js 15, not 14.**

### UI Layer

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 4.x | Utility-first styling | Tailwind v4 is a major rewrite — CSS-first config, faster build times (Oxide engine), no more `tailwind.config.js` for most projects. Breaking change from v3. |
| shadcn/ui | Latest (not versioned — copy-paste model) | Accessible component primitives | Not a package — source-copied components. Uses Radix UI primitives underneath. Right call for a dashboard: you own the code, customize freely, no version lock-in. |
| Radix UI | 1.x / 2.x (per-package) | Headless accessibility primitives | shadcn/ui depends on these; install per-component as needed. |

**Concern — Tailwind v3 vs v4:** Tailwind v4 released in 2025 with a complete configuration paradigm shift. shadcn/ui has updated for v4 compatibility. If starting fresh in 2026, use Tailwind v4. It has breaking changes from v3 so document this in project setup. The `@theme` CSS variable approach in v4 pairs well with shadcn/ui's CSS variable theming.

### Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase | Managed (no version pinning) | Postgres + Auth + Storage + Realtime | Managed Postgres removes ops burden. Supabase Auth handles email/password + magic link without custom code. RLS is the correct isolation primitive for multi-tenant SaaS. Supabase Vault handles encrypted secrets for OAuth tokens. |
| PostgreSQL | 15+ (Supabase-managed) | Primary data store | Correct for V1 data volumes. The key decision in PROJECT.md to migrate to ClickHouse at 50M+ rows is architecturally sound — Postgres can handle analytics workloads at this scale with proper indexing. |
| Drizzle ORM | 0.38+ | Type-safe query builder | Validated choice over Prisma for this project. Drizzle is SQL-first — you write SQL, it infers types. Better for complex analytical queries than Prisma's opinionated model approach. Schema-as-code means migrations are auditable. Critically: Drizzle works with Supabase's Postgres directly, no connection pooling complications that Prisma had with Supabase. |

**Gap — Connection Pooling:** Supabase uses PgBouncer (port 6543) for connection pooling, required in serverless/edge environments. Drizzle connects via the `postgres` npm package. Configure to use the pooled connection string for API routes and the direct connection string for migrations only. This is a common setup error.

### ORM Configuration Detail

```typescript
// lib/db/index.ts — correct Supabase + Drizzle setup
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// Pooled connection for API routes (serverless)
const client = postgres(process.env.DATABASE_URL!) // port 6543 pooled URL
export const db = drizzle(client)

// Direct connection for migrations only (separate file)
// const migrationClient = postgres(process.env.DATABASE_URL_DIRECT!) // port 5432
```

### Authentication & Authorization

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase Auth | Managed | Identity management | Email/password + magic link out of the box. Sessions managed via cookies in Next.js App Router. Custom RBAC (org/workspace roles) lives in your own Postgres tables, not Supabase's auth.users table which is for identity only. |
| @supabase/ssr | 0.5+ | Next.js App Router auth integration | This is the correct package for App Router — replaces the deprecated @supabase/auth-helpers-nextjs. Handles cookie-based sessions for Server Components. |

**Critical:** The @supabase/auth-helpers-nextjs package is deprecated. Use @supabase/ssr for all new Next.js App Router projects. This is a frequent confusion point in tutorials.

### Background Jobs

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Inngest | 3.x | Event-driven background job orchestration | Validated. Serverless-native, no infrastructure to manage. Generous free tier (50K function runs/month). Built-in retries, concurrency controls, fan-out patterns, and step functions. Natural fit for multi-step integration sync flows. The event model aligns with the webhook-first architecture (Intelligems, Gorgias webhooks → Inngest events → processing steps). |

**Inngest vs Alternatives:** Trigger.dev is a comparable alternative with a more developer-focused DX. Inngest is the right choice here because its step function model matches the integration sync pattern exactly: step 1 fetch, step 2 transform, step 3 upsert, step 4 update health status. Each step is retried independently.

**Concern:** Inngest requires its own deployment endpoint (`/api/inngest`) that must be registered. In Vercel deployments, this is straightforward. Document this in setup.

### Caching

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel KV | Managed (Upstash Redis) | Request-level caching, rate limiting, session data | Validates. Upstash Redis under the hood — serverless-compatible, per-request pricing. Use for: API response caching (integration data with 5-15 min TTL), rate limiting on webhook endpoints, distributed locks for job deduplication. |

**Concern — Vercel KV Pricing:** Vercel KV has per-command pricing. For a dashboard with many widgets each making cached reads, costs can spike unexpectedly. Set cache TTLs thoughtfully (15 min for most integration data is reasonable). Monitor KV command usage in early production. Alternative: use Next.js `unstable_cache` / `cache()` for function-level memoization before reaching for KV.

**Recommended Caching Strategy:**
- Next.js `cache()` — in-request memoization for repeated DB calls within a single render
- Next.js `revalidatePath`/`revalidateTag` — on-demand cache invalidation after webhook events
- Vercel KV — cross-request caching for expensive integration API calls, rate limiting state

### Charts & Visualization

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Recharts | 2.x | Composable chart primitives | Good choice for line/bar/area charts. React-native, composable, responsive. Works well with Tailwind for styling. Drawback: bundle size (use tree-shaking, import specific components). |
| Tremor | 3.x | Pre-built dashboard components | **Concern raised below.** |

**Tremor Concern — VERIFY BEFORE USING:** Tremor shifted from an open-source dashboard component library (v2/v3) to Tremor Pro (paid) in 2024. The free tier has reduced component coverage. Evaluate whether the free Tremor components cover widget needs, or whether you're building charts directly with Recharts anyway. If Tremor is being used only for KPI cards and number formatting utilities, that's fine. If expecting full chart components from Tremor, verify current free tier coverage. **Confidence: LOW — verify at tremor.so before depending on it.**

**Alternative if Tremor is problematic:** Build widget wrapper components directly with Recharts + shadcn/ui Card primitives. This is arguably cleaner for a custom dashboard product anyway — you own 100% of the component code.

### Payments

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Stripe | Latest (stripe npm ^16.x) | Subscription billing | Industry standard. Use Stripe Billing with Products and Prices for the 4-tier subscription model. Stripe webhooks → Inngest for event processing (subscription.created, subscription.updated, customer.subscription.deleted). |
| @stripe/stripe-js | 4.x | Client-side Stripe Elements | Only needed if building custom payment UI. Stripe Checkout redirect avoids client-side Stripe entirely for V1 — recommended. |

### Monitoring & Observability

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Sentry | 8.x (@sentry/nextjs) | Error tracking + performance | Validated. The @sentry/nextjs SDK now supports App Router and Server Components natively. Wrap API routes and Server Actions. Critical for a multi-integration product — integration failures need clear error context (which org, which store, which integration, which API call failed). |

**Sentry Configuration Note:** With Next.js App Router, Sentry instrumentation goes in `instrumentation.ts` (Next.js 15 supported file). Avoid the older `_error.js` pattern. Use `Sentry.captureException()` in integration error boundaries.

### Deployment

| Technology | Purpose | Why |
|------------|---------|-----|
| Vercel | Hosting + Edge network + KV | Native Next.js deployment. Zero-config CI/CD from GitHub. Edge Functions for auth middleware (critical for checking org/store context at the edge). The Inngest integration is well-documented for Vercel. |

---

## Supporting Libraries (Gaps in Current Stack)

These are not in the current spec but are necessary for the feature set:

### Essential Missing Libraries

| Library | Version | Purpose | Why Needed |
|---------|---------|---------|------------|
| Zod | 3.x | Runtime schema validation | Non-negotiable for webhook payloads and integration API responses. Validate every inbound payload shape before touching the database. Use with Drizzle for insert validation. |
| @tanstack/react-query | 5.x | Client-side data fetching + cache | Dashboard widgets need client-side refetch (polling, invalidation on focus). React Query v5 is the standard. Use alongside Server Components — RSC for initial load, React Query for client-side updates. |
| nuqs | 2.x | URL state management | Dashboard state (selected store, date range, active widgets) should be in the URL for shareability. nuqs handles Next.js App Router URL param sync with type safety. |
| date-fns | 3.x | Date manipulation | CRO dashboards are date-range heavy. date-fns is lightweight, tree-shakeable, TypeScript-native. Avoid moment.js (deprecated) and dayjs (less TypeScript-complete). |
| @upstash/ratelimit | Latest | Rate limiting for webhook endpoints | Upstash Redis (same as Vercel KV) with a rate limiting abstraction. Required for webhook endpoints to prevent abuse. |
| resend | 3.x | Transactional email | Magic link emails, billing notifications, integration failure alerts. Resend is the modern choice — developer-friendly API, React Email for templates. |
| react-email | 2.x | Email templating | Pairs with Resend. Write emails as React components. |
| @dnd-kit/core | 6.x | Drag-and-drop (V1 widget reorder) | The project spec has grid reorder in V1. @dnd-kit is the React-native DnD library, replaces react-beautiful-dnd (deprecated). Accessibility-first, no DOM manipulation hacks. |
| clsx + tailwind-merge | Latest | Conditional class merging | Required by shadcn/ui. clsx for conditional classes, tailwind-merge for resolving Tailwind conflicts. Already pulled in by shadcn/ui setup. |
| lucide-react | Latest | Icon library | shadcn/ui's default icon library. Consistent with the component system. |

### Integration-Specific Libraries

| Library | Purpose | Notes |
|---------|---------|-------|
| @shopify/shopify-api | 10.x | Shopify Admin API client | Official Shopify Node library. Handles OAuth flow, session management, webhook verification. |
| svix | Latest | Webhook verification utilities | For verifying Intelligems and other webhook signatures. Svix provides a unified webhook verification approach. |
| openai (future) | Latest | AI-ready for V3 | Not for V1 but note: the unified metric_events schema should be designed with vector embedding fields (pgvector) reserved for future AI layer. |

### Testing

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| Vitest | 2.x | Unit + integration tests | Fast, Vite-native, TypeScript-first. Replaces Jest for Next.js projects in 2025+. Better ESM support. |
| @testing-library/react | 16.x | Component testing | Standard React component test utilities. |
| Playwright | 1.x | E2E testing | Cross-browser E2E. Critical for auth flows and multi-store switching. |

### Code Quality

| Library | Version | Purpose |
|---------|---------|---------|
| ESLint | 9.x (flat config) | Linting. ESLint 9 uses flat config (eslint.config.mjs), not .eslintrc. |
| Prettier | 3.x | Code formatting |
| Husky + lint-staged | Latest | Pre-commit hooks |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| ORM | Drizzle | Prisma | Prisma's N+1 issues with complex analytical queries, historical connection pooling friction with Supabase serverless, less SQL-transparent |
| ORM | Drizzle | Prisma | Drizzle 2-3x faster for read-heavy workloads per benchmarks |
| Auth | Supabase Auth | Clerk | Clerk is excellent but adds $25+/mo at scale. Supabase Auth is included in Supabase pricing. Custom RBAC is needed either way, so Clerk's pre-built org features don't eliminate work here. |
| Auth | Supabase Auth | NextAuth.js | NextAuth v5 (Auth.js) is good but requires more custom code for the org/workspace model. Supabase Auth + Supabase RLS is a more integrated stack. |
| Background jobs | Inngest | Trigger.dev | Both are good. Inngest's step function model and existing Vercel integration tipped the decision. Trigger.dev has better local dev DX but requires Docker. |
| Background jobs | Inngest | Supabase Edge Functions | Edge Functions are for lighter work. Inngest handles retries, fan-out, and long-running jobs that Edge Functions' execution limits can't support. |
| Caching | Vercel KV | Upstash Redis direct | Vercel KV IS Upstash Redis — same product, slightly different SDK. Use @vercel/kv for Vercel-native DX. |
| Charts | Recharts | Victory | Recharts has better React ecosystem adoption. Victory is heavier. |
| Charts | Recharts | Chart.js | Chart.js is Canvas-based; Recharts is SVG/React. SVG is better for responsive dashboards and easier to style with Tailwind. |
| Charts | Recharts | Nivo | Nivo is excellent but heavier bundle. Recharts sufficient for V1. |
| Monitoring | Sentry | Datadog | Datadog is expensive and over-engineered for V1. Sentry generous free tier, excellent Next.js integration. |
| Email | Resend | SendGrid | Resend has better DX and lower pricing. SendGrid is enterprise-oriented overkill. |
| Email | Resend | Postmark | Both are solid. Resend is the newer standard with React Email templates. |

---

## Installation Order

```bash
# 1. Create Next.js 15 project
npx create-next-app@latest aloftly --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# 2. Core UI
npx shadcn@latest init
npx shadcn@latest add button card dialog dropdown-menu form input label select separator sheet skeleton table tabs toast

# 3. Database + Auth
npm install @supabase/supabase-js @supabase/ssr
npm install drizzle-orm postgres
npm install -D drizzle-kit

# 4. Validation + State
npm install zod @tanstack/react-query nuqs date-fns

# 5. Background jobs + Caching
npm install inngest @vercel/kv @upstash/ratelimit

# 6. Payments + Email
npm install stripe @stripe/stripe-js
npm install resend react-email @react-email/components

# 7. Integrations
npm install @shopify/shopify-api

# 8. UI Utilities
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install lucide-react clsx tailwind-merge class-variance-authority

# 9. Charts
npm install recharts

# 10. Monitoring
npm install @sentry/nextjs

# 11. Testing (dev)
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom
npm install -D playwright @playwright/test

# 12. Code quality (dev)
npm install -D prettier husky lint-staged @typescript-eslint/eslint-plugin
```

---

## Version Confidence Assessment

| Technology | Confidence | Notes |
|------------|------------|-------|
| Next.js 15 | MEDIUM | Next.js 15 is the current stable release; exact patch unknown without live npm check |
| TypeScript 5 | HIGH | TS 5.x is the current major |
| Tailwind v4 | MEDIUM | v4 released 2025; exact patch unknown. Breaking change from v3 — verify shadcn/ui compatibility |
| shadcn/ui | HIGH | Not versioned — always current by design |
| Supabase | HIGH | Managed platform — version irrelevant to consumer |
| Drizzle 0.38+ | MEDIUM | Active development, API has stabilized; exact version without npm check |
| @supabase/ssr | MEDIUM | Correct package; exact version needs npm verification |
| Inngest 3.x | MEDIUM | Major version correct; exact patch unknown |
| Vercel KV | HIGH | Managed service, version irrelevant |
| Recharts 2.x | HIGH | Stable at 2.x for 2+ years |
| Tremor | LOW | Status of free vs paid unclear — MUST VERIFY before building widget layer on top of it |
| React Query 5.x | HIGH | v5 is stable, widely adopted |
| Zod 3.x | HIGH | v3 is stable, widely adopted |
| @dnd-kit | HIGH | v6 is stable, the React DnD standard |
| Stripe | HIGH | Active development; check for latest major version |
| Sentry @sentry/nextjs | MEDIUM | App Router support confirmed; verify exact version |

---

## Critical Stack Flags for Roadmap

1. **Tremor verification required** before building any widget components. If free tier is insufficient, plan for custom chart components instead. This affects Phase 2 (Dashboard builder) scope.

2. **Tailwind v4 breaking changes** — if using v4, document migration from any v3 tutorials. The config paradigm is completely different. All AI-generated Tailwind code in the ecosystem is v3.

3. **@supabase/ssr not @supabase/auth-helpers** — every auth implementation must use the correct package. Tutorial debt is high here.

4. **Connection string dual-config for Drizzle** — pooled URL for API routes, direct URL for migrations. This must be in environment setup documentation.

5. **Inngest endpoint registration** — the `/api/inngest` endpoint must be deployed and registered with Inngest dashboard before any background jobs function. This is a common first-time setup blocker.

6. **Shopify API versioning** — Shopify rotates API versions quarterly. Pin to a specific version in the @shopify/shopify-api config (e.g., `ApiVersion.January25`) and document the upgrade cadence.

---

## Sources

- Next.js documentation and release history (training data, HIGH confidence for major version)
- Supabase documentation for @supabase/ssr migration guidance (training data, HIGH confidence — official deprecation of auth-helpers is well-documented)
- Drizzle ORM documentation for Supabase integration patterns (training data, MEDIUM confidence)
- Inngest documentation for step function patterns (training data, MEDIUM confidence)
- Tremor open-source to paid transition (training data, LOW confidence — verify current state)
- shadcn/ui component registry (training data, HIGH confidence — architecture is well-established)
- Tailwind v4 release (training data, MEDIUM confidence — released in 2025)
- @dnd-kit documentation (training data, HIGH confidence — deprecation of react-beautiful-dnd is well-documented)
- Shopify Partner documentation for API versioning (training data, HIGH confidence)
