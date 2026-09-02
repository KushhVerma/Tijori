import "server-only"

export interface LinkPreview {
  title: string | null
  imageUrl: string | null
  description: string | null
}

const FETCH_TIMEOUT_MS = 6000
const MAX_BYTES = 500_000 // enough for <head>, avoids downloading huge pages

function extractMeta(html: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return decodeHtmlEntities(match[1].trim())
  }
  return null
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

// Sites vary in who they'll serve full OpenGraph tags to. A generic bot UA
// gets many social platforms to bounce the request to a login wall with no
// meta tags at all. Two fallbacks, tried in order, cover the common cases:
//   1. A normal desktop browser UA — works for most plain websites/blogs.
//   2. Meta's own `facebookexternalhit` crawler UA — Instagram/Facebook
//      deliberately serve full OG data to this one, precisely so links
//      preview correctly when shared elsewhere. Same goal we have here.
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
]

async function fetchHtml(url: string, userAgent: string, signal: AbortSignal): Promise<string | null> {
  const response = await fetch(url, {
    signal,
    headers: { "user-agent": userAgent, accept: "text/html" },
    redirect: "follow",
  })

  if (!response.ok || !response.body) return null

  // A login-wall redirect (Instagram, X, etc. for unrecognized clients) means
  // there's no real content to read — treat it the same as a failed fetch so
  // the caller falls through to the next user agent.
  if (/\/(accounts\/login|login|signin)(\/|$|\?)/i.test(new URL(response.url).pathname)) {
    return null
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let html = ""
  let bytesRead = 0

  while (bytesRead < MAX_BYTES) {
    const { done, value } = await reader.read()
    if (done) break
    bytesRead += value.byteLength
    html += decoder.decode(value, { stream: true })
    if (/<\/head>/i.test(html)) break
  }
  reader.cancel().catch(() => {})

  return html
}

/**
 * Lightweight server-side link unfurling: fetches the page and pulls
 * OpenGraph / title tags with regex — no headless browser. Good enough for
 * "does this link have a title and preview image", which is all V1 needs.
 * A dedicated screenshot service is an intentional later upgrade, not a gap
 * in this function's contract — see the proposal's V1 simplifications.
 */
export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  const empty: LinkPreview = { title: null, imageUrl: null, description: null }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return empty
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return empty

  for (const userAgent of USER_AGENTS) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
      const html = await fetchHtml(parsed.toString(), userAgent, controller.signal)
      if (!html) continue

      const title = extractMeta(html, [
        /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
        /<title[^>]*>([^<]+)<\/title>/i,
      ])

      const imageUrl = extractMeta(html, [
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      ])

      const description = extractMeta(html, [
        /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
      ])

      // Found nothing useful with this UA — try the next one before giving up.
      if (!title && !imageUrl) continue

      return {
        title,
        imageUrl: imageUrl ? new URL(imageUrl, parsed).toString() : null,
        description,
      }
    } catch {
      // try the next user agent
    } finally {
      clearTimeout(timeout)
    }
  }

  return empty
}
