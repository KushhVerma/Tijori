"use server"

import { revalidatePath } from "next/cache"

import { requireUser } from "@/lib/auth/current-user"
import { detectSourceFromUrl, extractDomain } from "@/lib/items/source-detection"
import { resolvePreview } from "@/lib/items/enrich"
import { defaultTitle } from "@/lib/items/constants"
import * as itemsService from "@/lib/items/service"
import type { SourceType, MediaKind } from "@/lib/supabase/types"

function refresh() {
  revalidatePath("/", "layout")
}

export interface CreateFromUrlInput {
  url: string
  title?: string
  notes?: string
  tagNames?: string[]
  sourceType?: SourceType // lets the user override auto-detection
}

export async function createItemFromUrlAction(input: CreateFromUrlInput) {
  const { supabase, user } = await requireUser()

  const sourceType = input.sourceType ?? detectSourceFromUrl(input.url)
  const domain = extractDomain(input.url)

  // Only enrich for title/image when the user didn't already give one —
  // saving should never be blocked or slowed down by a flaky fetch. X is
  // the one exception: it still needs the (free, fast) syndication lookup
  // even with a manual title, since that's the only way to classify the
  // save as a Post vs. an Article for the X category's sub-tabs.
  const needsPreview = !input.title || sourceType === "x"
  const preview = needsPreview ? await resolvePreview(input.url, sourceType) : null

  const item = await itemsService.createItem(supabase, user.id, {
    sourceType,
    xKind: preview?.xKind ?? null,
    url: input.url,
    domain,
    title: input.title || preview?.title || defaultTitle(sourceType, domain),
    notes: input.notes || null,
    thumbnailKey: null,
    rawMeta: preview?.imageUrl ? { ...preview.rawMeta, previewImageUrl: preview.imageUrl } : {},
    organized: true, // deliberate web save via the full Add Inspiration flow
    ingestSource: "web",
    ingestStatus: "ready",
    tagNames: input.tagNames,
  })

  refresh()
  return item
}

export interface CreateFromUploadInput {
  mediaKey: string
  mediaKind: MediaKind
  sourceType: Extract<SourceType, "screenshot" | "screen_recording">
  width?: number
  height?: number
  durationSeconds?: number
  title?: string
  notes?: string
  tagNames?: string[]
}

export async function createItemFromUploadAction(input: CreateFromUploadInput) {
  const { supabase, user } = await requireUser()

  const item = await itemsService.createItem(supabase, user.id, {
    sourceType: input.sourceType,
    mediaKey: input.mediaKey,
    mediaKind: input.mediaKind,
    width: input.width ?? null,
    height: input.height ?? null,
    durationSeconds: input.durationSeconds ?? null,
    title: input.title || null,
    notes: input.notes || null,
    organized: true,
    ingestSource: "web",
    ingestStatus: "ready",
    tagNames: input.tagNames,
  })

  refresh()
  return item
}

export interface UpdateItemFieldsInput {
  title?: string | null
  notes?: string | null
  favorite?: boolean
  sourceType?: SourceType
  tagNames?: string[]
}

export async function updateItemAction(id: string, input: UpdateItemFieldsInput) {
  const { supabase, user } = await requireUser()

  const item = await itemsService.updateItem(supabase, user.id, id, {
    ...input,
    // Any deliberate edit graduates an item out of the Inbox.
    organized: true,
  })

  refresh()
  return item
}

export async function toggleFavoriteAction(id: string, favorite: boolean) {
  const { supabase, user } = await requireUser()
  await itemsService.toggleFavorite(supabase, user.id, id, favorite)
  refresh()
}

export async function deleteItemAction(id: string) {
  const { supabase, user } = await requireUser()
  await itemsService.deleteItem(supabase, user.id, id)
  refresh()
}

/** `position` is computed client-side as the midpoint between the item's new
 * neighbours — see components/library/item-grid.tsx. */
export async function reorderItemAction(id: string, position: number) {
  const { supabase, user } = await requireUser()
  await itemsService.reorderItem(supabase, user.id, id, position)
  refresh()
}

/** Used once per view — the drag that first switches it into "Custom
 * order" — to establish a correct position baseline. See
 * itemsService.reorderAllItems for why this needs to renumber everything
 * rather than just the one dragged item. */
export async function reorderAllItemsAction(orderedIds: string[]) {
  const { supabase, user } = await requireUser()
  await itemsService.reorderAllItems(supabase, user.id, orderedIds)
  refresh()
}
