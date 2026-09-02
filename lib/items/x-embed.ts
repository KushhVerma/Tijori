import "server-only"

export interface TweetEmbed {
  text: string | null
  authorName: string | null
  authorHandle: string | null
  authorAvatarUrl: string | null
  verified: boolean
  imageUrl: string | null
  likeCount: number | null
  /** Present when this "post" is really just a wrapper sharing an X
   * Article — a tweet whose only content is a link to a long-form
   * Article has this populated with the article's own title/cover
   * image/preview text, which is what should actually represent the
   * saved item, not the wrapping tweet's own (near-empty) text. */
  article: {
    title: string | null
    previewText: string | null
    coverImageUrl: string | null
  } | null
}

const FETCH_TIMEOUT_MS = 6000

function extractTweetId(url: string): string | null {
  return url.match(/status\/(\d+)/)?.[1] ?? null
}

// A saved URL that already points straight at an Article rather than a
// tweet permalink — e.g. https://x.com/i/article/2094451432208711681.
// Confirmed against a real Article link; distinct from a regular
// /{user}/status/{id} tweet URL.
const ARTICLE_URL_PATTERN = /\/i\/article\//

export function isDirectArticleUrl(url: string): boolean {
  return ARTICLE_URL_PATTERN.test(url)
}

interface SyndicationTweet {
  __typename?: string
  text?: string
  favorite_count?: number
  user?: {
    name?: string
    screen_name?: string
    is_blue_verified?: boolean
    verified?: boolean
    profile_image_url_https?: string
  }
  mediaDetails?: { media_url_https?: string }[]
  article?: {
    title?: string
    preview_text?: string
    cover_media?: { media_info?: { original_img_url?: string } }
  }
}

/**
 * Reads a tweet via the same public, unauthenticated endpoint X's own embed
 * widgets use (cdn.syndication.twimg.com) — real author name/handle/avatar/
 * verified badge and the tweet's own media, no API key or developer account
 * needed. This is why X support can be meaningfully better than Instagram's:
 * X has kept this open for embedding, Instagram hasn't (see
 * lib/items/link-preview.ts and lib/items/microlink.ts for that comparison).
 */
export async function fetchTweetEmbed(url: string): Promise<TweetEmbed | null> {
  const id = extractTweetId(url)
  if (!id) return null

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    // The token isn't meaningfully validated for reads — any value works —
    // but a random-ish one avoids looking like a hardcoded literal to any
    // future rate-limiting on the endpoint.
    const token = Math.random().toString(36).slice(2)
    const response = await fetch(
      `https://cdn.syndication.twimg.com/tweet-result?id=${id}&token=${token}`,
      { signal: controller.signal }
    )
    if (!response.ok) return null

    const data = (await response.json()) as SyndicationTweet
    if (data.__typename !== "Tweet") return null // deleted, private, or age-restricted

    return {
      text: data.text ?? null,
      authorName: data.user?.name ?? null,
      authorHandle: data.user?.screen_name ?? null,
      authorAvatarUrl: data.user?.profile_image_url_https ?? null,
      verified: Boolean(data.user?.is_blue_verified || data.user?.verified),
      imageUrl: data.mediaDetails?.[0]?.media_url_https ?? data.user?.profile_image_url_https ?? null,
      likeCount: data.favorite_count ?? null,
      article: data.article
        ? {
            title: data.article.title ?? null,
            previewText: data.article.preview_text ?? null,
            coverImageUrl: data.article.cover_media?.media_info?.original_img_url ?? null,
          }
        : null,
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}
