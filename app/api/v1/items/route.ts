import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { resolveActor } from "@/lib/auth/resolve-actor"
import * as itemsService from "@/lib/items/service"
import { detectSourceFromUrl, extractDomain } from "@/lib/items/source-detection"
import { resolvePreview } from "@/lib/items/enrich"
import { defaultTitle, sourceMeta } from "@/lib/items/constants"

// The shared ingestion endpoint: the web app calls this today via its
// session cookie, and it's what the browser extension / iOS share sheet
// call via a bearer `api_tokens` token — see lib/auth/resolve-actor.ts. No
// client-specific logic lives here; the same link-preview enrichment
// (lib/items/enrich.ts) runs regardless of which client is saving.

const createItemSchema = z.object({
  url: z.string().url().optional(),
  title: z.string().optional(),
  notes: z.string().optional(),
  sourceType: z
    .enum(["screenshot", "screen_recording", "instagram", "reddit", "x", "medium", "youtube", "website"])
    .optional(),
  mediaKey: z.string().optional(),
  mediaKind: z.enum(["image", "video"]).optional(),
  tagNames: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  const actor = await resolveActor(request)
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const params = request.nextUrl.searchParams
  const items = await itemsService.listItems(actor.supabase, actor.userId, {
    sourceType: (params.get("sourceType") as never) ?? undefined,
    favorite: params.has("favorite") ? params.get("favorite") === "true" : undefined,
    organized: params.has("organized") ? params.get("organized") === "true" : undefined,
    query: params.get("q") ?? undefined,
    sort: (params.get("sort") as "newest" | "oldest") ?? undefined,
  })

  return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
  const actor = await resolveActor(request)
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = createItemSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 })
  }

  const input = parsed.data
  if (!input.url && !input.mediaKey) {
    return NextResponse.json({ error: "One of url or mediaKey is required" }, { status: 400 })
  }

  const sourceType =
    input.sourceType ?? (input.url ? detectSourceFromUrl(input.url) : "screenshot")
  const domain = input.url ? extractDomain(input.url) : null

  // Only enrich when the caller didn't already give a title, and only for
  // URL-based saves — an uploaded file has nothing to fetch. Mirrors
  // actions/items.ts's web flow so every client gets the same real
  // title/thumbnail instead of the API-only path being a lesser experience.
  // X is the one exception to "skip if titled": it still needs the (free,
  // fast) syndication lookup to classify the save as a Post vs. an Article
  // for the X category's sub-tabs.
  const needsPreview = Boolean(input.url) && (!input.title || sourceType === "x")
  const preview = needsPreview
    ? await resolvePreview(input.url!, sourceType).catch(() => null)
    : null

  // Items created off-web arrive low-friction and unorganized by design —
  // this is exactly what populates the Inbox. The web app's own Add
  // Inspiration flow sets organized:true explicitly via the server action
  // instead of this route, since it already collects real details.
  const item = await itemsService.createItem(actor.supabase, actor.userId, {
    sourceType,
    xKind: preview?.xKind ?? null,
    url: input.url ?? null,
    domain,
    title: input.title || preview?.title || defaultTitle(sourceType, domain),
    notes: input.notes ?? null,
    mediaKey: input.mediaKey ?? null,
    mediaKind: input.mediaKind ?? null,
    rawMeta: preview?.imageUrl ? { ...preview.rawMeta, previewImageUrl: preview.imageUrl } : {},
    organized: actor.ingestSource === "web",
    ingestSource: actor.ingestSource,
    ingestStatus: "ready",
    tagNames: input.tagNames,
  })

  return NextResponse.json({ item, sourceSlug: sourceMeta(sourceType).slug }, { status: 201 })
}
