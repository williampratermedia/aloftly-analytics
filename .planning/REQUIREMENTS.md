# Requirements: Aloftly Analytics

**Defined:** 2026-02-23
**Core Value:** One unified dashboard where a CRO team can see all of their on-site optimization data — from every tool, every store — in one place.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [x] **FOUN-01**: Multi-tenant database schema with org → workspace → store hierarchy and RLS on all tables
- [ ] **FOUN-02**: Supabase Auth with email/password and magic link sign-in
- [ ] **FOUN-03**: Role-based access control (owner, admin, member, viewer) with org and workspace-level roles
- [ ] **FOUN-04**: RLS policies using JWT claims (org_id injected via custom claims, no subqueries)
- [ ] **FOUN-05**: Typed Supabase client wrappers — `getUserClient(session)` for user reads, `getServiceClient()` restricted to ingestion only
- [x] **FOUN-06**: `metric_events` unified table with typed indexed columns for cross-source queryable fields and JSONB for source-specific display data, partitioned by (store_id, recorded_at)
- [x] **FOUN-07**: `metric_definitions` registry table with display names, units, aggregation methods, and categories — drives widget picker and future AI layer
- [x] **FOUN-08**: `sync_jobs` tracking table with status, cursor position for incremental syncing, error details, and duration metrics
- [x] **FOUN-09**: Encrypted credential storage via Supabase Vault for OAuth tokens and API keys
- [x] **FOUN-10**: `white_label_config` JSONB field on organizations table (stored from day one, UI deferred)
- [x] **FOUN-11**: `feature_flags` JSONB field on organizations table (stored from day one, enforcement later)
- [x] **FOUN-12**: `plan_tier` column on organizations table (billing enforcement added later, field exists from day one)
- [x] **FOUN-13**: Next.js 15 App Router project scaffold with TypeScript, Tailwind CSS v4, shadcn/ui, Drizzle ORM
- [x] **FOUN-14**: Deployment to Vercel with CI/CD pipeline

### Integration Infrastructure

- [ ] **INFR-01**: Standardized integration adapter interface (connect, disconnect, testConnection, sync, getAvailableMetrics)
- [ ] **INFR-02**: Inngest client setup with event types, /api/inngest endpoint, and step function pipeline (fetch → transform → upsert → update health)
- [ ] **INFR-03**: Inngest `onFailure` handlers on every sync function that update integration connection status
- [ ] **INFR-04**: Webhook receiver framework with HMAC signature verification utility, `webhook_events` deduplication table, and immediate 200 return with async Inngest processing
- [ ] **INFR-05**: Integration health tracking — `last_sync_at`, `last_sync_status`, error details on integration_connections table
- [ ] **INFR-06**: Metrics service abstraction layer — widgets query the service, never raw SQL; enforces org context; manages Vercel KV caching (5-15 min TTL); enables future ClickHouse swap
- [ ] **INFR-07**: Per-store rate limit throttling in Inngest sync jobs

### Shopify Integration

- [ ] **SHOP-01**: Shopify OAuth 2.0 flow with CSRF state parameter validation and encrypted token storage in Vault
- [ ] **SHOP-02**: Shopify webhook receiver for real-time order events with signature verification
- [ ] **SHOP-03**: Shopify data sync — orders, revenue, AOV, conversion rates, product performance, customer data
- [ ] **SHOP-04**: Shopify daily full sync via Inngest cron with incremental cursor-based pagination

### GA4 Integration

- [ ] **GA4-01**: Google OAuth 2.0 flow with token refresh and encrypted storage
- [ ] **GA4-02**: GA4 data sync — sessions, traffic sources, bounce rates, page-level metrics, device breakdown
- [ ] **GA4-03**: Hourly scheduled sync via GA4 Data API through Inngest

### Clarity Integration

- [ ] **CLAR-01**: Microsoft Clarity bearer token connection flow
- [ ] **CLAR-02**: Clarity data sync — scroll depth, dead clicks, rage clicks, engagement time, session counts by device/browser/country
- [ ] **CLAR-03**: Daily scheduled sync via Clarity Data Export API through Inngest

### Intelligems Integration

- [ ] **INTL-01**: Intelligems webhook receiver at /api/webhooks/intelligems (webhook-only, no REST polling)
- [ ] **INTL-02**: Intelligems data ingestion — active experiments, test group assignments, conversion lift, revenue impact, statistical significance status

### KnoCommerce Integration

- [ ] **KNOC-01**: KnoCommerce API key connection flow
- [ ] **KNOC-02**: KnoCommerce data sync — survey responses, NPS scores, attribution data, customer feedback themes
- [ ] **KNOC-03**: Daily scheduled sync through Inngest

### Gorgias Integration

- [ ] **GORG-01**: Gorgias API key connection flow with webhook registration
- [ ] **GORG-02**: Gorgias webhook receiver for real-time new ticket events
- [ ] **GORG-03**: Gorgias data sync — support ticket volume, response times, CSAT scores, negative sentiment detection, ticket categorization
- [ ] **GORG-04**: Scheduled sync for historical data plus webhook-driven incremental updates

### Judge.me Integration

- [ ] **JUDG-01**: Judge.me API key connection flow
- [ ] **JUDG-02**: Judge.me data sync — review ratings distribution, review volume, negative review alerts (3-star and below)
- [ ] **JUDG-03**: Daily scheduled sync through Inngest

### Dashboard & Widgets

- [ ] **DASH-01**: Dashboard builder with 1, 2, or 3 column layout selector
- [ ] **DASH-02**: Widget picker sidebar — browse available widgets by category with preview
- [ ] **DASH-03**: Widget reorder within columns via drag-and-drop (@dnd-kit)
- [ ] **DASH-04**: Per-widget configuration panel — data source, metric, time range, aggregation, display options
- [ ] **DASH-05**: Dashboard layout persistence in Supabase (save, load, duplicate dashboards)
- [ ] **DASH-06**: Pre-built dashboard templates — minimum 3: CRO Audit, PDP Audit, Agency Client View
- [ ] **DASH-07**: KPI card widget with metric value, comparison to previous period, trend indicator
- [ ] **DASH-08**: Line chart widget with multi-series support and time range
- [ ] **DASH-09**: Bar chart widget with category and time-based views
- [ ] **DASH-10**: Data table widget with sortable columns and pagination
- [ ] **DASH-11**: Funnel visualization widget showing drop-off across stages
- [ ] **DASH-12**: Date range picker with presets (today, 7d, 30d, custom) and comparison period toggle
- [ ] **DASH-13**: Multi-store switcher in navigation — view data per-store or across stores
- [ ] **DASH-14**: Integration health indicators in UI — connection status badges, last sync time, error states with retry action
- [ ] **DASH-15**: Self-contained widget error handling — failure in one widget does not affect others; each widget has independent loading and error states

### Product Completion

- [ ] **PROD-01**: Stripe subscription billing with 4-tier model (Starter/Professional/Agency/Enterprise)
- [ ] **PROD-02**: Plan limit enforcement — store count, integration count per tier
- [ ] **PROD-03**: Read-only dashboard sharing via unique URL with token-based auth bypass
- [ ] **PROD-04**: CSV export at widget and dashboard level
- [ ] **PROD-05**: Onboarding wizard — guided setup for org creation, first store connection, first integration
- [ ] **PROD-06**: Error handling with retry UI — "Re-sync" buttons, connection troubleshooter
- [x] **PROD-07**: Sentry error tracking and Vercel Analytics instrumentation

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Reporting & Collaboration

- **REPT-01**: Scheduled PDF/email report generation (daily/weekly/monthly)
- **REPT-02**: Dashboard comments and annotations on widgets/data points
- **REPT-03**: Timeline annotations for events (sale started, test deployed, site launch)

### Client Portal

- **CLNT-01**: Dedicated client views with simplified navigation for agency clients
- **CLNT-02**: Workspace-level viewer role with scoped access (building on V1 RBAC)

### Advanced Dashboard

- **ADVD-01**: Full grid drag-and-drop dashboard builder with free-form positioning and widget resizing
- **ADVD-02**: Comparison overlay widgets (this week vs last week)
- **ADVD-03**: Multi-source correlation widgets (e.g., scroll depth vs conversion rate by page)
- **ADVD-04**: Goal tracking widgets with visual progress indicators

### White Label

- **WHTL-01**: White-label UI rendering — custom logo, colors, favicon (config fields stored in V1)
- **WHTL-02**: Custom domain support for white-labeled portals

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Marketing attribution modeling | Triple Whale's territory — years of data science investment; competing here is a losing war |
| Ad spend analytics (Facebook, Google Ads) | AgencyAnalytics' lane; Shopify revenue context provides the conversion-to-revenue bridge |
| AI analysis layer in V1 | Requires training data volume V1 can't support; metric_events schema is AI-ready for V3 |
| Session recording viewer (embedded) | Clarity has deeply engineered session replay; surface stats and link out instead |
| Native A/B test creation | Intelligems' job; ingest and display results, don't build a competing testing tool |
| Real-time heatmap rendering | Live overlays require rendering engine complexity; sync summary data via Data Export API |
| Predictive analytics (churn, LTV) | Requires ML models and Shopify order history at scale; post-V2 |
| Mobile app | Analytics is a desktop workflow for CRO audience; responsive web in V1, native app V4+ |
| Custom metric builder | Requires metric DSL, validation, display logic; offer fixed metric library in V1, custom builder V4+ |
| Cross-store benchmarking | Requires anonymized aggregate data, privacy controls, statistical significance; V4+ |
| Shopify App Store listing | App Store review process, partner requirements, billing integration; direct SaaS first, App Store V3 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUN-01 | Phase 1 | Pending |
| FOUN-02 | Phase 1 | Pending |
| FOUN-03 | Phase 1 | Pending |
| FOUN-04 | Phase 1 | Pending |
| FOUN-05 | Phase 1 | Pending |
| FOUN-06 | Phase 1 | Pending |
| FOUN-07 | Phase 1 | Pending |
| FOUN-08 | Phase 1 | Pending |
| FOUN-09 | Phase 1 | Pending |
| FOUN-10 | Phase 1 | Pending |
| FOUN-11 | Phase 1 | Pending |
| FOUN-12 | Phase 1 | Pending |
| FOUN-13 | Phase 1 | Complete |
| FOUN-14 | Phase 1 | Complete |
| PROD-07 | Phase 1 | Complete |
| INFR-01 | Phase 2 | Pending |
| INFR-02 | Phase 2 | Pending |
| INFR-03 | Phase 2 | Pending |
| INFR-04 | Phase 2 | Pending |
| INFR-05 | Phase 2 | Pending |
| INFR-06 | Phase 2 | Pending |
| INFR-07 | Phase 2 | Pending |
| SHOP-01 | Phase 2 | Pending |
| SHOP-02 | Phase 2 | Pending |
| SHOP-03 | Phase 2 | Pending |
| SHOP-04 | Phase 2 | Pending |
| GA4-01 | Phase 3 | Pending |
| GA4-02 | Phase 3 | Pending |
| GA4-03 | Phase 3 | Pending |
| INTL-01 | Phase 3 | Pending |
| INTL-02 | Phase 3 | Pending |
| GORG-01 | Phase 3 | Pending |
| GORG-02 | Phase 3 | Pending |
| GORG-03 | Phase 3 | Pending |
| GORG-04 | Phase 3 | Pending |
| CLAR-01 | Phase 3 | Pending |
| CLAR-02 | Phase 3 | Pending |
| CLAR-03 | Phase 3 | Pending |
| KNOC-01 | Phase 3 | Pending |
| KNOC-02 | Phase 3 | Pending |
| KNOC-03 | Phase 3 | Pending |
| JUDG-01 | Phase 3 | Pending |
| JUDG-02 | Phase 3 | Pending |
| JUDG-03 | Phase 3 | Pending |
| DASH-01 | Phase 4 | Pending |
| DASH-02 | Phase 4 | Pending |
| DASH-03 | Phase 4 | Pending |
| DASH-04 | Phase 4 | Pending |
| DASH-05 | Phase 4 | Pending |
| DASH-06 | Phase 4 | Pending |
| DASH-07 | Phase 4 | Pending |
| DASH-08 | Phase 4 | Pending |
| DASH-09 | Phase 4 | Pending |
| DASH-10 | Phase 4 | Pending |
| DASH-11 | Phase 4 | Pending |
| DASH-12 | Phase 4 | Pending |
| DASH-13 | Phase 4 | Pending |
| DASH-14 | Phase 4 | Pending |
| DASH-15 | Phase 4 | Pending |
| PROD-05 | Phase 4 | Pending |
| PROD-01 | Phase 5 | Pending |
| PROD-02 | Phase 5 | Pending |
| PROD-03 | Phase 5 | Pending |
| PROD-04 | Phase 5 | Pending |
| PROD-06 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 58 total
- Mapped to phases: 58
- Unmapped: 0

---
*Requirements defined: 2026-02-23*
*Last updated: 2026-02-23 — FOUN-13, FOUN-14, PROD-07 completed in 01-01*
