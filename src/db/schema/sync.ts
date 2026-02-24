// src/db/schema/sync.ts
// Sync job tracking and integration connection tables
// Source: 01-RESEARCH.md Code Examples — sync_jobs + integration_connections
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  pgEnum,
  index,
  unique,
} from 'drizzle-orm/pg-core'
import { organizations } from './auth'
import { stores } from './auth'

// ─────────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────────

export const syncStatusEnum = pgEnum('sync_status', [
  'pending',
  'running',
  'succeeded',
  'failed',
  'retrying',
])

// ─────────────────────────────────────────────────────────────────────────────
// Sync Jobs — FOUN-08
// Tracks each data sync attempt per integration per store.
// cursor enables incremental syncing (offset, timestamp, or webhook cursor).
// ─────────────────────────────────────────────────────────────────────────────

export const syncJobs = pgTable(
  'sync_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    // Integration source: 'clarity', 'shopify', 'intelligems', 'gorgias', 'knocommerce', 'judgeme'
    source: varchar('source', { length: 50 }).notNull(),
    status: syncStatusEnum('status').notNull().default('pending'),
    // Last synced cursor position (timestamp, offset, or integration-specific token)
    cursor: text('cursor'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    // Duration in milliseconds for performance monitoring
    durationMs: integer('duration_ms'),
    // Error details for debugging failed syncs
    errorDetails: jsonb('error_details'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sync_jobs_org_store_idx').on(t.orgId, t.storeId)]
)

// ─────────────────────────────────────────────────────────────────────────────
// Integration Connections
// One connection per integration source per store.
// Credentials are stored in Supabase Vault; only the vault secret ID is stored here.
// ─────────────────────────────────────────────────────────────────────────────

export const integrationConnections = pgTable(
  'integration_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    source: varchar('source', { length: 50 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    // References vault.secrets.id — NOT the credential itself (FOUN-09)
    vaultSecretId: uuid('vault_secret_id'),
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
    lastSyncStatus: syncStatusEnum('last_sync_status'),
    errorDetails: jsonb('error_details'),
    // Integration-specific settings (non-secret): webhook URLs, refresh intervals, etc.
    settings: jsonb('settings').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // One connection per integration per store
    unique('integration_connections_store_source_unique').on(t.storeId, t.source),
    index('integration_connections_org_id_idx').on(t.orgId),
  ]
)

// ─────────────────────────────────────────────────────────────────────────────
// TypeScript types
// ─────────────────────────────────────────────────────────────────────────────

export type SyncJob = typeof syncJobs.$inferSelect
export type NewSyncJob = typeof syncJobs.$inferInsert
export type IntegrationConnection = typeof integrationConnections.$inferSelect
export type NewIntegrationConnection = typeof integrationConnections.$inferInsert
export type SyncStatus = (typeof syncStatusEnum.enumValues)[number]
