import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { upsertTagsByName } from "@/lib/tags/service"
import type { Database, ItemRow } from "@/lib/supabase/types"
import type { CreateItemInput, ItemWithTags, ListItemsFilters, UpdateItemInput } from "@/lib/items/types"

type ItemRowWithTagJoin = ItemRow & {
  item_tags: { tags: { id: string; name: string } }[]
}

const SELECT_WITH_TAGS = "*, item_tags(tags(id, name))"

function toItemWithTags(row: ItemRowWithTagJoin): ItemWithTags {
  const { item_tags, ...item } = row
  return { ...item, tags: (item_tags ?? []).map((rel) => rel.tags) }
}

/**
 * Resolves which item ids match a free-text query, searching both item
 * content (via the `search_vector` tsvector column) and tag names. Kept as
 * its own step so a future semantic/embedding search can replace just this
 * function without touching `listItems` or any caller.
 */
async function matchingItemIds(
  supabase: SupabaseClient<Database>,
  userId: string,
  query: string
): Promise<string[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const like = `%${trimmed}%`

  const [textMatches, tagMatches] = await Promise.all([
    supabase
      .from("items")
      .select("id")
      .eq("user_id", userId)
      .textSearch("search_vector", trimmed, { type: "websearch", config: "english" }),
    supabase
      .from("tags")
      .select("item_tags(item_id)")
      .eq("user_id", userId)
      .ilike("name", like),
  ])

  if (textMatches.error) throw textMatches.error
  if (tagMatches.error) throw tagMatches.error

  const ids = new Set<string>()
  for (const row of textMatches.data ?? []) ids.add(row.id)
  for (const tag of tagMatches.data ?? []) {
    for (const rel of (tag as unknown as { item_tags: { item_id: string }[] }).item_tags ?? []) {
      ids.add(rel.item_id)
    }
  }

  return Array.from(ids)
}

export async function listItems(
  supabase: SupabaseClient<Database>,
  userId: string,
  filters: ListItemsFilters = {}
): Promise<ItemWithTags[]> {
  let query = supabase.from("items").select(SELECT_WITH_TAGS).eq("user_id", userId)

  if (filters.sourceType) query = query.eq("source_type", filters.sourceType)
  if (filters.xKind === "article") {
    query = query.eq("x_kind", "article")
  } else if (filters.xKind === "post") {
    // X saves made before this distinction existed have x_kind = null —
    // they were virtually always plain tweets, not article wrappers (only
    // the newer detection logic can even produce "article"), so treat null
    // as "post" rather than leaving old saves stranded in neither tab.
    query = query.or("x_kind.eq.post,x_kind.is.null")
  }
  if (filters.favorite !== undefined) query = query.eq("favorite", filters.favorite)
  if (filters.organized !== undefined) query = query.eq("organized", filters.organized)

  if (filters.tagId) {
    const { data, error } = await supabase
      .from("item_tags")
      .select("item_id")
      .eq("tag_id", filters.tagId)
    if (error) throw error
    const ids = (data ?? []).map((r) => r.item_id)
    if (ids.length === 0) return []
    query = query.in("id", ids)
  }

  if (filters.query) {
    const ids = await matchingItemIds(supabase, userId, filters.query)
    if (ids.length === 0) return []
    query = query.in("id", ids)
  }

  if (filters.sort === "custom") {
    // Nulls-last fallback covers rows saved before drag-and-drop existed,
    // in case a backfill migration hasn't run yet.
    query = query.order("position", { ascending: true, nullsFirst: false })
  } else {
    query = query.order("created_at", { ascending: filters.sort === "oldest" })
  }
  if (filters.limit) query = query.limit(filters.limit)

  const { data, error } = await query
  if (error) throw error

  return (data as unknown as ItemRowWithTagJoin[]).map(toItemWithTags)
}

export async function getItem(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
): Promise<ItemWithTags | null> {
  const { data, error } = await supabase
    .from("items")
    .select(SELECT_WITH_TAGS)
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return toItemWithTags(data as unknown as ItemRowWithTagJoin)
}

function toItemRowInput(userId: string, input: CreateItemInput | UpdateItemInput) {
  return {
    user_id: userId,
    ...(input.sourceType !== undefined && { source_type: input.sourceType }),
    ...(input.xKind !== undefined && { x_kind: input.xKind }),
    ...(input.title !== undefined && { title: input.title }),
    ...(input.url !== undefined && { url: input.url }),
    ...(input.domain !== undefined && { domain: input.domain }),
    ...(input.notes !== undefined && { notes: input.notes }),
    ...(input.mediaKey !== undefined && { media_key: input.mediaKey }),
    ...(input.mediaKind !== undefined && { media_kind: input.mediaKind }),
    ...(input.thumbnailKey !== undefined && { thumbnail_key: input.thumbnailKey }),
    ...(input.width !== undefined && { width: input.width }),
    ...(input.height !== undefined && { height: input.height }),
    ...(input.durationSeconds !== undefined && { duration_seconds: input.durationSeconds }),
    ...(input.favorite !== undefined && { favorite: input.favorite }),
    ...(input.organized !== undefined && { organized: input.organized }),
    ...(input.ingestSource !== undefined && { ingest_source: input.ingestSource }),
    ...(input.ingestStatus !== undefined && { ingest_status: input.ingestStatus }),
    ...(input.rawMeta !== undefined && { raw_meta: input.rawMeta }),
  }
}

/** New items always land at the end of manual/"Custom order" — a wide 1000
 * step leaves plenty of room to drag things between neighbours later without
 * ever needing to renumber the rest of the list. */
async function nextPosition(supabase: SupabaseClient<Database>, userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("items")
    .select("position")
    .eq("user_id", userId)
    .order("position", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return (data?.position ?? 0) + 1000
}

export async function createItem(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CreateItemInput
): Promise<ItemWithTags> {
  const position = await nextPosition(supabase, userId)

  const { data, error } = await supabase
    .from("items")
    .insert({
      ...toItemRowInput(userId, input),
      position,
    } as Database["public"]["Tables"]["items"]["Insert"])
    .select("*")
    .single()

  if (error) throw error

  if (input.tagNames?.length) {
    await setItemTags(supabase, userId, data.id, input.tagNames)
  }

  const withTags = await getItem(supabase, userId, data.id)
  if (!withTags) throw new Error("Failed to load item after creation")
  return withTags
}

export async function updateItem(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  input: UpdateItemInput
): Promise<ItemWithTags> {
  const { tagNames, ...rest } = input

  if (Object.keys(rest).length > 0) {
    const { error } = await supabase
      .from("items")
      .update(toItemRowInput(userId, rest) as Database["public"]["Tables"]["items"]["Update"])
      .eq("user_id", userId)
      .eq("id", id)

    if (error) throw error
  }

  if (tagNames !== undefined) {
    await setItemTags(supabase, userId, id, tagNames)
  }

  const withTags = await getItem(supabase, userId, id)
  if (!withTags) throw new Error("Item not found after update")
  return withTags
}

export async function deleteItem(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string
): Promise<void> {
  const { error } = await supabase.from("items").delete().eq("user_id", userId).eq("id", id)
  if (error) throw error
}

export async function toggleFavorite(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  favorite: boolean
): Promise<void> {
  const { error } = await supabase
    .from("items")
    .update({ favorite })
    .eq("user_id", userId)
    .eq("id", id)
  if (error) throw error
}

/** Moves one item to a new spot in "Custom order". The caller computes
 * `position` as the midpoint between the item's new neighbours (fractional
 * indexing), so this only ever touches the one row being dragged. */
export async function reorderItem(
  supabase: SupabaseClient<Database>,
  userId: string,
  id: string,
  position: number
): Promise<void> {
  const { error } = await supabase
    .from("items")
    .update({ position })
    .eq("user_id", userId)
    .eq("id", id)
  if (error) throw error
}

/**
 * Renumbers a whole list of items into fresh sequential positions, in the
 * given order. Used exactly once per view — the moment a drag first
 * switches that view into "Custom order" (see reorderItemAction vs.
 * reorderAllItemsAction in actions/items.ts). Before that point the items
 * on screen are sorted by something other than `position` (newest/oldest),
 * so `position` values across the table can be stale, missing, or simply
 * unrelated to what's currently visible — computing a single item's new
 * position as the midpoint of its on-screen neighbours is meaningless
 * against neighbours whose stored position doesn't reflect where they
 * actually are. Renumbering the whole visible list once establishes a
 * correct baseline; every drag after that is a normal, cheap single-item
 * midpoint update.
 */
export async function reorderAllItems(
  supabase: SupabaseClient<Database>,
  userId: string,
  orderedIds: string[]
): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("items")
        .update({ position: (index + 1) * 1000 })
        .eq("user_id", userId)
        .eq("id", id)
        .then(({ error }) => {
          if (error) throw error
        })
    )
  )
}

/** Replaces the full tag set on an item (create-by-name for any that don't exist yet). */
export async function setItemTags(
  supabase: SupabaseClient<Database>,
  userId: string,
  itemId: string,
  tagNames: string[]
): Promise<void> {
  const tags = await upsertTagsByName(supabase, userId, tagNames)

  const { error: deleteError } = await supabase.from("item_tags").delete().eq("item_id", itemId)
  if (deleteError) throw deleteError

  if (tags.length === 0) return

  const { error: insertError } = await supabase
    .from("item_tags")
    .insert(tags.map((tag) => ({ item_id: itemId, tag_id: tag.id })))

  if (insertError) throw insertError
}
