import 'server-only'
import { getServiceClient } from '@/lib/supabase/service'

/**
 * Stores an encrypted integration credential in Supabase Vault.
 *
 * Calls private.store_integration_credential RPC function which uses
 * vault.create_secret() internally. The function is SECURITY DEFINER
 * and restricted to service_role only.
 *
 * @param secret - The plaintext secret value (API key, OAuth token, etc.)
 * @param name - Unique identifier for the secret (e.g. "shopify:org_id:store_id")
 * @param description - Optional human-readable description
 * @returns The Vault secret UUID — store this in integration_connections.vault_secret_id
 *
 * @throws If the Vault RPC call fails
 */
export async function storeCredential(
  secret: string,
  name: string,
  description?: string
): Promise<string> {
  const client = getServiceClient()

  const { data, error } = await client.rpc('store_integration_credential', {
    p_secret: secret,
    p_name: name,
    p_description: description ?? null,
  })

  if (error) {
    throw new Error(`Vault write failed: ${error.message}`)
  }

  return data as string
}

/**
 * Retrieves a decrypted integration credential from Supabase Vault.
 *
 * Calls private.get_integration_credential RPC function which reads from
 * vault.decrypted_secrets. The function is SECURITY DEFINER and restricted
 * to service_role only.
 *
 * @param secretId - The Vault secret UUID (from integration_connections.vault_secret_id)
 * @returns The decrypted secret value
 *
 * @throws If the Vault RPC call fails or the secret does not exist
 */
export async function getCredential(secretId: string): Promise<string> {
  const client = getServiceClient()

  const { data, error } = await client.rpc('get_integration_credential', {
    p_secret_id: secretId,
  })

  if (error) {
    throw new Error(`Vault read failed: ${error.message}`)
  }

  if (data === null || data === undefined) {
    throw new Error(`Vault credential not found: ${secretId}`)
  }

  return data as string
}
