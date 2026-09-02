import "server-only"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

/** For Server Components / Server Actions. proxy.ts already gates page
 * access, but Server Actions can be invoked directly, so this is the
 * real enforcement point for mutations. */
export async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return { supabase, user }
}
