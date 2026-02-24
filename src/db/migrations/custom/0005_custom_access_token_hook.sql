-- ─────────────────────────────────────────────────────────────────────────────
-- Custom Access Token Hook: inject org_id and user_role into JWT claims
-- FOUN-03, FOUN-04
--
-- This function runs BEFORE every JWT issuance (login, refresh, session restore).
-- It reads the user's primary org membership and injects org_id + user_role
-- as top-level JWT claims. RLS policies then use auth.jwt()->>'org_id' with
-- no subqueries required.
--
-- Source: https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook
--
-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  POST-MIGRATION MANUAL STEP (REQUIRED):                                  ║
-- ║  Register this hook in Supabase Dashboard:                               ║
-- ║  Authentication → Hooks → Custom Access Token →                          ║
-- ║  select public.custom_access_token_hook → Enable                         ║
-- ║                                                                          ║
-- ║  WITHOUT this step, the function exists but Supabase Auth will NOT call  ║
-- ║  it. JWT claims will be empty and ALL RLS policies will fail.            ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- IMPORTANT: This hook only modifies the JWT — not the auth response object.
-- To read custom claims in server components, read from supabase.auth.getUser()
-- and decode the access token, or read session.access_token claims via the
-- @supabase/ssr session object.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims      jsonb;
  user_org_id uuid;
  user_role   text;
BEGIN
  -- Look up the user's primary org membership
  -- LIMIT 1: users can belong to multiple orgs (post-V1 feature); for now,
  -- the first org is used. The UI will handle org switching at the app layer.
  SELECT om.org_id, om.role::text
  INTO user_org_id, user_role
  FROM public.org_members om
  WHERE om.user_id = (event->>'user_id')::uuid
  ORDER BY om.joined_at ASC
  LIMIT 1;

  claims := event->'claims';

  -- Only inject claims if the user has an org (new users may not yet,
  -- if the provisioning trigger hasn't run — this handles the edge case)
  IF user_org_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{org_id}',    to_jsonb(user_org_id::text));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  END IF;

  RETURN jsonb_build_object('claims', claims);
END;
$$;

-- Required: grant execute to supabase_auth_admin (the role Supabase Auth uses to call hooks)
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Revoke from all other roles — this function must only be called by Supabase Auth
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM anon;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated;
