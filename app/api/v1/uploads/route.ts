import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { resolveActor } from "@/lib/auth/resolve-actor"
import { buildMediaKey, createUploadUrl, newObjectId } from "@/lib/r2/upload"

// Shared by the web upload flow today and, later, extension/mobile capture —
// issuing a direct-to-R2 signed URL keeps file bytes off the Next.js server
// regardless of which client is uploading.

const MAX_IMAGE_BYTES = 25 * 1024 * 1024
const MAX_VIDEO_BYTES = 200 * 1024 * 1024

const requestSchema = z.object({
  contentType: z.string().min(1),
  sizeBytes: z.number().positive(),
})

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
}

// No browser can render these in an <img> tag — accepting them would create
// an item that's forever a broken image. Reject up front with a clear
// reason instead of silently storing something unusable.
const UNSUPPORTED_TYPES = new Set(["image/heic", "image/heif"])

export async function POST(request: NextRequest) {
  const actor = await resolveActor(request)
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const { contentType, sizeBytes } = parsed.data
  const isImage = contentType.startsWith("image/")
  const isVideo = contentType.startsWith("video/")

  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "Only image/* or video/* uploads are supported" }, { status: 400 })
  }

  if (UNSUPPORTED_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: "HEIC/HEIF images can't be displayed in a browser. Convert it to JPEG or PNG first (Preview → Export, or share it to Photos and re-save)." },
      { status: 400 }
    )
  }

  const limit = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES
  if (sizeBytes > limit) {
    return NextResponse.json(
      { error: `File exceeds the ${Math.round(limit / (1024 * 1024))}MB limit for this type` },
      { status: 400 }
    )
  }

  const extension = EXTENSION_BY_MIME[contentType] ?? (isImage ? "bin" : "bin")
  const objectId = newObjectId()
  const key = buildMediaKey(actor.userId, objectId, extension)
  const uploadUrl = await createUploadUrl(key, contentType)

  return NextResponse.json({
    uploadUrl,
    key,
    mediaKind: isImage ? "image" : "video",
  })
}
