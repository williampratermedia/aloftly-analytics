---
phase: 01-foundation
plan: 02
subsystem: database
tags: [drizzle, supabase, postgres, rls, vault, multi-tenant, partitioning, schema]

# Dependency graph
requires:
  - 01-01 (Next.js scaffold with Drizzle configured and src/db/schema/index.ts placeholder)
provides:
  - Drizzle schema: organizations, workspaces, stores, orgMembers, workspaceMembers tables
  - Drizzle schema: metricDefinitions table + metricEvents type reference
  - Drizzle schema: syncJobs, integrationConnections tables with syncStatusEnum
  - Drizzle-generated migration (0000_supreme_sumo.sql) for all 8 standard tables
  - Custom SQL migration: metric_events partitioned by RANGE on recorded_at (4 monthly partitions)
  - Custom SQL migration: RLS policies on all 9 tenant-scoped tables via JWT claims
  - Custom SQL migration: Vault helper functions for encrypted credential storage
  - Custom SQL migration: org auto-provisioning trigger on auth.users insert
  - Custom SQL migration: custom_access_token_hook injecting org_id + user_role into JWT
affects:
  - 01-03 (Supabase auth — builds on schema; needs orgMembers for JWT hook)
  - All Phase 2+ adapters (syncJobs, integrationConnections, metricDefinitions)
  - All Phase 4+ dashboard widgets (metricDefinitions, metricEvents query shape)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Drizzle pgEnum for plan_tier and org_role (generates Postgres native ENUM types)
    - Drizzle pgEnum for sync_status shared across syncJobs + integrationConnections
    - Partitioned table defined via raw SQL migration (Drizzle cannot generate PARTITION BY)
    - Type-only metricEventsShape constant for TypeScript query building without Drizzle table conflict
    - RLS policies using auth.jwt()->>'org_id' JWT claim (O(1), no subqueries) for all direct org_id tables
    - One documented subquery exception in workspace_members RLS (no direct org_id column)
    - Vault functions in private schema, SECURITY DEFINER, restricted to service_role
    - Auth trigger SECURITY DEFINER set search_path = public for cross-schema auth.users access
    - Custom access token hook ordered by joined_at ASC for deterministic multi-org handling

key-files:
  created:
    - src/db/schema/auth.ts (organizations, workspaces, stores, orgMembers, workspaceMembers + enums + types)
    - src/db/schema/metrics.ts (metricDefinitions table, metricEventsShape type reference, MetricEvent type)
    - src/db/schema/sync.ts (syncStatusEnum, syncJobs, integrationConnections + types)
    - src/db/migrations/0000_supreme_sumo.sql (Drizzle-generated: 8 tables, 3 enums, 10 FKs, 8 indexes)
    - src/db/migrations/custom/0001_metric_events.sql (PARTITION BY RANGE + 4 monthly partitions + 4 indexes)
    - src/db/migrations/custom/0002_rls_policies.sql (RLS ENABLE + 9 policies on tenant-scoped tables)
    - src/db/migrations/custom/0003_vault_functions.sql (store/get credential functions, service_role only)
    - src/db/migrations/custom/0004_org_provisioning_trigger.sql (handle_new_user trigger on auth.users)
    - src/db/migrations/custom/0005_custom_access_token_hook.sql (JWT org_id + user_role injection)
    - src/db/migrations/custom/README.md (execution order + post-migration dashboard step)
  modified:
    - src/db/schema/index.ts (replaced placeholder with full barrel export of all tables, enums, types)

key-decisions:
  - "metric_events RANGE partitioned on recorded_at only — not (store_id, recorded_at) per spec; store_id filtering via composite index; composite partition key would require list-range sub-partitioning with one partition per store per month (operationally untenable)"
  - "Custom SQL migrations in src/db/migrations/custom/ directory — Drizzle migration runner cannot handle PARTITION BY, auth.jwt() RLS syntax, or cross-schema trigger DDL"
  - "metricEventsShape defined as const (not pgTable) to provide TypeScript shape for query building without conflicting with the raw SQL CREATE TABLE"
  - "workspace_members RLS uses one documented subquery exception — table has no direct org_id column; subquery on workspaces is small cardinality and acceptable"
  - "custom_access_token_hook orders by joined_at ASC for deterministic primary-org selection when user has multiple org memberships (future-proofing)"
  - "Vault functions in private schema (not public) — private schema is not exposed via PostgREST API, providing an extra access control layer"

# Metrics
duration: 5min
completed: 2026-02-23
---

# Phase 01 Plan 02: Multi-Tenant Database Schema Summary

**Complete Drizzle ORM schema for org → workspace → store hierarchy with RLS via JWT claims, partitioned metric_events (RANGE on recorded_at), Vault credential functions, and org auto-provisioning trigger**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-23T22:21:14Z
- **Completed:** 2026-02-23T22:25:49Z
- **Tasks:** 2
- **Files modified/created:** 10

## Accomplishments

- Created full Drizzle schema covering all 8 Drizzle-managed tables: organizations (with planTier, featureFlags, whiteLabelConfig), workspaces, stores, orgMembers, workspaceMembers, metricDefinitions, syncJobs, integrationConnections
- Generated Drizzle migration (0000_supreme_sumo.sql) with all tables, enums, foreign keys, and indexes
- Created `metricEventsShape` type-only constant — provides TypeScript shape for query building without conflicting with the raw SQL CREATE TABLE PARTITION BY
- Wrote 5 custom SQL migration files covering all Postgres-specific DDL that Drizzle cannot generate
- Documented the critical post-migration manual step (register hook in Supabase Dashboard)
- TypeScript passes `npx tsc --noEmit` with zero errors across all schema files

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Drizzle schema files for all multi-tenant tables** - `98798c4` (feat)
2. **Task 2: Generate migrations, partitioned metric_events, RLS policies, Vault functions** - `6b1b231` (feat)

## Files Created/Modified

- `src/db/schema/auth.ts` — organizations (planTier/featureFlags/whiteLabelConfig), workspaces, stores, orgMembers, workspaceMembers with planTierEnum, orgRoleEnum, indexes, unique constraints, and inferred TypeScript types
- `src/db/schema/metrics.ts` — metricDefinitions table (key, source, displayName, unit, aggregationMethod, category, metadata); metricEventsShape const for type-safe references; MetricEvent TypeScript type
- `src/db/schema/sync.ts` — syncStatusEnum, syncJobs (with cursor column for incremental sync), integrationConnections (with vaultSecretId for Vault reference)
- `src/db/schema/index.ts` — Full barrel export replacing placeholder; exports all tables, enums, and inferred types
- `src/db/migrations/0000_supreme_sumo.sql` — Drizzle-generated: 3 ENUMs, 8 tables, 10 FK constraints, 8 composite/single-column indexes
- `src/db/migrations/custom/0001_metric_events.sql` — metric_events PARTITION BY RANGE (recorded_at); partitioning rationale documented; 4 indexes; 4 monthly partitions (2026-02 through 2026-05)
- `src/db/migrations/custom/0002_rls_policies.sql` — ENABLE ROW LEVEL SECURITY on 9 tables; 9 org_isolation / read_definitions policies; workspace_members subquery exception documented
- `src/db/migrations/custom/0003_vault_functions.sql` — private.store_integration_credential + private.get_integration_credential; SECURITY DEFINER; REVOKE from public/anon/authenticated; GRANT to service_role
- `src/db/migrations/custom/0004_org_provisioning_trigger.sql` — handle_new_user() creates org + workspace + org_member atomically; slug collision prevention via gen_random_uuid() suffix
- `src/db/migrations/custom/0005_custom_access_token_hook.sql` — custom_access_token_hook() injects org_id + user_role into JWT; GRANT to supabase_auth_admin; REVOKE from all others
- `src/db/migrations/custom/README.md` — Execution order guide + manual dashboard step

## Decisions Made

- **RANGE partitioning on recorded_at only**: REQUIREMENTS.md spec said "(store_id, recorded_at)" but PostgreSQL RANGE supports only one expression. Using RANGE on recorded_at only is correct — store_id filtering is handled by the composite index `(store_id, recorded_at DESC)`. Composite sub-partitioning (list by store_id, then range by date) would produce one partition per store per month — massive operational complexity with no query benefit.
- **Custom migrations in custom/ subdirectory**: Drizzle's migration runner expects its own format (`--> statement-breakpoint`). Custom SQL for PARTITION BY, auth.jwt() functions, and cross-schema triggers cannot be safely embedded in Drizzle's format, so they live in a separate directory with a README execution guide.
- **metricEventsShape as const (not pgTable)**: If metric_events were defined as a Drizzle pgTable, `drizzle-kit generate` would try to generate a conflicting CREATE TABLE. The const approach provides the TypeScript shape for query result typing without interfering with the raw SQL migration.
- **workspace_members subquery exception**: workspace_members has no org_id column. A subquery through workspaces is the only option. Documented explicitly in both the SQL file and this summary.
- **custom_access_token_hook ORDER BY joined_at ASC**: Future-proofs multi-org support. When a user belongs to multiple orgs, the earliest-joined org is selected as the JWT claim. The app layer handles org switching at the session level.

## Deviations from Plan

None — plan executed exactly as written. The partitioning rationale in the plan (RANGE on recorded_at only being intentional) was followed precisely. All 5 custom migration files are implemented as specified.

## User Setup Required

**REQUIRED before the app works end-to-end:**

1. **Run Drizzle migration** (once Supabase project is configured with real DATABASE_URL_DIRECT):
   ```bash
   npx drizzle-kit migrate
   ```

2. **Apply custom SQL migrations** in order (via Supabase Dashboard SQL editor or CLI):
   ```
   src/db/migrations/custom/0001_metric_events.sql
   src/db/migrations/custom/0002_rls_policies.sql
   src/db/migrations/custom/0003_vault_functions.sql
   src/db/migrations/custom/0004_org_provisioning_trigger.sql
   src/db/migrations/custom/0005_custom_access_token_hook.sql
   ```

3. **Register custom access token hook** (CRITICAL — without this, all RLS fails):
   - Supabase Dashboard → Authentication → Hooks → Custom Access Token
   - Select function: `public.custom_access_token_hook`
   - Enable the hook

## Next Phase Readiness

- Schema is complete — 01-03 (Supabase Auth) can now build login pages and auth callbacks
- orgMembers table is in place for the JWT hook to inject org_id and user_role
- All FOUN requirements addressed: FOUN-01, FOUN-06, FOUN-07, FOUN-08, FOUN-09, FOUN-10, FOUN-11, FOUN-12
- No blockers for 01-03

---
*Phase: 01-foundation*
*Completed: 2026-02-23*
