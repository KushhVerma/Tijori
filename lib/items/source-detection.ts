import type { SourceType } from "@/lib/supabase/types"

const HOST_RULES: Array<{ test: RegExp; source: SourceType }> = [
  { test: /(^|\.)instagram\.com$/, source: "instagram" },
  { test: /(^|\.)reddit\.com$/, source: "reddit" },
  { test: /(^|\.)redd\.it$/, source: "reddit" },
  { test: /(^|\.)x\.com$/, source: "x" },
  { test: /(^|\.)twitter\.com$/, source: "x" },
  { test: /(^|\.)medium\.com$/, source: "medium" },
  { test: /(^|\.)youtube\.com$/, source: "youtube" },
  { test: /(^|\.)youtu\.be$/, source: "youtube" },
]

export function extractDomain(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl)
    return url.hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

/** Detects the source type for a pasted URL. Falls back to "website". */
export function detectSourceFromUrl(rawUrl: string): SourceType {
  const domain = extractDomain(rawUrl)
  if (!domain) return "website"

  // Medium also powers many custom-domain blogs (e.g. blog.mycompany.com);
  // matching only the medium.com host keeps this a safe, low-false-positive
  // heuristic rather than trying to sniff every custom domain.
  const rule = HOST_RULES.find(({ test }) => test.test(domain))
  return rule?.source ?? "website"
}

/** Detects the source type for a directly uploaded file. */
export function detectSourceFromFile(mimeType: string): Extract<SourceType, "screenshot" | "screen_recording"> {
  return mimeType.startsWith("video/") ? "screen_recording" : "screenshot"
}

export function detectMediaKind(mimeType: string): "image" | "video" {
  return mimeType.startsWith("video/") ? "video" : "image"
}
