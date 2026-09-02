import "server-only"

import type { NextRequest } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"

import { resolveUserFromApiToken } from "@/lib/auth/api-tokens"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { Database, IngestSource } from "@/lib/supabase/types"

export interface Actor {
  supabase: SupabaseClient<Database>
  userId: string
  ingestSource: IngestSource
}

/**
 * Authenticates a request to the ingestion API two ways: a bearer
 * `api_tokens` token (how the future browser extension / iOS app will
 * authenticate, since they can't share the web app's session cookie) or the
 * normal Supabase session cookie (how the web app itself calls its own API
 * today). Every `/api/v1/*` route calls this once and is otherwise
 * client-agnostic.
 */
export async function resolveActor(request: NextRequest): Promise<Actor | null> {
  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]

  if (bearer) {
    const userId = await resolveUserFromApiToken(bearer)
    if (!userId) return null
    // Admin client bypasses RLS — every call site must filter by userId itself.
    return { supabase: createAdminClient(), userId, ingestSource: "api" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  return { supabase, userId: user.id, ingestSource: "web" }
}
