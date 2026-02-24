-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies: org-level tenant isolation via JWT claims
-- FOUN-04
--
-- DESIGN: All policies use auth.jwt()->>'org_id' (JWT claim, O(1) lookup).
-- The custom_access_token_hook (0005_custom_access_token_hook.sql) injects
-- org_id into JWT at token issuance time. RLS then uses it with no subqueries.
--
-- EXCEPTION: workspace_members has one documented subquery — see inline comment.
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS on all tenant-scoped tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metric_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metric_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;

-- ─── Org isolation policies (JWT claim based — no subqueries) ─────────────────

-- organizations: user can only see their own org
CREATE POLICY org_isolation ON public.organizations
  FOR ALL
  USING (id = (auth.jwt()->>'org_id')::uuid);

-- workspaces: scoped by org_id JWT claim
CREATE POLICY org_isolation ON public.workspaces
  FOR ALL
  USING (org_id = (auth.jwt()->>'org_id')::uuid);

-- stores: scoped by org_id JWT claim
CREATE POLICY org_isolation ON public.stores
  FOR ALL
  USING (org_id = (auth.jwt()->>'org_id')::uuid);

-- org_members: scoped by org_id JWT claim
CREATE POLICY org_isolation ON public.org_members
  FOR ALL
  USING (org_id = (auth.jwt()->>'org_id')::uuid);

-- sync_jobs: scoped by org_id JWT claim
CREATE POLICY org_isolation ON public.sync_jobs
  FOR ALL
  USING (org_id = (auth.jwt()->>'org_id')::uuid);

-- integration_connections: scoped by org_id JWT claim
CREATE POLICY org_isolation ON public.integration_connections
  FOR ALL
  USING (org_id = (auth.jwt()->>'org_id')::uuid);

-- metric_events (partitioned): scoped by org_id JWT claim
CREATE POLICY org_isolation ON public.metric_events
  FOR ALL
  USING (org_id = (auth.jwt()->>'org_id')::uuid);

-- ─── metric_definitions: global read-only for all authenticated users ─────────
-- Not org-scoped — metric definitions are shared across all orgs

CREATE POLICY read_definitions ON public.metric_definitions
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ─── workspace_members: DOCUMENTED SUBQUERY EXCEPTION ────────────────────────
-- workspace_members has no direct org_id column, so we must join through workspaces.
-- This is the ONE acceptable subquery in our RLS policies because:
--   1. workspace_members does not have org_id (it would be denormalized)
--   2. The subquery joins workspaces (small cardinality per org — typically < 20 rows)
--   3. The workspaces table has org_id indexed and is RLS-protected itself
-- All other tables use direct JWT claim comparison (O(1)).

CREATE POLICY org_isolation ON public.workspace_members
  FOR ALL
  USING (
    workspace_id IN (
      SELECT w.id
      FROM public.workspaces w
      WHERE w.org_id = (auth.jwt()->>'org_id')::uuid
    )
  );
