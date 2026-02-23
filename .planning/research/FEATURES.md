# Feature Landscape

**Domain:** CRO Analytics SaaS — Shopify-focused unified dashboard
**Researched:** 2026-02-23
**Confidence note:** Web search and WebFetch tools were unavailable during this session. All findings derive from training data (knowledge cutoff August 2025) cross-referenced against the project's own validated requirements (PROJECT.md, CLAUDE.md). Competitor feature claims are HIGH confidence for Triple Whale and AgencyAnalytics (well-documented in training data), MEDIUM confidence for Polar Analytics and Intelligems-specific behavior. Where uncertainty exists, it is flagged.

---

## Table Stakes

Features users expect from any analytics dashboard. Missing = product feels incomplete or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Live dashboard with KPI cards | Every analytics tool ships this; users orient by top-line metrics first | Low | Revenue, sessions, CVR, AOV as defaults |
| Date range picker with presets | Standard UX expectation (today, 7d, 30d, custom); absence signals immaturity | Low | Must support comparison periods (this period vs last) |
| Integration connection UI | Without connected integrations, there's no data — this IS the product | Medium | Status indicators, connection health, last-sync timestamps |
| Integration health monitoring | Users need to know if data is fresh or stale; broken silently = lost trust | Low-Med | Error badges, retry UI, "last synced X min ago" |
| Basic charts — line, bar, table | Minimum viable visualization primitives | Low | Use Recharts/Tremor per stack decision |
| Shopify revenue context | CVR and CRO data without revenue framing is incomplete; Shopify is the source of truth | Medium | Orders, revenue, sessions — Shopify integration non-negotiable |
| Multi-store switching | Agencies and multi-brand operators need this; single-store tools are a non-starter for the agency segment | Medium | Store switcher in nav, scoped data per store |
| User authentication + session management | Baseline product requirement | Low | Supabase Auth confirmed in stack |
| Onboarding / setup wizard | CRO tools have many integrations; users need guided first-run or they churn immediately | Medium | Per-integration connection steps, empty states with call-to-action |
| Read-only dashboard sharing | Agencies sharing client-facing views; internal stakeholder reporting | Medium | Shareable link with token, no login required |
| Responsive / usable on desktop | Analytics is a desktop workflow; doesn't need to be mobile-first but can't be broken | Low | Mobile is explicitly V4+ per project decisions |
| Subscription billing + account management | Paid SaaS baseline | Medium | Stripe integration, plan limits enforced, usage indicators |
| Export to CSV | Every analytics buyer asks for this immediately | Low | Widget-level or dashboard-level data export |
| Role-based access (basic) | Agencies sharing access; owners don't want to hand over billing credentials | Medium | Owner, admin, viewer roles minimum |

---

## Differentiators

Features that set Aloftly apart from Triple Whale, Polar Analytics, and AgencyAnalytics. Not universally expected, but highly valued by the CRO-specific audience.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Unified CRO view across all 7 sources | No competitor shows heatmaps + A/B tests + surveys + support + reviews in one place — this is the core pitch | High | Requires all 7 integration adapters shipping in V1 |
| Heatmap summary widget (Clarity) | CRO teams live in Clarity; a thumbnail summary with click-rate and scroll depth in-dashboard saves context switching | High | Clarity Data Export API required; not a real-time embed |
| A/B test result cards (Intelligems) | CRO teams want test status, winner, uplift, and confidence in one glance — currently spreadsheet-based | High | Webhook listener architecture; real-time updates |
| Post-purchase survey snapshots (KnoCommerce) | Attribution and customer voice data, often buried in KnoCommerce's own UI | Medium-High | REST API pull; display question + response distribution |
| Negative sentiment surfacing (Gorgias + Judge.me) | Surfacing support ticket volume spikes and low review scores alongside CVR is unique — flags product/page problems proactively | High | Requires sentiment aggregation from Gorgias tickets and review score trending |
| Pre-built CRO dashboard templates | "Start with the CRO audit template" removes setup friction; competitors require manual widget selection | Medium | 3-5 opinionated templates: Homepage CRO, PDP Audit, Checkout Funnel, Post-Purchase, Agency Client Report |
| Widget-based dashboard builder | Users configure their own view without engineering; competitors either lock dashboards or require full canvas drag-and-drop | Medium | Column layout selector, widget picker, reorder — per project decisions |
| Funnel visualization across data sources | Drop-off by page, exit rate from Shopify + GA4 + Clarity together | High | Cross-source join is technically non-trivial |
| Agency multi-tenancy (structural) | AgencyAnalytics has this but for SEO/PPC; CRO-specific agency tool does not exist | High | Org → workspace → store hierarchy with per-client isolation |
| AI-ready unified schema | metric_events table enables future anomaly detection and natural language queries without data pipeline rework | High | No user-visible feature in V1, but enables V3 AI layer — architecture win |
| Accessible price point ($49-199/mo) | Triple Whale starts at $429/mo; Polar at $720+/mo; Aloftly is 4-10x cheaper for the CRO workflow | N/A (pricing) | Position clearly on pricing page; CRO-specific value at SEO/PPC-tool prices |
| Per-integration empty states with setup prompts | Reduce friction from "I connected 1 of 7 integrations and gave up"; show value from each connection immediately | Medium | Placeholder widgets with connection CTAs while not connected |

---

## Anti-Features

Features to deliberately NOT build in V1 (and why).

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Free-form drag-and-drop grid canvas | Engineering cost is 4-5x a column-based picker; user research consistently shows most users never use free-form positioning once novelty wears off | Ship column-based widget layout with reorder in V1; upgrade to canvas in V2 after validating demand |
| Marketing attribution modeling | This is Triple Whale and Polar Analytics's core product; they have years of data science investment. Competing here is a losing war. | Focus 100% on on-site CRO data; attribution is explicitly out of scope |
| Ad spend analytics (Facebook, Google Ads) | Same issue as attribution; AgencyAnalytics does this for SEO/PPC agencies; not the Aloftly lane | Let Shopify revenue context provide the conversion-to-revenue bridge without ad channel breakdown |
| AI analysis layer in V1 | Requires training data volume, ML infrastructure, and edge-case handling that a V1 cannot support reliably | Store AI-ready schema from day one; build the analysis layer in V3 once data volume justifies it |
| White-label UI rendering | Complex theming infrastructure, custom domain routing, support burden for white-label clients | Store white-label config fields in JSONB in V1 (zero cost); ship rendering logic in V3 |
| Scheduled PDF/email reports | Report builder, PDF generation (Puppeteer or similar), email delivery pipeline — weeks of work for a feature users can live without | Ship read-only shareable links in V1; add scheduled reports in V2 |
| Shopify App Store listing | App Store review process, Shopify's partner requirements, billing through Shopify Payments — significant compliance overhead | Direct SaaS acquisition first; App Store in V3 when ready for scale |
| Mobile app | Analytics is a desktop workflow for the CRO audience; mobile spend is engineering that doesn't move the needle | Responsive desktop-first web; native mobile app in V4+ |
| Custom metric builder | Flexible query interface requires a full metric DSL, validation, and display logic — high complexity, low early adoption | Offer a fixed but opinionated metric library with per-widget configuration; custom builder in V4+ |
| Cross-store benchmarking | Requires aggregate anonymized data across all customer stores — data privacy, statistical significance, and product complexity | Single-store and multi-store comparison within one org; anonymized industry benchmarks are a V4+ product |
| Session recording viewer (embedded) | Clarity has a session recording UI that's deeply engineered; embedding or replicating it is huge scope | Surface session recording stats and thumbnails in-dashboard; link out to Clarity for full recordings |
| Real-time heatmap rendering | Live heatmap overlays require a rendering engine and significant frontend complexity | Sync heatmap summary data (click rate by zone, scroll depth) via Clarity's Data Export API; not a live overlay |
| Predictive analytics (churn, LTV) | Requires cohort tracking, ML models, and Shopify order history at scale — post-V2 territory | Focus on observed CRO metrics; surface trends, not predictions |
| Native A/B test creation | Running A/B tests requires code injection, traffic splitting, and statistical significance tooling — that's Intelligems's job | Ingest and display Intelligems test results; do not build a competing testing tool |
| Support ticket resolution UI | Don't replicate Gorgias; surface volume trends and sentiment summaries only | Gorgias ticket count, response time trend, and sentiment score widget; link out to Gorgias for ticket management |

---

## Feature Dependencies

```
Supabase Auth + RBAC → everything (auth gates all data access)
Shopify integration → revenue context widgets, funnel visualization
GA4 integration → session data, funnel top-of-funnel
Clarity integration → heatmap summary widget, scroll depth widget
Intelligems integration → A/B test result cards
KnoCommerce integration → survey snapshot widget
Gorgias integration → support sentiment widget, ticket volume widget
Judge.me integration → review score widget, review trend widget

Dashboard builder → requires widget library (KPI cards, charts, tables) to exist first
Widget library → requires integration adapters to exist (otherwise empty)
Integration adapters → require metric_events schema and metrics service abstraction
Metrics service abstraction → required before any widget renders real data

Multi-store switching → requires org/store hierarchy (multi-tenancy) in schema
Agency multi-tenancy → requires org/workspace/store hierarchy + RBAC
Read-only sharing → requires dashboard builder + auth bypass for share tokens

Stripe billing → requires auth + account model; enforces plan limits on store count
Onboarding wizard → requires at minimum Shopify integration + 1 other to demonstrate value
Pre-built templates → requires dashboard builder + all 7 widgets available

Funnel visualization → requires Shopify + GA4 + Clarity data joined in metrics service
Negative sentiment surfacing → requires Gorgias + Judge.me both connected and syncing
```

---

## MVP Recommendation

### Must ship at launch (V1)

These are the features where missing any one weakens the core pitch:

1. Supabase Auth + RBAC (owner/admin/viewer) — gates everything
2. Multi-tenant schema (org → workspace → store) — can't retrofit
3. Shopify integration — revenue context without this is hollow
4. GA4 integration — sessions, bounce rate, page-level CVR context
5. Clarity integration (heatmap summaries, not live overlay) — biggest CRO differentiator
6. Intelligems integration (A/B test result cards via webhooks) — core CRO workflow
7. KnoCommerce integration (survey snapshots) — differentiator, completes the voice-of-customer picture
8. Gorgias integration (ticket volume + sentiment) — negative sentiment surfacing
9. Judge.me integration (review score + trend) — negative sentiment surfacing, pairs with Gorgias
10. Dashboard builder (column layout + widget picker + reorder) — without this, it's just a static report
11. KPI card widgets + basic line/bar chart widgets + table widget — minimum visualization primitives
12. Integration health monitoring — trust signal; broken silently kills user confidence
13. Date range picker with comparison — expected by every analytics user
14. Multi-store switching — agencies won't adopt without this
15. Read-only shareable links — agency reporting workflow table stakes
16. Stripe billing with plan enforcement — must be in V1 to be a real paid product
17. Onboarding wizard — CRO tools have complex setup; guided first-run prevents churn
18. Pre-built dashboard templates (3 minimum: CRO Audit, PDP Audit, Agency Client View) — removes cold start problem
19. CSV export — always requested in first week by any analytics buyer

### Defer to V2

- Scheduled PDF/email reports — shareable links cover the use case at launch
- Dashboard comments and annotations — useful for agencies but not a blocker
- Client portal (scoped viewer login) — viewer role + shareable link covers the V1 agency use case
- White-label UI rendering — fields stored in V1 schema, rendering in V2+

### Defer to V3+

- AI anomaly detection and natural language queries — schema is ready; build when data volume justifies
- White-label rendering
- Shopify App Store listing
- Cross-store benchmarking
- Custom metric builder
- Mobile app

---

## Competitor Feature Matrix

Confidence: MEDIUM (training data, no live verification possible this session)

| Feature | Aloftly V1 | Triple Whale ($429+) | Polar Analytics ($720+) | AgencyAnalytics ($59-349) |
|---------|-----------|---------------------|------------------------|--------------------------|
| Shopify revenue dashboard | Yes | Yes | Yes | Yes |
| Marketing attribution | No (by design) | Yes (core product) | Yes (core product) | Yes (multi-channel) |
| Ad spend analytics | No (by design) | Yes | Yes | Yes |
| Heatmap data (Clarity) | Yes | No | No | No |
| A/B test results (Intelligems) | Yes | No | No | No |
| Post-purchase surveys (KnoCommerce) | Yes | No | No | No |
| Support sentiment (Gorgias) | Yes | No | No | No |
| Reviews data (Judge.me) | Yes | No | No | No |
| Multi-store | Yes | Yes (premium) | Yes | Yes |
| Agency multi-tenancy | Yes (structural) | Limited | Limited | Yes (core product) |
| Dashboard builder | Yes (widget picker) | Limited | Limited | Yes |
| Pre-built CRO templates | Yes | No | No | No |
| Read-only sharing | Yes | Yes | Yes | Yes |
| AI analysis | V3 roadmap | Yes (beta) | Roadmap | No |
| Price per month | $49-199 | $429+ | $720+ | $59-349 |
| CRO-specific focus | Yes | No | No | No |

---

## Sources

- Project context: `.planning/PROJECT.md` and `CLAUDE.md` (HIGH confidence — validated requirements)
- Triple Whale feature set: Training data through August 2025 (MEDIUM confidence — well-documented but unverified live)
- Polar Analytics feature set: Training data through August 2025 (MEDIUM confidence)
- AgencyAnalytics feature set: Training data through August 2025 (MEDIUM confidence)
- Intelligems webhook architecture: CLAUDE.md project decisions (HIGH confidence — owner-validated)
- Gorgias, KnoCommerce, Judge.me integration patterns: Training data (MEDIUM confidence)
- CRO industry feature expectations: Domain knowledge from training data (MEDIUM confidence)
- Web search and WebFetch tools were unavailable this session — all external source verification is via training data only. Phase-specific research should verify competitor features against live product pages before any positioning decisions are finalized.
