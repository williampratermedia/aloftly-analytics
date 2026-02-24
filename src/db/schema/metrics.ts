// src/db/schema/metrics.ts
// Metric definitions registry and metric_events type reference
// Source: 01-RESEARCH.md Code Examples — metric_definitions + Pattern 5
import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  numeric,
} from 'drizzle-orm/pg-core'

// ─────────────────────────────────────────────────────────────────────────────
// Metric Definitions — FOUN-07
// Registry of all known metric types across integrations.
// Provides display names, units, aggregation hints, and categories for the UI.
// ─────────────────────────────────────────────────────────────────────────────

export const metricDefinitions = pgTable('metric_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Namespaced key: 'clarity.rage_clicks', 'shopify.revenue', 'intelligems.conversion_rate'
  key: varchar('key', { length: 100 }).notNull().unique(),
  // Integration source: 'clarity', 'shopify', 'intelligems', 'gorgias', 'knocommerce', 'judgeme'
  source: varchar('source', { length: 50 }).notNull(),
  displayName: text('display_name').notNull(),
  // Display unit: 'count', 'percent', 'currency', 'seconds', etc.
  unit: varchar('unit', { length: 50 }),
  // Aggregation hint for queries: 'sum', 'avg', 'max', 'min', 'last'
  aggregationMethod: varchar('aggregation_method', { length: 50 }).notNull().default('sum'),
  // UI grouping: 'engagement', 'revenue', 'ab_test', 'support', 'reviews'
  category: varchar('category', { length: 50 }),
  description: text('description'),
  // Source-specific display metadata (chart type hints, color, etc.)
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─────────────────────────────────────────────────────────────────────────────
// metric_events — TYPE REFERENCE ONLY
//
// Table created via raw SQL migration — see src/db/migrations/ for:
//   0001_metric_events.sql  (PARTITION BY RANGE on recorded_at + monthly partitions)
//
// Drizzle ORM cannot generate PARTITION BY DDL. This type-only definition
// allows TypeScript code to reference the table shape for query building
// without conflicting with the raw SQL CREATE TABLE.
//
// DO NOT add this table to a drizzle-kit migration — it will cause a conflict.
// ─────────────────────────────────────────────────────────────────────────────

export const metricEventsShape = {
  id: uuid('id'),
  storeId: uuid('store_id'),
  orgId: uuid('org_id'),
  // Integration source matching metric_definitions.source
  source: varchar('source', { length: 50 }),
  // Matches metric_definitions.key
  metricKey: varchar('metric_key', { length: 100 }),
  value: numeric('value', { precision: 20, scale: 4 }),
  // Primary partition key — queries always filter on this
  recordedAt: timestamp('recorded_at', { withTimezone: true }),
  syncedAt: timestamp('synced_at', { withTimezone: true }),
  // Source-specific dimension data: session_id, page_url, variant_id, etc.
  dimensions: jsonb('dimensions'),
} as const

// TypeScript type for metric_events rows (for type-safe query results)
export type MetricEvent = {
  id: string
  storeId: string
  orgId: string
  source: string
  metricKey: string
  value: string // numeric comes back as string from postgres driver
  recordedAt: Date
  syncedAt: Date
  dimensions: Record<string, unknown>
}

export type MetricDefinition = typeof metricDefinitions.$inferSelect
export type NewMetricDefinition = typeof metricDefinitions.$inferInsert
