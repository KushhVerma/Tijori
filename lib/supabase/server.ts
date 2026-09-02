import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env"
import type { Database } from "@/lib/supabase/types"

// For use in Server Components, Server Actions, and Route Handlers.
// `cookies()` is async as of Next.js 15/16.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Called from a Server Component with no request context to write
          // cookies into — safe to ignore as long as proxy.ts refreshes the
          // session on every request (see proxy.ts).
        }
      },
    },
  })
}
