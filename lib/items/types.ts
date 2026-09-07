import type {
  IngestSource,
  IngestStatus,
  ItemRow,
  MediaKind,
  SourceType,
  XKind,
} from "@/lib/supabase/types"

export interface ItemTagRef {
  id: string
  name: string
}

export interface ItemWithTags extends ItemRow {
  tags: ItemTagRef[]
}

export interface ListItemsFilters {
  sourceType?: SourceType
  /** Only meaningful when sourceType is "x" — the Posts/Articles sub-tabs. */
  xKind?: XKind
  tagId?: string
  folderId?: string
  favorite?: boolean
  /** undefined = no filter, false = Inbox-only, true = organized-only */
  organized?: boolean
  query?: string
  sort?: "newest" | "oldest" | "custom"
  limit?: number
}

export interface CreateItemInput {
  sourceType: SourceType
  xKind?: XKind | null
  title?: string | null
  url?: string | null
  domain?: string | null
  notes?: string | null
  mediaKey?: string | null
  mediaKind?: MediaKind | null
  thumbnailKey?: string | null
  width?: number | null
  height?: number | null
  durationSeconds?: number | null
  favorite?: boolean
  organized?: boolean
  ingestSource?: IngestSource
  ingestStatus?: IngestStatus
  rawMeta?: Record<string, unknown>
  tagNames?: string[]
}

export type UpdateItemInput = Partial<Omit<CreateItemInput, "sourceType">> & {
  sourceType?: SourceType
}
