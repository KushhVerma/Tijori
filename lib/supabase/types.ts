// Hand-written types matching supabase/migrations/0001_init.sql.
// Once the project is linked, these can be regenerated with:
//   npx supabase gen types typescript --linked > lib/supabase/types.ts
// (keep the manual shape below as a fallback / reference in the meantime)
//
// Note: these are `type` aliases, not `interface`s, on purpose — supabase-js
// checks `Row extends Record<string, unknown>` internally, and TypeScript's
// conditional-type `extends` check only holds for type aliases, not plain
// interfaces (interfaces stay "open" for declaration merging, so they don't
// structurally satisfy an index-signature constraint the same way). Using
// `interface` here silently degrades every query's return type to `never`.

export type SourceType =
  | "screenshot"
  | "screen_recording"
  | "instagram"
  | "reddit"
  | "x"
  | "medium"
  | "youtube"
  | "website"

/** Only meaningful when source_type is "x" — splits X saves into the
 * Posts/Articles sub-tabs. Null for every other source type. */
export type XKind = "post" | "article"

export type MediaKind = "image" | "video"
export type IngestSource = "web" | "extension" | "ios" | "api"
export type IngestStatus = "pending" | "ready" | "failed"

export type ItemRow = {
  id: string
  user_id: string
  source_type: SourceType
  x_kind: XKind | null
  title: string | null
  url: string | null
  domain: string | null
  notes: string | null
  favorite: boolean
  organized: boolean
  media_key: string | null
  media_kind: MediaKind | null
  thumbnail_key: string | null
  width: number | null
  height: number | null
  duration_seconds: number | null
  ingest_source: IngestSource
  ingest_status: IngestStatus
  raw_meta: Record<string, unknown>
  /** Manual drag-and-drop order (fractional index). Null on rows created
   * before this existed until backfilled. */
  position: number | null
  created_at: string
  updated_at: string
}

export type TagRow = {
  id: string
  user_id: string
  name: string
  created_at: string
}

export type ItemTagRow = {
  item_id: string
  tag_id: string
}

export type ApiTokenRow = {
  id: string
  user_id: string
  name: string
  token_hash: string
  last_used_at: string | null
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      items: {
        Row: ItemRow
        Insert: Partial<ItemRow> & Pick<ItemRow, "user_id" | "source_type">
        Update: Partial<ItemRow>
        Relationships: []
      }
      tags: {
        Row: TagRow
        Insert: Partial<TagRow> & Pick<TagRow, "user_id" | "name">
        Update: Partial<TagRow>
        Relationships: []
      }
      item_tags: {
        Row: ItemTagRow
        Insert: ItemTagRow
        Update: Partial<ItemTagRow>
        Relationships: []
      }
      api_tokens: {
        Row: ApiTokenRow
        Insert: Partial<ApiTokenRow> & Pick<ApiTokenRow, "user_id" | "name" | "token_hash">
        Update: Partial<ApiTokenRow>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
