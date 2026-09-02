import "server-only"

import { randomBytes, createHash, timingSafeEqual } from "node:crypto"

import { createAdminClient } from "@/lib/supabase/admin"

const TOKEN_PREFIX = "tijori_"

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

/** Generates a new personal access token. Returns the plaintext token once
 * (shown to the user to copy) plus its hash (what actually gets stored). */
export function generateApiToken(): { token: string; hash: string } {
  const token = `${TOKEN_PREFIX}${randomBytes(32).toString("hex")}`
  return { token, hash: hashToken(token) }
}

/**
 * Verifies a bearer token from a future extension/mobile client and returns
 * the owning user id. Uses the admin client since token lookups happen
 * before we know who the caller is (no session cookie to scope RLS by yet).
 */
export async function resolveUserFromApiToken(token: string): Promise<string | null> {
  if (!token.startsWith(TOKEN_PREFIX)) return null

  const admin = createAdminClient()
  const hash = hashToken(token)

  const { data, error } = await admin
    .from("api_tokens")
    .select("id, user_id, token_hash")
    .eq("token_hash", hash)
    .maybeSingle()

  if (error || !data) return null

  // Constant-time compare even though the DB lookup already matched on the
  // hash — defence in depth against timing side-channels on this check.
  const a = Buffer.from(data.token_hash)
  const b = Buffer.from(hash)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  await admin
    .from("api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)

  return data.user_id
}
