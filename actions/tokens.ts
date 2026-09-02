"use server"

import { revalidatePath } from "next/cache"

import { requireUser } from "@/lib/auth/current-user"
import * as tokensService from "@/lib/tokens/service"

export async function listApiTokensAction() {
  const { supabase, user } = await requireUser()
  return tokensService.listApiTokens(supabase, user.id)
}

export async function createApiTokenAction(name: string) {
  const { supabase, user } = await requireUser()
  const result = await tokensService.createApiToken(supabase, user.id, name.trim() || "Untitled")
  revalidatePath("/settings")
  return result
}

export async function deleteApiTokenAction(id: string) {
  const { supabase, user } = await requireUser()
  await tokensService.deleteApiToken(supabase, user.id, id)
  revalidatePath("/settings")
}
