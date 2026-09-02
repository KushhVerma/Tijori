import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { generateApiToken } from "@/lib/auth/api-tokens"
import type { ApiTokenRow, Database } from "@/lib/supabase/types"

export type ApiTokenSummary = Omit<ApiTokenRow, "token_hash">

/** Never returns token_hash — only the create step ever sees the plaintext,
 * and nothing after that should be able to read the hash back out either. */
const SAFE_COLUMNS = "id, user_id, name, last_used_at, created_at"

export async function listApiTokens(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ApiTokenSummary[]> {
  const { data, error } = await supabase
    .from("api_tokens")
    .select(SAFE_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data ?? []
}

/** Returns the plaintext token — this is the one and only time it's ever
 * visible again, so the caller must show it to the user immediately. */
export async function createApiToken(
  supabase: SupabaseClient<Database>,
  userId: string,
  name: string
): Promise<{ token: string; summary: ApiTokenSummary }> {
  const { token, hash } = generateApiToken()

  const { data, error } = await supabase
    .from("api_tokens")
    .insert({ user_id: userId, name, token_hash: hash })
    .select(SAFE_COLUMNS)
    .single()

  if (error) throw error
  return { token, summary: data }
}

export async function deleteApiToken(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
): Promise<void> {
  const { error } = await supabase.from("api_tokens").delete().eq("user_id", userId).eq("id", id)
  if (error) throw error
}
