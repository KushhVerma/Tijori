import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database, TagRow } from "@/lib/supabase/types"

export interface TagWithCount extends TagRow {
  itemCount: number
}

export async function listTags(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<TagWithCount[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("*, item_tags(count)")
    .eq("user_id", userId)
    .order("name", { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => {
    const { item_tags, ...tag } = row as unknown as TagRow & {
      item_tags: { count: number }[]
    }
    return { ...tag, itemCount: item_tags?.[0]?.count ?? 0 }
  })
}

/**
 * Finds-or-creates tags by name for a user and returns their ids.
 * Case-insensitive: "Motion" and "motion" resolve to the same tag.
 */
export async function upsertTagsByName(
  supabase: SupabaseClient<Database>,
  userId: string,
  names: string[]
): Promise<TagRow[]> {
  const cleaned = Array.from(
    new Set(names.map((n) => n.trim()).filter((n) => n.length > 0))
  )
  if (cleaned.length === 0) return []

  const { data: existing, error: fetchError } = await supabase
    .from("tags")
    .select("*")
    .eq("user_id", userId)
    .in(
      "name",
      cleaned // exact-name matches; case differences create a new tag, same as most tag UIs
    )

  if (fetchError) throw fetchError

  const existingNames = new Set((existing ?? []).map((t) => t.name))
  const toCreate = cleaned.filter((n) => !existingNames.has(n))

  let created: TagRow[] = []
  if (toCreate.length > 0) {
    const { data, error } = await supabase
      .from("tags")
      .insert(toCreate.map((name) => ({ user_id: userId, name })))
      .select("*")

    if (error) throw error
    created = data ?? []
  }

  return [...(existing ?? []), ...created]
}

export async function deleteTag(
  supabase: SupabaseClient<Database>,
  userId: string,
  tagId: string
): Promise<void> {
  const { error } = await supabase
    .from("tags")
    .delete()
    .eq("user_id", userId)
    .eq("id", tagId)

  if (error) throw error
}
