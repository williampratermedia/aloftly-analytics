-- ─────────────────────────────────────────────────────────────────────────────
-- metric_events: partitioned by RANGE on recorded_at (monthly partitions)
-- FOUN-06
--
-- PARTITIONING RATIONALE (intentional divergence from REQUIREMENTS.md spec):
-- REQUIREMENTS.md says "partitioned by (store_id, recorded_at)" but PostgreSQL
-- range partitioning only supports a single partition key expression. Using
-- RANGE on recorded_at only is the correct approach:
--   - store_id filtering happens via the composite index (store_id, recorded_at DESC)
--   - Monthly recorded_at partitions align with the 7/30/90-day CRO query patterns
--   - Composite (store_id, recorded_at) would require list-range sub-partitioning:
--     one partition per store per month — massive operational complexity with no
--     query benefit since store_id is already indexed.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.metric_events (
  id          uuid          NOT NULL DEFAULT gen_random_uuid(),
  store_id    uuid          NOT NULL,
  org_id      uuid          NOT NULL,
  -- Integration source: 'clarity', 'shopify', 'intelligems', 'gorgias', 'knocommerce', 'judgeme'
  source      varchar(50)   NOT NULL,
  -- Matches metric_definitions.key (e.g. 'clarity.rage_clicks', 'shopify.revenue')
  metric_key  varchar(100)  NOT NULL,
  value       numeric(20,4) NOT NULL,
  -- Partition key: always filter on this for efficient partition pruning
  recorded_at timestamptz   NOT NULL,
  synced_at   timestamptz   NOT NULL DEFAULT now(),
  -- Source-specific dimension data: session_id, page_url, variant_id, device_type, etc.
  dimensions  jsonb         NOT NULL DEFAULT '{}',
  -- Composite PK required for partitioned tables (partition key must be in PK)
  PRIMARY KEY (id, recorded_at)
) PARTITION BY RANGE (recorded_at);

-- ─── Indexes (inherited by all partitions automatically) ──────────────────────

-- Primary query pattern: by store + time range (used in all dashboard queries)
CREATE INDEX metric_events_store_recorded_idx
  ON public.metric_events (store_id, recorded_at DESC);

-- Org-level queries (metrics across all stores in an org)
CREATE INDEX metric_events_org_id_idx
  ON public.metric_events (org_id);

-- Metric type filtering (cross-source queries by metric_key or source)
CREATE INDEX metric_events_source_key_idx
  ON public.metric_events (source, metric_key);

-- GIN index on dimensions for future dimension-based filtering
CREATE INDEX metric_events_dimensions_gin_idx
  ON public.metric_events USING gin (dimensions);

-- ─── Initial monthly partitions (current + 3 months ahead) ───────────────────
-- Today: 2026-02-23. Partitions cover Feb–May 2026.
-- New partitions should be created monthly via pg_cron or Supabase Edge Function cron.

CREATE TABLE metric_events_2026_02
  PARTITION OF public.metric_events
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE metric_events_2026_03
  PARTITION OF public.metric_events
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE metric_events_2026_04
  PARTITION OF public.metric_events
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE metric_events_2026_05
  PARTITION OF public.metric_events
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
