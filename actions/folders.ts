"use server"

import { revalidatePath } from "next/cache"

import { requireUser } from "@/lib/auth/current-user"
import * as foldersService from "@/lib/folders/service"

export async function listFoldersAction() {
  const { supabase, user } = await requireUser()
  return foldersService.listFolders(supabase, user.id)
}

export async function createFolderAction(name: string) {
  const { supabase, user } = await requireUser()
  const folder = await foldersService.createFolder(supabase, user.id, name)
  revalidatePath("/", "layout")
  return folder
}

export async function deleteFolderAction(folderId: string) {
  const { supabase, user } = await requireUser()
  await foldersService.deleteFolder(supabase, user.id, folderId)
  revalidatePath("/", "layout")
}

export async function listItemFolderIdsAction(itemId: string) {
  const { supabase } = await requireUser()
  return foldersService.listItemFolderIds(supabase, itemId)
}

/** Adds an item to a folder — purely additive, see lib/folders/service.ts. */
export async function addItemToFolderAction(itemId: string, folderId: string) {
  const { supabase } = await requireUser()
  await foldersService.addItemToFolder(supabase, itemId, folderId)
  revalidatePath("/", "layout")
}

export async function removeItemFromFolderAction(itemId: string, folderId: string) {
  const { supabase } = await requireUser()
  await foldersService.removeItemFromFolder(supabase, itemId, folderId)
  revalidatePath("/", "layout")
}
