import "server-only"

const FETCH_TIMEOUT_MS = 12_000

// When a page has no real og:image, Microlink falls back to guessing the
// "best" <img> on the page — which can be a tiny favicon or a small icon
// (e.g. a 24x24 "view on GitHub" badge), not real content. Reject anything
// under this size rather than show something that isn't actually a preview.
const MIN_IMAGE_DIMENSION = 160

export interface RenderedPreview {
  title: string | null
  description: string | null
  imageUrl: string | null
}

// Fallback for pages lib/items/link-preview.ts can't read — mainly sites
// that render their content client-side (Instagram post permalinks are the
// main case). Microlink's public endpoint runs a real headless browser and
// works without an API key at personal-use volume — no account needed.
//
// This asks for rendered metadata (title/description/image), not a
// screenshot: it reads the same data the page would put in its own OG tags
// if it server-rendered them, so there's no "sign up" nag baked into the
// result the way there would be with a literal screenshot of a logged-out
// session.
export async function fetchRenderedPreview(url: string): Promise<RenderedPreview> {
  const empty: RenderedPreview = { title: null, description: null, imageUrl: null }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const endpoint = new URL("https://api.microlink.io/")
    endpoint.searchParams.set("url", url)
    endpoint.searchParams.set("meta", "true")
    endpoint.searchParams.set("waitUntil", "networkidle2")

    const response = await fetch(endpoint.toString(), { signal: controller.signal })
    if (!response.ok) return empty

    const body = (await response.json()) as {
      status?: string
      data?: {
        title?: string
        description?: string
        publisher?: string
        image?: { url?: string; width?: number; height?: number }
      }
    }

    if (body.status !== "success" || !body.data) return empty

    // Titles often come back as "Real Name (@handle) • <Publisher> photos and
    // videos" — strip the generic publisher boilerplate off the end so what's
    // left is the specific, useful part.
    let title = body.data.title ?? null
    if (title && body.data.publisher) {
      title = title.split(`• ${body.data.publisher}`)[0].trim() || title
    }

    const image = body.data.image
    const isRealImage =
      image?.url &&
      (image.width ?? 0) >= MIN_IMAGE_DIMENSION &&
      (image.height ?? 0) >= MIN_IMAGE_DIMENSION

    return {
      title,
      description: body.data.description ?? null,
      imageUrl: isRealImage ? image.url! : null,
    }
  } catch {
    return empty
  } finally {
    clearTimeout(timeout)
  }
}
