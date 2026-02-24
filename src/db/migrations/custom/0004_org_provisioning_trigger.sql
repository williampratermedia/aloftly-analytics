-- ─────────────────────────────────────────────────────────────────────────────
-- Org Auto-Provisioning Trigger
-- Fires AFTER INSERT on auth.users to atomically create:
--   1. An organization (named after the user's email domain)
--   2. A default workspace ("My Workspace")
--   3. An org_member row with role = 'owner'
--
-- Why a trigger instead of application code:
--   - Runs atomically in the same transaction as the user insert
--   - Cannot be skipped by application bugs or client-side errors
--   - New users always land in a valid org context
--
-- Org name handling (Claude's discretion per 01-RESEARCH.md):
--   Auto-generate org name from email domain. User can rename in the setup wizard.
--   Slug gets a random suffix to avoid collisions (e.g., 'gmail-com-a1b2c3').
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id       uuid;
  new_workspace_id uuid;
BEGIN
  -- Create org using email domain as the default name
  -- Slug: 'gmail-com-a1b2c3' pattern (domain with random suffix for uniqueness)
  INSERT INTO public.organizations (name, slug, plan_tier)
  VALUES (
    split_part(NEW.email, '@', 2),
    lower(replace(split_part(NEW.email, '@', 2), '.', '-'))
      || '-'
      || substr(gen_random_uuid()::text, 1, 6),
    'starter'
  )
  RETURNING id INTO new_org_id;

  -- Create default workspace
  INSERT INTO public.workspaces (org_id, name, slug)
  VALUES (new_org_id, 'My Workspace', 'my-workspace')
  RETURNING id INTO new_workspace_id;

  -- Make the new user an Owner of their org
  INSERT INTO public.org_members (org_id, user_id, role, joined_at)
  VALUES (new_org_id, NEW.id, 'owner', now());

  RETURN NEW;
END;
$$;

-- Trigger: fires once per new user, after the auth.users row is committed
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();
