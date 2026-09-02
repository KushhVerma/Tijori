"use server"

import { revalidatePath } from "next/cache"

import { requireUser } from "@/lib/auth/current-user"
import * as tagsService from "@/lib/tags/service"

export async function listTagsAction() {
  const { supabase, user } = await requireUser()
  return tagsService.listTags(supabase, user.id)
}

export async function deleteTagAction(tagId: string) {
  const { supabase, user } = await requireUser()
  await tagsService.deleteTag(supabase, user.id, tagId)
  revalidatePath("/", "layout")
}
