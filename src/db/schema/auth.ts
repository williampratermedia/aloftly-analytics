// src/db/schema/auth.ts
// Organizations, workspaces, stores, and membership tables
// Source: 01-RESEARCH.md Pattern 4 — Multi-Tenant Schema
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  pgEnum,
  unique,
} from 'drizzle-orm/pg-core'

// ─────────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────────

export const planTierEnum = pgEnum('plan_tier', [
  'starter',
  'professional',
  'agency',
  'enterprise',
])

export const orgRoleEnum = pgEnum('org_role', [
  'owner',
  'admin',
  'member',
  'viewer',
])

// ─────────────────────────────────────────────────────────────────────────────
// Organizations — top-level tenant boundary
// ─────────────────────────────────────────────────────────────────────────────

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  // FOUN-12: billing tier
  planTier: planTierEnum('plan_tier').notNull().default('starter'),
  // FOUN-11: feature gate flags per org
  featureFlags: jsonb('feature_flags').notNull().default({}),
  // FOUN-10: white-label configuration (stored day one, UI deferred)
  whiteLabelConfig: jsonb('white_label_config').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─────────────────────────────────────────────────────────────────────────────
// Workspaces — client-level grouping within an org (agency = org, clients = workspaces)
// ─────────────────────────────────────────────────────────────────────────────

export const workspaces = pgTable(
  'workspaces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('workspaces_org_id_idx').on(t.orgId)]
)

// ─────────────────────────────────────────────────────────────────────────────
// Stores — Shopify stores within a workspace
// ─────────────────────────────────────────────────────────────────────────────

export const stores = pgTable(
  'stores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    shopifyDomain: varchar('shopify_domain', { length: 255 }).notNull(),
    displayName: text('display_name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('stores_org_id_idx').on(t.orgId),
    index('stores_workspace_id_idx').on(t.workspaceId),
  ]
)

// ─────────────────────────────────────────────────────────────────────────────
// Org Members — user membership in an org with role
// NOTE: userId references auth.users(id) but is NOT a Drizzle FK (cross-schema).
// The constraint is enforced at the trigger/application level.
// ─────────────────────────────────────────────────────────────────────────────

export const orgMembers = pgTable(
  'org_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    // Cross-schema reference to auth.users(id) — not a Drizzle FK
    userId: uuid('user_id').notNull(),
    role: orgRoleEnum('role').notNull().default('member'),
    invitedAt: timestamp('invited_at', { withTimezone: true }),
    joinedAt: timestamp('joined_at', { withTimezone: true }),
  },
  (t) => [
    index('org_members_org_id_idx').on(t.orgId),
    index('org_members_user_id_idx').on(t.userId),
    unique('org_members_org_user_unique').on(t.orgId, t.userId),
  ]
)

// ─────────────────────────────────────────────────────────────────────────────
// Workspace Members — workspace-scoped access for members/viewers
// Agencies use this to restrict freelancers to specific client workspaces
// ─────────────────────────────────────────────────────────────────────────────

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    // Cross-schema reference to auth.users(id) — not a Drizzle FK
    userId: uuid('user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('workspace_members_workspace_id_idx').on(t.workspaceId),
    index('workspace_members_user_id_idx').on(t.userId),
    unique('workspace_members_workspace_user_unique').on(t.workspaceId, t.userId),
  ]
)

// ─────────────────────────────────────────────────────────────────────────────
// TypeScript types (inferred from schema)
// ─────────────────────────────────────────────────────────────────────────────

export type Organization = typeof organizations.$inferSelect
export type NewOrganization = typeof organizations.$inferInsert
export type Workspace = typeof workspaces.$inferSelect
export type NewWorkspace = typeof workspaces.$inferInsert
export type Store = typeof stores.$inferSelect
export type NewStore = typeof stores.$inferInsert
export type OrgMember = typeof orgMembers.$inferSelect
export type NewOrgMember = typeof orgMembers.$inferInsert
export type WorkspaceMember = typeof workspaceMembers.$inferSelect
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert
export type PlanTier = (typeof planTierEnum.enumValues)[number]
export type OrgRole = (typeof orgRoleEnum.enumValues)[number]
