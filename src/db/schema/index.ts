// src/db/schema/index.ts
// Barrel export for all Drizzle schema modules
// Import from here in drizzle.config.ts and application code

// ─── Auth / Org / Workspace / Store ────────────────────────────────────────
export {
  // Enums
  planTierEnum,
  orgRoleEnum,
  // Tables
  organizations,
  workspaces,
  stores,
  orgMembers,
  workspaceMembers,
  // Types
  type Organization,
  type NewOrganization,
  type Workspace,
  type NewWorkspace,
  type Store,
  type NewStore,
  type OrgMember,
  type NewOrgMember,
  type WorkspaceMember,
  type NewWorkspaceMember,
  type PlanTier,
  type OrgRole,
} from './auth'

// ─── Metrics ────────────────────────────────────────────────────────────────
export {
  // Tables
  metricDefinitions,
  // metric_events is defined via raw SQL migration (PARTITION BY RANGE)
  // Use metricEventsShape for type-only references
  metricEventsShape,
  // Types
  type MetricDefinition,
  type NewMetricDefinition,
  type MetricEvent,
} from './metrics'

// ─── Sync / Integrations ─────────────────────────────────────────────────────
export {
  // Enums
  syncStatusEnum,
  // Tables
  syncJobs,
  integrationConnections,
  // Types
  type SyncJob,
  type NewSyncJob,
  type IntegrationConnection,
  type NewIntegrationConnection,
  type SyncStatus,
} from './sync'
