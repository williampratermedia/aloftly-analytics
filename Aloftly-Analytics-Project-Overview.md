# Aloftly Analytics

## The Unified CRO Dashboard for Shopify

---

## Executive Summary

Aloftly Analytics is a SaaS platform that consolidates every on-site conversion rate optimization (CRO) data source into a single, actionable dashboard purpose-built for Shopify stores. It brings together heatmaps, A/B test results, customer surveys, support ticket sentiment, product reviews, and funnel analytics — data that CRO teams currently stitch together manually across 6-8 separate tools and spreadsheets.

The platform serves three primary audiences: Shopify store owners running their own CRO programs, CRO freelancers and agencies managing multiple client stores, and enterprise brands operating multiple storefronts.

---

## The Problem

Every Shopify CRO team today operates the same way: Microsoft Clarity open in one tab, GA4 in another, Intelligems results in a spreadsheet, KnoCommerce survey exports in Google Sheets, Gorgias tickets in a separate window, and Judge.me reviews in yet another. There is no single platform where a CRO team can see all of their on-site optimization data in one place.

Existing Shopify analytics tools (Triple Whale at $429+/mo, Polar Analytics at $720+/mo, Daasity, Lifetimely) are focused on marketing attribution and ad spend optimization. They answer "which ad channel is driving revenue?" Aloftly answers a fundamentally different question: "what's happening on my site and how do I improve it?"

AgencyAnalytics ($59-349+/mo) is the closest model, but it's horizontal — built for SEO, PPC, and social media agencies. Its Shopify and CRO integrations are surface-level at best.

---

## Market Differentiators

**1. CRO-Specific, Not Marketing-Attribution**
No existing Shopify analytics platform pulls in heatmap data, A/B test results, customer survey responses, or support ticket sentiment. These are the core data sources that drive on-site optimization decisions. Aloftly is the first platform to unify them.

**2. Shopify-Native Focus**
While AgencyAnalytics serves every type of digital agency, Aloftly is built exclusively for Shopify. Every integration, every pre-built template, every metric definition is designed around the Shopify CRO workflow. Deep Shopify integration (orders, products, customers, checkout analytics) comes built-in, not bolted-on.

**3. Negative Sentiment Surfacing**
A unique differentiator: Aloftly surfaces negative customer signals by pulling Gorgias support tickets filtered by negative sentiment and Judge.me reviews filtered by low ratings alongside conversion data. Seeing "1-star reviews spiked 40% this week" next to "cart abandonment is up 12%" tells a story no other tool is telling.

**4. AI-Ready Data Architecture**
All data from every source is normalized into a single unified schema from day one. This means when AI capabilities are layered on, the system can correlate heatmap engagement with survey responses with test results with conversion metrics — across sources, across stores — without any data pipeline rework.

**5. Agency-Friendly Multi-Tenancy**
Built from the ground up for agencies managing multiple client stores. Workspace isolation, role-based access control, client portals, and future white-labeling are structural features, not afterthoughts.

**6. Accessible Pricing**
Competitors charge $429-720+/month. Aloftly targets the $49-199/mo range, making unified CRO analytics accessible to mid-market stores and smaller agencies that are currently priced out of consolidated analytics.

---

## Target Customers

**Shopify Store Owners ($1M+ Revenue)**
Stores that have outgrown basic Shopify analytics and are actively running CRO programs — using heatmaps, running A/B tests, collecting surveys. They need one place to see what's working.

**CRO Freelancers & Agencies**
Professionals managing CRO for multiple Shopify stores. They need multi-store dashboards, client reporting, and eventually white-labeled portals. Currently cobbling together reports from 6+ different tool exports.

**Enterprise / Multi-Brand Operators**
Companies operating multiple Shopify storefronts (international markets, sub-brands, etc.) that need centralized visibility across all stores with role-based access for different teams.

---

## Core Features

### V1 (MVP) Features

**Unified CRO Dashboard**
A single interface displaying data from all connected integrations. Pre-built CRO views show the metrics that matter: conversion rates, funnel drop-offs, heatmap engagement, test results, survey insights, and customer sentiment — all in one place.

**Dashboard Builder (Widget Selector)**
Users select from a library of pre-built widgets (KPI cards, line charts, bar charts, tables, funnel visualizations) and arrange them in 1, 2, or 3 column layouts. Not a free-form drag-and-drop canvas — a structured widget picker that provides flexibility without the engineering complexity of a full grid builder. Widgets snap into place, can be reordered, and each widget has its own configuration panel for data source, time range, and display options.

**Pre-Built Dashboard Templates**
Admin-created templates for common CRO workflows: CRO Overview, Funnel Analysis, Customer Sentiment, A/B Test Performance, and more. New users get immediate value without building from scratch, and templates serve as best-practice guides.

**7 Core Integrations**
Each integration connects through a standardized adapter pattern, normalizing data into Aloftly's unified metric schema:

- **Shopify** (OAuth 2.0): Orders, revenue, AOV, conversion rates, product performance, customer data, checkout analytics. Webhooks for real-time order events plus daily full syncs.
- **Google Analytics 4** (OAuth 2.0): Sessions, traffic sources, bounce rates, page-level metrics, funnel steps, device breakdown. Hourly scheduled pulls via GA4 Data API.
- **Microsoft Clarity** (Bearer Token): Scroll depth, dead clicks, rage clicks, engagement time, session counts, broken down by device/browser/country. Daily scheduled pulls via Data Export API. Aggregate behavioral metrics, not raw heatmap images.
- **Intelligems** (Webhooks): Active experiments, test group assignments, conversion lift, revenue impact, statistical significance status. Webhook-driven (real-time inbound events) rather than pull-based — listens for experiment created, results updated, significance reached events.
- **KnoCommerce** (API Key): Survey responses, NPS scores, attribution data, customer feedback themes. Daily scheduled pulls.
- **Gorgias** (API Key): Support ticket volume, response times, CSAT scores, negative sentiment detection, ticket categorization. Webhooks for new tickets plus scheduled sync for historical data.
- **Judge.me** (API Key): Review ratings distribution, review volume, unapproved reviews queue, negative review alerts (3-star and below). Daily scheduled pulls.

**Multi-Store Support**
Users can connect multiple Shopify stores to a single account and view data per-store or across stores. Essential for agencies and multi-brand operators, and built into the data model from day one.

**Multi-Tenant Architecture**
Full organization → workspace → store hierarchy with role-based access control (owner, admin, member, viewer). Data isolation enforced at the database level. Agencies can organize client stores into separate workspaces with appropriate access controls.

**Basic Reporting**
Dashboard sharing via read-only links. Export dashboard views. Foundation for full reporting engine in later phases.

### V2 Features

**Full Grid Dashboard Builder**
Upgrade from the widget selector to a true drag-and-drop grid canvas with free-form positioning, widget resizing, and advanced layout options. Built on the V1 foundation without requiring rewrite.

**Scheduled Reports**
Automated PDF/email report generation on daily, weekly, or monthly schedules. Configured per-dashboard, sent to specified email addresses. Powered by background job processing.

**Client Portal**
Dedicated views for agency clients with limited navigation — they see their dashboards and reports without accessing the broader platform. Separate auth context using workspace-level viewer roles already built into the V1 access model.

**Advanced Widgets**
Cohort analysis, comparison overlays (this week vs. last week), multi-source correlation widgets (e.g., "heatmap scroll depth vs. conversion rate by page"), goal tracking with visual progress indicators.

**Dashboard Comments & Annotations**
Team members can leave comments on specific widgets or data points, and annotate timelines with events (site launch, sale started, new test deployed) to provide context for metric changes.

### V3 Features

**AI Analysis Layer**
Natural language queries against the unified data store: "What changed on the product page this week?" AI-generated weekly CRO summaries, automated test hypothesis generation based on correlated signals across data sources, anomaly detection and alerting. Enabled by the unified metric_events schema built in V1.

**White Label UI**
Custom branding (logo, colors, favicon), custom domain support, branded email reports. The database fields for white-label configuration are stored from V1 — this phase builds the rendering logic and settings UI to use them.

**Shopify App Store Listing**
Native Shopify App Store distribution with embedded app experience, Shopify OAuth flow, and app billing integration for seamless subscription management.

**Additional Integrations**
Hotjar, Heatmap.com, Lucky Orange (alternative heatmaps), Zendesk (alternative support), Yotpo (alternative reviews), Klaviyo (email performance), Rebuy/Bold (upsell performance). Each follows the same adapter pattern established in V1.

### V4+ Features (Long-Term Vision)

**Automated CRO Recommendations**
AI that doesn't just analyze but recommends: "Based on your heatmap data showing 68% of mobile users don't scroll past the fold, your survey data showing 'can't find product info' as the top complaint, and your A/B test showing longer PDPs convert 12% better — consider moving key product details above the fold."

**Cross-Store Benchmarking**
Anonymized, opt-in benchmarking across Aloftly's customer base. "Your cart abandonment rate is 15% higher than similar stores in your category."

**Custom Metric Builder**
Users define their own calculated metrics from any combination of data sources: "(Gorgias negative tickets / total orders) × 100 = complaint rate" displayed as a KPI card.

**API & Embeds**
Public API for customers to pull their unified data into external tools. Embeddable dashboard widgets for customer-facing use cases.

**Mobile App**
Lightweight mobile dashboard for checking KPIs on the go with push notification alerts for anomalies and significant test results.

---

## Technical Architecture

### Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 14+ (App Router) | Full-stack React, server components for performance, API routes for backend, deployed on Vercel |
| Language | TypeScript | End-to-end type safety across frontend, backend, database queries, and API integrations |
| Primary Database | PostgreSQL via Supabase | Managed Postgres with built-in auth, row-level security, real-time subscriptions, generous free tier |
| ORM | Drizzle | SQL-native, faster than Prisma for complex analytical queries, type-safe schema definitions |
| Auth | Supabase Auth + Custom RBAC | Supabase handles identity (email, OAuth), custom middleware handles org/workspace/role permissions |
| Background Jobs | Inngest | Serverless event-driven job processing, runs on Vercel, 50K events/mo free tier, handles all sync scheduling |
| Cache | Vercel KV (Redis) | API response caching, rate limit tracking, session management |
| UI Components | shadcn/ui + Tailwind CSS | Copy-paste component library with full styling control, not a black-box dependency |
| Charts | Recharts + Tremor | Recharts for custom visualizations, Tremor for pre-built dashboard-grade chart components |
| File Storage | Vercel Blob / Supabase Storage | Report PDFs, white-label assets, exported files |
| Hosting | Vercel Pro | Edge deployment, serverless functions, integrated with Next.js, $20/mo for commercial use |
| Monitoring | Sentry + Vercel Analytics | Error tracking, performance monitoring, usage analytics |

### Database Architecture

**Multi-Tenant Data Model**

The database schema is designed around a strict hierarchy that enforces data isolation and supports all future features without restructuring:

```
Organization (billing entity, white-label config)
  └── Workspace (logical grouping — agency client, brand division)
       └── Store (individual Shopify connection)
            └── Integration (connected tool — Clarity, Intelligems, etc.)
                 └── Metric Data (normalized events from all sources)
```

**Core Tables:**

- `organizations` — Top-level entity with billing info, plan tier, and `white_label_config` JSONB field (logo URL, brand colors, custom domain) stored from day one
- `workspaces` — Logical containers within an org, each with its own settings and member list
- `stores` — Individual Shopify store connections with encrypted access tokens and store metadata
- `integrations` — Each connected tool per store, storing encrypted credentials, sync frequency, last sync timestamp, and connection status
- `users` + `org_members` + `workspace_members` — Users belong to organizations with roles (owner/admin/member/viewer) and are assigned to specific workspaces with workspace-level roles
- `dashboards` — User-created or template dashboards with `layout` JSONB (column configuration, widget ordering), visibility controls (private/workspace/org), and template flag
- `widgets` — Individual visualizations with `query_config` JSONB (declarative data fetching: source, metric, time range, aggregation, filters) and `display_config` JSONB (chart type, colors, formatting)
- `metric_definitions` — Registry of all available metrics with display names, units, default aggregation methods, and categories

**The Critical Table: `metric_events`**

This is the AI-ready unified data layer. Every piece of data from every integration is normalized into a single schema:

```
metric_events:
  - id (UUID)
  - store_id (FK → stores)
  - source (enum: shopify, ga4, clarity, intelligems, knocommerce, gorgias, judgeme)
  - metric_name (string: "conversion_rate", "scroll_depth", "nps_score", etc.)
  - metric_value (numeric)
  - dimensions (JSONB: {"device": "mobile", "page": "/products/widget", "country": "US"})
  - recorded_at (timestamp)
  - raw_data (JSONB: original API response for traceability)
  - synced_at (timestamp)
```

This table is partitioned by `(store_id, recorded_at)` for query performance. The unified schema means:

1. Any widget can query any combination of sources with the same query pattern
2. AI can correlate signals across all data sources without custom data pipelines per integration
3. New integrations just need to write data into this same format
4. Time-series queries work identically regardless of data origin

**Row-Level Security (RLS)**

Supabase RLS policies enforce data isolation at the database level. Users are automatically filtered to only see data belonging to their organization and assigned workspaces. This isn't application-level filtering that can be bypassed — it's database-enforced.

**Sync Tracking:**

The `sync_jobs` table tracks every data synchronization operation with status, cursor position (for incremental syncing), error details, and duration metrics. This enables reliable resume-on-failure and provides operational visibility into integration health.

### Integration Architecture

**Standardized Adapter Pattern**

Every integration implements the same interface:

```
connect()          — Initiate OAuth or store API credentials
disconnect()       — Clean up credentials and stop syncing
testConnection()   — Verify credentials are still valid
sync()             — Pull latest data and normalize to metric_events
getAvailableMetrics() — Return list of metrics this integration provides
```

One file per integration in `/lib/integrations/[provider]/`. Adding a new integration means implementing this interface — the sync engine, widget system, and dashboard builder all work automatically with any data that lands in `metric_events`.

**Data Flow Pipeline:**

```
Trigger (Inngest cron schedule or inbound webhook)
  → Fetch (adapter calls provider API, handles pagination and rate limits)
    → Transform (normalize response to metric_events schema)
      → Load (batch insert into PostgreSQL)
        → Notify (invalidate cache, broadcast real-time update to connected dashboards)
```

**Webhook Ingestion (for Intelligems, Gorgias, Shopify):**

Incoming webhooks hit Next.js API routes at `/api/webhooks/[provider]`. The route validates the webhook signature, creates an Inngest event, and returns 200 immediately. Inngest processes the event asynchronously — this prevents webhook timeouts and enables automatic retries on failure.

**Credential Security:**

- OAuth tokens encrypted via Supabase Vault (database-level encryption)
- API keys encrypted at application level before storage
- Webhook secrets stored in Vercel environment variables
- Frontend never sees raw credentials — all API calls to external services happen server-side

### Metrics Service Abstraction

Widgets never query the database directly. All data access goes through a metrics service layer:

```
metricsService.query({
  storeId: "...",
  sources: ["clarity", "ga4"],
  metrics: ["scroll_depth", "bounce_rate"],
  timeRange: { start: "2025-01-01", end: "2025-01-31" },
  dimensions: ["device"],
  aggregation: "avg"
})
```

This abstraction is critical for the future: when the platform outgrows PostgreSQL for time-series queries (typically when dashboard queries exceed 2-3 seconds), the backend can be swapped to ClickHouse Cloud without changing a single widget or dashboard component. V1 uses PostgreSQL with materialized views for common aggregations. The migration to a dedicated analytics database happens transparently behind this service layer.

### Dual Database Strategy (Future)

**V1:** PostgreSQL handles everything — application state (users, dashboards, configs) and metric data. Materialized views pre-compute common dashboard queries.

**V2+ (when needed):** PostgreSQL continues handling application state. ClickHouse Cloud handles time-series metric data (billions of data points, sub-second aggregation queries). The metrics service abstraction makes this a backend swap, not a rewrite.

Trigger for migration: dashboard queries consistently exceeding 2-3 seconds, or metric_events table exceeding ~50M rows.

---

## Infrastructure & Costs

### Phase 1: MVP (0-20 stores)

| Service | Cost | Notes |
|---------|------|-------|
| Vercel Pro | $20/mo | Required for commercial use |
| Domain | ~$7/mo | aloftly.com or similar |
| Supabase | Free | Up to 500MB, 50K auth users |
| Inngest | Free | 50K events/mo |
| Sentry | Free | 5K errors/mo |
| **Total** | **~$45/mo** | |

### Phase 2: Growth (20-100 stores)

| Service | Cost | Notes |
|---------|------|-------|
| Vercel Pro | $20/mo | |
| Supabase Pro | $25/mo | 8GB storage, daily backups |
| Inngest Paid | $50/mo | 500K events/mo |
| Vercel KV | $15/mo | Redis caching |
| Monitoring | $10/mo | Sentry paid tier |
| **Total** | **~$120-200/mo** | |

### Phase 3: Scale (100+ stores)

| Service | Cost | Notes |
|---------|------|-------|
| Previous stack | ~$120/mo | |
| ClickHouse Cloud | $100-200/mo | Time-series analytics DB |
| Higher Vercel tier | $50+/mo | More serverless execution |
| Supabase scaling | $50+/mo | Larger database |
| **Total** | **~$300-500/mo** | |

---

## Revenue Model

**Tiered SaaS Pricing (Projected)**

| Plan | Price | Target | Includes |
|------|-------|--------|----------|
| Starter | $49/mo | Solo store owners | 1 store, 5 integrations, basic dashboards |
| Professional | $99/mo | Growing stores, freelancers | 3 stores, all integrations, full dashboard builder, scheduled reports |
| Agency | $199/mo | Agencies | 10 stores, client portals, team roles, priority support |
| Enterprise | Custom | Multi-brand operators | Unlimited stores, white labeling, custom integrations, SLA |

**Revenue Milestones:**

- Break-even on infrastructure: ~10 paying customers at Professional tier
- $10K MRR: ~75 customers (blended average)
- $50K MRR: ~350 customers (blended average)

At AgencyAnalytics-comparable pricing, 200-300 paying customers represents meaningful recurring revenue.

---

## Build Plan

### Phase 1: Foundation (Weeks 1-4)

**Goal:** Core platform with Shopify data flowing into dashboards.

- Next.js project scaffold with TypeScript, Tailwind, shadcn/ui
- Supabase setup: auth, database, RLS policies
- Drizzle ORM schema: organizations, workspaces, users, stores, integrations, metric_events, dashboards, widgets, metric_definitions, sync_jobs
- Multi-tenant auth flow: signup → create org → create workspace
- Shopify OAuth integration + first adapter implementation
- First Inngest sync job: pull Shopify orders/revenue into metric_events
- Basic data display: order metrics table, KPI cards showing revenue/AOV/conversion rate
- Deployment to Vercel with CI/CD

**Deliverable:** A working app where a user can sign up, connect their Shopify store, and see their order data in a basic dashboard.

### Phase 2: Dashboard Engine (Weeks 5-8)

**Goal:** Users can build custom dashboards with multi-source data.

- Widget framework: KPI card, line chart, bar chart, table, funnel visualization components
- Widget configuration panel: data source selector, metric picker, time range, display options
- Dashboard builder: 1/2/3 column layout selector, widget picker sidebar, drag-to-reorder within columns
- Dashboard persistence: save/load layouts, duplicate dashboards
- Pre-built templates: CRO Overview, Funnel Analysis, Traffic Breakdown
- GA4 integration adapter (OAuth 2.0, hourly sync)
- Microsoft Clarity integration adapter (bearer token, daily sync)
- Multi-source widgets: display data from different integrations side-by-side

**Deliverable:** Users can connect Shopify + GA4 + Clarity and build custom dashboards showing cross-source CRO data.

### Phase 3: Full CRO Suite (Weeks 9-12)

**Goal:** All 7 integrations live, CRO-specific features, beta-ready.

- Intelligems webhook receiver + experiment card widget (active tests, significance status, revenue lift)
- KnoCommerce adapter + survey summary widget (NPS trend, response themes, attribution breakdown)
- Gorgias adapter + support widgets (ticket volume, CSAT trend, negative sentiment feed)
- Judge.me adapter + review widgets (rating distribution, review volume trend, negative review alerts)
- Dashboard sharing via read-only links (unique URL, no auth required, view-only)
- Store switcher: toggle between connected stores or view aggregate data
- Integration health monitoring: connection status, last sync time, error indicators
- Beta launch with 10-20 users from existing network

**Deliverable:** Complete MVP with all 7 integrations, customizable dashboards, and multi-store support. Ready for beta feedback.

### Phase 4: Polish & Monetize (Weeks 13-16)

**Goal:** Production-ready with billing, reporting, and client features.

- PDF report generation from dashboards
- Scheduled email reports via Inngest cron jobs
- Client portal: workspace-level viewer role with simplified navigation
- Stripe billing integration: plan selection, usage tracking, upgrade/downgrade flows
- Performance optimization: query caching with Vercel KV, materialized views for common aggregations, widget lazy loading
- Onboarding flow: guided setup wizard, integration connection prompts
- Error handling hardening: retry logic, graceful degradation when integrations are down

**Deliverable:** Production-ready platform with billing. Ready for paid customers.

---

## Future-Proofing Decisions (Built Now, Used Later)

These architectural decisions are made in V1 specifically so that future features don't require rewrites:

**1. Unified `metric_events` Schema**
Every data point from every source goes into the same table format. This is the foundation for AI analysis — when the AI layer is added, it can query correlations across all data sources with simple SQL. No ETL pipeline rework needed.

**2. `white_label_config` JSONB on Organizations**
The database field exists from day one storing logo URL, brand colors, custom domain, and favicon URL. V1 doesn't render these values — but when white labeling ships, it's a frontend feature, not a database migration.

**3. Multi-Tenant Hierarchy (org → workspace → store)**
Even if V1 beta users only have one store, the data model supports the full agency use case. Adding client portals later is a UI layer on top of existing workspace permissions, not a restructuring of how data is stored.

**4. Integration Adapter Pattern**
Every integration implements the same interface. Adding Hotjar, Yotpo, Klaviyo, or any future integration means creating one new adapter file. The sync engine, widget system, and dashboard builder automatically work with any data that follows the pattern.

**5. Metrics Service Abstraction**
Widgets talk to a service layer, not directly to the database. When PostgreSQL is replaced with ClickHouse for analytics queries, zero frontend code changes. The service layer swaps its backend implementation.

**6. `raw_data` JSONB on `metric_events`**
The original API response is stored alongside the normalized metric. If the AI layer later needs data points that weren't extracted in the initial normalization, the raw data is available for reprocessing without re-syncing from the source API.

**7. `dimensions` JSONB for Flexible Filtering**
Rather than creating separate columns for device, country, page, browser, etc., dimensions are stored as JSONB. This means any integration can include any arbitrary dimensions without schema migrations, and the AI layer can discover and correlate dimensions automatically.

**8. Feature Flags via JSONB on Organizations**
A `feature_flags` JSONB column on the organizations table enables per-customer feature gating without code deploys. Beta features, plan-tier features, and gradual rollouts all work through this mechanism.

**9. `query_config` and `display_config` on Widgets**
Widget data fetching is declarative (stored as JSON config), not hardcoded. This means the V2 AI can generate widget configurations programmatically — "show me scroll depth vs. conversion rate by device" becomes a JSON config object, not custom code.

**10. Inngest Event-Driven Architecture**
All background processing goes through Inngest events. This means adding AI analysis as a post-sync step is just adding another event handler — "after sync completes, run AI analysis on new data." No changes to existing sync logic.

---

## Project Structure

```
aloftly/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── signup/
│   │   └── callback/          # OAuth callbacks
│   ├── (dashboard)/
│   │   └── [orgSlug]/
│   │       └── [workspaceSlug]/
│   │           ├── dashboards/
│   │           │   ├── [dashboardId]/
│   │           │   └── new/
│   │           ├── stores/
│   │           │   └── [storeId]/
│   │           ├── integrations/
│   │           │   └── [integrationId]/
│   │           └── settings/
│   │               ├── team/
│   │               ├── billing/
│   │               └── white-label/   # Future
│   └── api/
│       ├── webhooks/
│       │   ├── shopify/
│       │   ├── intelligems/
│       │   └── gorgias/
│       ├── integrations/
│       │   └── [provider]/
│       │       ├── connect/
│       │       └── sync/
│       ├── metrics/
│       │   └── query/
│       └── reports/
│           └── generate/
├── components/
│   ├── widgets/
│   │   ├── kpi-card.tsx
│   │   ├── line-chart.tsx
│   │   ├── bar-chart.tsx
│   │   ├── data-table.tsx
│   │   ├── funnel.tsx
│   │   └── widget-config-panel.tsx
│   ├── dashboard/
│   │   ├── dashboard-builder.tsx
│   │   ├── column-layout.tsx
│   │   ├── widget-picker.tsx
│   │   └── template-selector.tsx
│   ├── integrations/
│   │   ├── connection-card.tsx
│   │   ├── oauth-button.tsx
│   │   └── sync-status.tsx
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── db/
│   │   ├── schema.ts          # Drizzle schema definitions
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── integrations/
│   │   ├── types.ts           # Shared adapter interface
│   │   ├── shopify/
│   │   │   ├── adapter.ts
│   │   │   ├── transform.ts
│   │   │   └── types.ts
│   │   ├── ga4/
│   │   ├── clarity/
│   │   ├── intelligems/
│   │   ├── gorgias/
│   │   ├── knocommerce/
│   │   └── judgeme/
│   ├── metrics/
│   │   ├── service.ts         # Metrics service abstraction
│   │   ├── aggregations.ts
│   │   └── definitions.ts
│   ├── inngest/
│   │   ├── client.ts
│   │   ├── sync-functions.ts
│   │   └── report-functions.ts
│   └── auth/
│       ├── middleware.ts
│       ├── rbac.ts
│       └── session.ts
└── drizzle.config.ts
```

---

## Competitive Landscape

| Platform | Focus | Shopify CRO Data | Pricing | Limitation for CRO Teams |
|----------|-------|-------------------|---------|--------------------------|
| Triple Whale | Ad attribution, ROAS | No heatmaps, no A/B tests, no surveys | $429+/mo | Marketing-focused, not CRO |
| Polar Analytics | Marketing BI, custom metrics | No CRO tool integrations | $720+/mo | Requires analyst-level expertise |
| AgencyAnalytics | Horizontal agency reporting | Surface-level Shopify, no CRO tools | $59-349/mo | Built for SEO/PPC agencies, not CRO |
| Daasity / Peel | DTC analytics, LTV, cohorts | No behavioral or CRO data | Varies | Product analytics, not CRO |
| Shopify Native | Basic store analytics | Only Shopify data | Included | No third-party integrations |
| **Aloftly** | **Unified CRO analytics** | **All 7 CRO data sources** | **$49-199/mo** | **V1: No free-form grid builder** |

---

## Key Risks & Mitigations

**Integration Dependency**
Risk: Third-party APIs change or get deprecated.
Mitigation: Adapter pattern isolates each integration. Raw data stored in JSONB provides a replay buffer. No single integration failure breaks the platform.

**AI-Driven Development Timeline**
Risk: Building a multi-tenant SaaS with 7 integrations using AI-assisted development takes longer than estimated.
Mitigation: Phased approach ensures a usable product ships at each phase. Phase 1 is valuable even without all 7 integrations. Beta testing starts at Phase 3, not Phase 4.

**"Good Enough" Workflow Competition**
Risk: Potential customers currently solve this with Google Sheets, Notion, and Looker Studio (free/near-free).
Mitigation: Aloftly needs to be dramatically better than the cobbled-together workflow. Pre-built CRO templates, automatic syncing, and cross-source correlation provide value that manual processes can't match.

**Market Size**
Risk: Niche market (Shopify CRO teams) may limit total addressable market.
Mitigation: The Shopify ecosystem includes 2M+ active stores with CRO becoming standard practice for stores above $1M revenue. 200-300 paying customers represents meaningful revenue, and the market is growing.

---

## Summary of Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Dashboard builder approach | Widget selector (not free-form grid) | 80% of user value at 20% engineering cost. Upgrade to full grid in V2. |
| Multi-tenancy | Built into V1 schema | Impossible to retrofit. Agency/multi-store customers need this from beta. |
| White labeling | Database fields in V1, UI in V3 | Zero cost to store config fields now. Avoids schema migration later. |
| AI readiness | Unified metric_events table | Single normalized schema enables cross-source AI analysis without pipeline rework. |
| Analytics database | PostgreSQL V1, ClickHouse V2+ | Metrics service abstraction enables backend swap without frontend changes. |
| Integration approach | Standardized adapter pattern | One interface per integration. New integrations are additive, not structural. |
| Background jobs | Inngest (event-driven) | Serverless, generous free tier, natural fit for adding AI post-processing steps. |
| Auth | Supabase Auth + custom RBAC | Managed identity with flexible org/workspace-level permissions. |

---

*Aloftly Analytics — One dashboard. Every CRO signal. Built for Shopify.*
