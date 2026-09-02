import "server-only"

import { fetchLinkPreview } from "@/lib/items/link-preview"
import { fetchRenderedPreview } from "@/lib/items/microlink"
import { fetchTweetEmbed, isDirectArticleUrl } from "@/lib/items/x-embed"
import { isGenericTitle } from "@/lib/items/constants"
import type { SourceType, XKind } from "@/lib/supabase/types"

export interface ResolvedPreview {
  title: string | null
  imageUrl: string | null
  rawMeta: Record<string, unknown>
  /** Only set for sourceType "x" — see lib/items/x-embed.ts. */
  xKind?: XKind
}

/**
 * Per-source enrichment for a pasted/captured URL, cheapest/most-reliable
 * option first:
 *  - X: the free public syndication endpoint (real author, avatar, verified
 *    badge, tweet media) — see lib/items/x-embed.ts.
 *  - Everything else: the fast static-HTML fetch, falling back to Microlink's
 *    rendered metadata for pages that need JS to show real content.
 * Falls through to the generic pipeline if a source-specific path comes up
 * empty (e.g. a deleted or private tweet).
 *
 * Shared by the web app's Add Inspiration flow (actions/items.ts) and the
 * versioned ingestion API (app/api/v1/items) so a link saved from the
 * browser extension gets exactly the same real title/thumbnail as one
 * pasted in the web app — one enrichment pipeline, every client.
 */
export async function resolvePreview(url: string, sourceType: SourceType): Promise<ResolvedPreview> {
  if (sourceType === "x") {
    // A URL pointing straight at an Article (not a tweet permalink) has no
    // status id to fetch by — the syndication endpoint only resolves
    // tweets, not articles directly (confirmed: passing an article's own
    // id returns X's generic error page, not article data). Still worth
    // tagging xKind correctly here; title/image just fall through to the
    // generic website pipeline below since there's no free API for this.
    if (isDirectArticleUrl(url)) {
      const preview = await resolveGeneric(url)
      return { ...preview, xKind: "article" }
    }

    const tweet = await fetchTweetEmbed(url).catch(() => null)
    if (tweet && (tweet.text || tweet.imageUrl || tweet.article)) {
      // A tweet whose only content is a link to an Article should be
      // represented by the article's own title/cover/preview, not the
      // wrapping tweet's near-empty text ("https://t.co/..." alone).
      if (tweet.article) {
        return {
          title: tweet.article.title,
          imageUrl: tweet.article.coverImageUrl ?? tweet.imageUrl,
          xKind: "article",
          rawMeta: {
            tweetText: tweet.article.previewText,
            authorName: tweet.authorName,
            authorHandle: tweet.authorHandle,
            authorAvatarUrl: tweet.authorAvatarUrl,
            verified: tweet.verified,
          },
        }
      }

      return {
        // The card/title field is a single-line label — flatten line breaks
        // so it can't visually run words together, and drop any raw URLs
        // (t.co links etc.) since they're just clutter in a title, not
        // useful text. The full text — line breaks, links, and all — is
        // kept separately (rawMeta.tweetText) for the detail view, which
        // has room to show it properly.
        title: tweet.text
          ? tweet.text
              .replace(/https?:\/\/\S+/g, "")
              .replace(/\s+/g, " ")
              .trim() || null
          : null,
        imageUrl: tweet.imageUrl,
        xKind: "post",
        rawMeta: {
          tweetText: tweet.text,
          authorName: tweet.authorName,
          authorHandle: tweet.authorHandle,
          authorAvatarUrl: tweet.authorAvatarUrl,
          verified: tweet.verified,
        },
      }
    }
  }

  return resolveGeneric(url)
}

// The fast static-HTML fetch, falling back to Microlink's rendered metadata
// for pages that need JS to show real content. Used both as the default
// pipeline for non-X sources and for X Article URLs, which have no free API
// to fetch by (see the isDirectArticleUrl branch above).
async function resolveGeneric(url: string): Promise<ResolvedPreview> {
  const preview = await fetchLinkPreview(url).catch(() => null)
  const fastTitle = preview?.title && !isGenericTitle(preview.title) ? preview.title : null

  // The fast text-based fetch above misses pages that render client-side
  // (Instagram post permalinks, mainly) — it'll have no image and only a
  // generic title for those. Falling back to Microlink's rendered metadata
  // catches those too: a real headless browser reads the actual post image
  // and caption, not a screenshot with a logged-out "sign up" nag baked in.
  const needsFallback = !fastTitle || !preview?.imageUrl
  const rendered = needsFallback ? await fetchRenderedPreview(url).catch(() => null) : null
  const renderedTitle = rendered?.title && !isGenericTitle(rendered.title) ? rendered.title : null

  return {
    title: fastTitle || renderedTitle,
    imageUrl: preview?.imageUrl ?? rendered?.imageUrl ?? null,
    rawMeta: {},
  }
}
