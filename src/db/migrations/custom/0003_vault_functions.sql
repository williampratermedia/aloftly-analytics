-- ─────────────────────────────────────────────────────────────────────────────
-- Vault Helper Functions: encrypted credential storage
-- FOUN-09
--
-- Uses Supabase Vault (pgsodium) for at-rest encryption of integration credentials.
-- Only service_role can call these functions — anon and authenticated are revoked.
--
-- IMPORTANT: Never insert secrets via raw SQL — Postgres statement logging will
-- capture the plaintext value. Use the Supabase Dashboard Vault UI or SDK RPC.
-- See: https://supabase.com/docs/guides/database/vault
-- ─────────────────────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS private;

-- ─── store_integration_credential ────────────────────────────────────────────
-- Stores an encrypted credential in Vault and returns the secret ID.
-- The secret ID (UUID) is stored in integration_connections.vault_secret_id.
-- The actual credential value never leaves Vault.

CREATE OR REPLACE FUNCTION private.store_integration_credential(
  p_secret      text,
  p_name        text,
  p_description text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  secret_id uuid;
BEGIN
  SELECT vault.create_secret(p_secret, p_name, p_description) INTO secret_id;
  RETURN secret_id;
END;
$$;

-- Restrict to service_role only (bypasses RLS — ingestion paths only)
REVOKE ALL ON FUNCTION private.store_integration_credential FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.store_integration_credential TO service_role;

-- ─── get_integration_credential ──────────────────────────────────────────────
-- Retrieves and decrypts a stored credential by its Vault secret ID.
-- Called only from server-side ingestion code using the service client.

CREATE OR REPLACE FUNCTION private.get_integration_credential(
  p_secret_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  secret_value text;
BEGIN
  SELECT decrypted_secret
  INTO secret_value
  FROM vault.decrypted_secrets
  WHERE id = p_secret_id;

  RETURN secret_value;
END;
$$;

-- Restrict to service_role only
REVOKE ALL ON FUNCTION private.get_integration_credential FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.get_integration_credential TO service_role;
