import {
  Camera02Icon,
  Video02Icon,
  InstagramIcon,
  RedditIcon,
  NewTwitterIcon,
  MediumIcon,
  YoutubeIcon,
  GlobeIcon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"

import type { SourceType, XKind } from "@/lib/supabase/types"

export interface SourceMeta {
  value: SourceType
  label: string
  /** Segment used in /source/[type] — kept distinct from the DB value so
   * the URL can stay stable even if the DB value ever needs to change. */
  slug: string
  icon: IconSvgElement
}

export const SOURCE_TYPES: SourceMeta[] = [
  { value: "screenshot", label: "Screenshots", slug: "screenshots", icon: Camera02Icon },
  { value: "screen_recording", label: "Screen Recordings", slug: "screen-recordings", icon: Video02Icon },
  { value: "instagram", label: "Instagram", slug: "instagram", icon: InstagramIcon },
  { value: "reddit", label: "Reddit", slug: "reddit", icon: RedditIcon },
  { value: "x", label: "X", slug: "x", icon: NewTwitterIcon },
  { value: "medium", label: "Medium", slug: "medium", icon: MediumIcon },
  { value: "youtube", label: "YouTube", slug: "youtube", icon: YoutubeIcon },
  { value: "website", label: "Websites", slug: "website", icon: GlobeIcon },
]

const BY_SLUG = new Map(SOURCE_TYPES.map((s) => [s.slug, s]))
const BY_VALUE = new Map(SOURCE_TYPES.map((s) => [s.value, s]))

export function sourceMetaBySlug(slug: string): SourceMeta | undefined {
  return BY_SLUG.get(slug)
}

export function sourceMeta(value: SourceType): SourceMeta {
  const meta = BY_VALUE.get(value)
  if (!meta) throw new Error(`Unknown source type: ${value}`)
  return meta
}

const DEFAULT_TITLES: Record<SourceType, string> = {
  screenshot: "Screenshot",
  screen_recording: "Screen recording",
  instagram: "Instagram post",
  reddit: "Reddit post",
  x: "Post on X",
  medium: "Medium article",
  youtube: "YouTube video",
  website: "Saved link",
}

// Some sites' <title>/og:title fall back to just their own brand name when
// they don't server-render real content for a given page (Instagram post
// permalinks do this, for example). A title that's just the platform's own
// name isn't useful to show the user, so treat it the same as "no title".
const GENERIC_TITLES = new Set(["instagram", "x", "twitter", "reddit", "medium"])

// Some fetchers fall back to a raw filename or CDN URL fragment when a page
// has no real title to offer (e.g. right-clicking straight on an image) —
// "photo-v0-abc123.png?width=1080&crop=smart&s=..." is not a title. Real
// titles are human sentences with spaces; these patterns catch what isn't.
const LOOKS_LIKE_FILENAME = /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?|$)/i
const LOOKS_LIKE_QUERY_STRING = /[?&][a-z0-9_]+=/i

export function isGenericTitle(title: string | null | undefined): boolean {
  if (!title) return true
  const trimmed = title.trim()
  if (GENERIC_TITLES.has(trimmed.toLowerCase())) return true
  if (LOOKS_LIKE_FILENAME.test(trimmed)) return true
  if (LOOKS_LIKE_QUERY_STRING.test(trimmed) && !trimmed.includes(" ")) return true
  if (trimmed.length > 40 && !trimmed.includes(" ")) return true
  return false
}

export function defaultTitle(sourceType: SourceType, domain: string | null): string {
  return domain && sourceType === "website" ? domain : DEFAULT_TITLES[sourceType]
}

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "custom", label: "Custom order" },
] as const

export type SortOption = (typeof SORT_OPTIONS)[number]["value"]

export function parseSort(value: string | undefined): SortOption {
  return value === "oldest" || value === "custom" ? value : "newest"
}

// Sub-tabs inside the X category page only — every other source ignores
// this. "All" (undefined) isn't in this list; it's the tab's default state.
export const X_KIND_TABS: { value: XKind; label: string }[] = [
  { value: "post", label: "Posts" },
  { value: "article", label: "Articles" },
]

export function parseXKind(value: string | undefined): XKind | undefined {
  return value === "post" || value === "article" ? value : undefined
}
