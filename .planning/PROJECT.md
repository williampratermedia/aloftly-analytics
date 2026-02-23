# Aloftly Analytics

## What This Is

A SaaS platform that consolidates every on-site CRO data source into a single, actionable dashboard purpose-built for Shopify stores. It brings together heatmaps, A/B test results, customer surveys, support ticket sentiment, product reviews, and funnel analytics — data that CRO teams currently stitch together manually across 6-8 separate tools and spreadsheets. Serves solo Shopify store owners, CRO freelancers/agencies managing multiple client stores, and enterprise brands with multiple storefronts.

## Core Value

One unified dashboard where a CRO team can see all of their on-site optimization data — from every tool, every store — in one place. If nothing else works, this must.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

- [ ] Multi-tenant architecture (org → workspace → store hierarchy with RBAC)
- [ ] Multi-store support (connect multiple Shopify stores per account)
- [ ] Supabase Auth with email/password + magic link
- [ ] Dashboard builder with widget picker, 1/2/3 column layouts, reorder, per-widget config
- [ ] Pre-built dashboard templates for common CRO workflows
- [ ] 7 core integrations via standardized adapter pattern: Shopify, GA4, Clarity, Intelligems, KnoCommerce, Gorgias, Judge.me
- [ ] Unified metric_events schema normalizing all integration data
- [ ] Metrics service abstraction layer (widgets never query DB directly)
- [ ] Widget library: KPI cards, line charts, bar charts, tables, funnel visualizations
- [ ] Integration health monitoring (connection status, last sync, error indicators)
- [ ] Mixed data freshness: webhooks real-time where available, scheduled pulls for the rest
- [ ] Basic reporting: dashboard sharing via read-only links, export views
- [ ] Subscription billing via Stripe ($49/$99/$199/custom tiers)
- [ ] Onboarding flow with guided setup wizard
- [ ] Production-grade error handling, retry logic, graceful degradation

### Out of Scope

- Free-form drag-and-drop grid builder — V2 (widget selector provides 80% of value at 20% engineering cost)
- AI analysis layer — V3 (data architecture is AI-ready from V1)
- White label UI rendering — V3 (database fields stored in V1, rendering logic later)
- Shopify App Store listing — V3
- Mobile app — V4+
- Cross-store benchmarking — V4+
- Custom metric builder — V4+
- Scheduled PDF/email reports — V2
- Client portal — V2 (workspace viewer roles built in V1 enable this)
- Dashboard comments & annotations — V2

## Context

**The Problem:** Every Shopify CRO team operates with Microsoft Clarity in one tab, GA4 in another, Intelligems results in a spreadsheet, KnoCommerce surveys in Google Sheets, Gorgias tickets in a separate window, and Judge.me reviews in yet another. No single platform shows all on-site optimization data together.

**Competitive Landscape:** Existing Shopify analytics tools (Triple Whale $429+/mo, Polar Analytics $720+/mo, Daasity, Lifetimely) focus on marketing attribution and ad spend. AgencyAnalytics ($59-349/mo) is the closest model but built horizontally for SEO/PPC agencies. Aloftly is CRO-specific and Shopify-native at $49-199/mo.

**Key Differentiators:**
- CRO-specific, not marketing-attribution (first to unify heatmaps, A/B tests, surveys, support sentiment)
- Shopify-native focus (every integration, template, and metric designed around Shopify CRO workflow)
- Negative sentiment surfacing (Gorgias support + Judge.me reviews alongside conversion data)
- AI-ready data architecture (unified metric_events schema from day one)
- Agency-friendly multi-tenancy (structural, not bolted on)
- Accessible pricing ($49-199/mo vs competitors at $429-720+/mo)

**Target Customers:**
- Shopify store owners ($1M+ revenue) actively running CRO programs
- CRO freelancers & agencies managing multiple client stores
- Enterprise/multi-brand operators with multiple Shopify storefronts

**Revenue Model:** Subscription tiers — Starter ($49/mo, 1 store), Professional ($99/mo, 3 stores), Agency ($199/mo, 10 stores), Enterprise (custom, unlimited). Break-even at ~10 customers on Professional tier.

## Constraints

- **Tech Stack**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui, Supabase (Postgres + Auth), Drizzle ORM, Inngest for background jobs, Vercel KV (Redis) for caching, Recharts + Tremor for charts, Vercel for hosting — mostly locked, flexible where justified
- **Multi-tenancy**: Every table scoped to org_id, every store scoped to store_id within an org — non-negotiable from day one
- **Data isolation**: Supabase RLS enforced at database level, not application level
- **Credential security**: OAuth tokens via Supabase Vault, API keys encrypted at application level, all integration API calls server-side only
- **Integration pattern**: Standardized adapter interface (connect, disconnect, testConnection, sync, getAvailableMetrics) — one file per integration in /lib/integrations/[provider]/
- **Design direction**: Clean SaaS (Stripe/Notion-inspired), light and spacious, with dark mode support
- **Budget**: Infrastructure starts ~$45/mo, scales to ~$120-200/mo at 20-100 stores
- **Audience**: Both solo store owners and agencies equally from V1 launch

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Widget selector over free-form grid | 80% of user value at 20% engineering cost; upgrade to full grid in V2 | — Pending |
| Multi-tenancy in V1 schema | Impossible to retrofit; agencies and multi-store customers need this from beta | — Pending |
| White-label config fields stored in V1 | Zero cost to store JSONB fields now; avoids schema migration when V3 ships | — Pending |
| Unified metric_events table | Single normalized schema enables cross-source AI analysis without pipeline rework | — Pending |
| PostgreSQL V1, ClickHouse V2+ | Metrics service abstraction enables backend swap without frontend changes; migrate when queries > 2-3s or > 50M rows | — Pending |
| Inngest for background jobs | Serverless, event-driven, generous free tier, natural fit for adding AI post-processing steps | — Pending |
| Supabase Auth + custom RBAC | Managed identity with flexible org/workspace-level permissions via custom middleware | — Pending |
| Drizzle ORM over Prisma | SQL-native, faster for complex analytical queries, type-safe schema definitions | — Pending |
| All 7 integrations in V1 | Core value prop is the unified view across all sources; phasing would weaken the pitch | — Pending |
| Clean SaaS design direction | Light, spacious, Stripe/Notion-inspired; dark mode as supported option | — Pending |
| Mixed data freshness | Webhooks real-time where available (Intelligems, Gorgias, Shopify), scheduled pulls for the rest | — Pending |

---
*Last updated: 2026-02-23 after initialization*
