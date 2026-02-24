# Custom SQL Migrations

These SQL files contain Postgres-specific DDL that Drizzle ORM cannot generate:
- `PARTITION BY RANGE` for `metric_events`
- RLS policies using `auth.jwt()` Supabase-specific functions
- Supabase Vault helper functions (requires Vault extension)
- Auth trigger on `auth.users` (cross-schema, Supabase-managed)
- Custom access token hook function

## Execution Order

Run these **after** the Drizzle migration (`npx drizzle-kit migrate`):

```bash
# 1. Run Drizzle migration first (creates all standard tables)
npx drizzle-kit migrate

# 2. Apply custom migrations in order via Supabase Dashboard SQL editor
#    or the Supabase CLI:
supabase db execute --file src/db/migrations/custom/0001_metric_events.sql
supabase db execute --file src/db/migrations/custom/0002_rls_policies.sql
supabase db execute --file src/db/migrations/custom/0003_vault_functions.sql
supabase db execute --file src/db/migrations/custom/0004_org_provisioning_trigger.sql
supabase db execute --file src/db/migrations/custom/0005_custom_access_token_hook.sql
```

Or paste each file's contents into the Supabase Dashboard SQL Editor.

## Post-Migration Manual Step

**REQUIRED after running 0005_custom_access_token_hook.sql:**

1. Go to Supabase Dashboard
2. Navigate to: Authentication → Hooks → Custom Access Token
3. Select function: `public.custom_access_token_hook`
4. Enable the hook

**Without this step**, the function exists but Supabase Auth will not call it.
JWT claims will be empty and ALL RLS policies will fail silently (returning zero rows).

## Files

| File | Purpose |
|------|---------|
| `0001_metric_events.sql` | Partitioned `metric_events` table (PARTITION BY RANGE on `recorded_at`) + 4 monthly partitions |
| `0002_rls_policies.sql` | RLS policies on all tenant-scoped tables using JWT claims |
| `0003_vault_functions.sql` | `private.store_integration_credential` and `private.get_integration_credential` (service_role only) |
| `0004_org_provisioning_trigger.sql` | `handle_new_user()` trigger that auto-creates org + workspace + owner membership on signup |
| `0005_custom_access_token_hook.sql` | `custom_access_token_hook()` that injects `org_id` + `user_role` into JWT claims |
