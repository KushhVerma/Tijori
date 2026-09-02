import "server-only"

import { resolveMediaUrl } from "@/lib/r2/media"
import type { ItemWithTags } from "@/lib/items/types"

export interface XAuthor {
  name: string | null
  handle: string | null
  avatarUrl: string | null
  verified: boolean
}

export interface ResolvedItem extends ItemWithTags {
  mediaUrl: string | null
  thumbnailUrl: string | null
  /** Link-preview image fetched at save time for URL-based sources (raw_meta.previewImageUrl). */
  previewImageUrl: string | null
  /** Full tweet text with real line breaks preserved (title is a flattened,
   * single-line copy of this — see actions/items.ts). X items only. */
  tweetText: string | null
  /** Real author identity from X's syndication endpoint — see lib/items/x-embed.ts. */
  xAuthor: XAuthor | null
}

function str(value: unknown): string | null {
  return typeof value === "string" ? value : null
}

export async function resolveItemMedia(item: ItemWithTags): Promise<ResolvedItem> {
  const [mediaUrl, thumbnailUrl] = await Promise.all([
    resolveMediaUrl(item.media_key),
    resolveMediaUrl(item.thumbnail_key),
  ])

  const previewImageUrl = str(item.raw_meta?.previewImageUrl)
  const tweetText = str(item.raw_meta?.tweetText)
  const authorHandle = str(item.raw_meta?.authorHandle)

  const xAuthor: XAuthor | null = authorHandle
    ? {
        name: str(item.raw_meta?.authorName),
        handle: authorHandle,
        avatarUrl: str(item.raw_meta?.authorAvatarUrl),
        verified: Boolean(item.raw_meta?.verified),
      }
    : null

  return { ...item, mediaUrl, thumbnailUrl, previewImageUrl, tweetText, xAuthor }
}

export async function resolveItemsMedia(items: ItemWithTags[]): Promise<ResolvedItem[]> {
  return Promise.all(items.map(resolveItemMedia))
}
