import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database, FolderRow } from "@/lib/supabase/types"

export async function listFolders(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<FolderRow[]> {
  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getFolder(
  supabase: SupabaseClient<Database>,
  userId: string,
  folderId: string
): Promise<FolderRow | null> {
  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", userId)
    .eq("id", folderId)
    .maybeSingle()

  if (error) throw error
  return data
}

/** Case-sensitive exact-name match, same convention as tags — a different
 * case creates a separate folder, same as most folder/tag UIs. */
export async function createFolder(
  supabase: SupabaseClient<Database>,
  userId: string,
  name: string
): Promise<FolderRow> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error("Folder name can't be empty")

  const { data: existing, error: fetchError } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", userId)
    .eq("name", trimmed)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (existing) return existing

  const { data, error } = await supabase
    .from("folders")
    .insert({ user_id: userId, name: trimmed })
    .select("*")
    .single()

  if (error) throw error
  return data
}

export async function deleteFolder(
  supabase: SupabaseClient<Database>,
  userId: string,
  folderId: string
): Promise<void> {
  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("user_id", userId)
    .eq("id", folderId)

  if (error) throw error
}

/** Which folders a given item currently belongs to — used to show
 * checkmarks in the "Move to…" menu. */
export async function listItemFolderIds(
  supabase: SupabaseClient<Database>,
  itemId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("item_folders")
    .select("folder_id")
    .eq("item_id", itemId)

  if (error) throw error
  return (data ?? []).map((row) => row.folder_id)
}

/** Adding an item to a folder is purely additive — it never removes the
 * item from its source category, tags, or any other folder it's already
 * in. Silently no-ops if it's already there. */
export async function addItemToFolder(
  supabase: SupabaseClient<Database>,
  itemId: string,
  folderId: string
): Promise<void> {
  const { error } = await supabase
    .from("item_folders")
    .upsert({ item_id: itemId, folder_id: folderId }, { onConflict: "item_id,folder_id" })

  if (error) throw error
}

export async function removeItemFromFolder(
  supabase: SupabaseClient<Database>,
  itemId: string,
  folderId: string
): Promise<void> {
  const { error } = await supabase
    .from("item_folders")
    .delete()
    .eq("item_id", itemId)
    .eq("folder_id", folderId)

  if (error) throw error
}
