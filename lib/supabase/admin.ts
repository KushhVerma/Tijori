import "server-only"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env"
import type { Database } from "@/lib/supabase/types"

// Bypasses RLS. Only for trusted server-side paths that have already
// authenticated the caller themselves (e.g. bearer-token API routes for
// future extension/mobile clients). Never import this into anything that
// runs in — or is bundled for — the browser.
export function createAdminClient() {
  return createSupabaseClient<Database>(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
