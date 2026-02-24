# Phase 1: Foundation - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Multi-tenant schema, authentication, deployable Next.js scaffold, CI/CD pipeline, and day-one observability (Sentry + Vercel Analytics). Every future phase builds on this without schema changes. No data pipelines, no integrations, no dashboard widgets — just the correct foundation.

</domain>

<decisions>
## Implementation Decisions

### Auth & signup experience
- Magic link + Google OAuth only — no passwords
- 30-day session duration; re-auth only on sensitive actions
- Post-signup: quick setup wizard (2-3 steps: name org, connect first Shopify store, pick first integration) before landing on dashboard
- Wizard connects to the guided empty state on the dashboard — both reinforce the onboarding path

### Org & role model
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

### App shell & navigation
- Left sidebar, fixed width (not collapsible). Hamburger menu on mobile.
- Sidebar structure (top to bottom):
  - Workspace switcher dropdown at top (like Linear's team switcher)
  - Dashboards
  - Stores
  - Integrations
  - Settings
  - User avatar at bottom → dropdown for profile, org settings, billing, logout
- Full settings page for detailed management (org, billing, team, profile) in addition to the avatar dropdown
- Breadcrumbs at top of content area showing navigation path (Workspace > Store > Dashboard) — prevents "where am I?" in nested views
- Empty dashboard state: guided checklist ("Connect your first store" → "Add an integration" → "View your data") — doubles as onboarding, reduces time-to-value
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

</decisions>

<specifics>
## Specific Ideas

- "Similar to Linear's team switcher" for workspace dropdown
- "Similar to AgencyAnalytics" for breadcrumb usage in nested hierarchies
- "Propbinder.com's purple palette" as color reference, applied to dashboard context
- Light-mode-first product (per CLAUDE.md design guardrails)
- The workspace layer is non-negotiable — it's what makes the agency use case work and avoids schema retrofit later

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-02-23*
