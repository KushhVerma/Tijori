import "server-only"

import { createReadUrl } from "@/lib/r2/upload"

/**
 * Resolves a stored R2 key to a URL the browser can load. If R2_PUBLIC_URL
 * is configured (a custom domain fronting the bucket), that's a stable,
 * cacheable URL. Otherwise falls back to a short-lived signed URL, computed
 * fresh on every server render — items are rendered server-side, so this
 * never surfaces a stale/expired link to the browser.
 */
export async function resolveMediaUrl(key: string | null | undefined): Promise<string | null> {
  if (!key) return null

  const publicBase = process.env.R2_PUBLIC_URL
  if (publicBase) {
    return `${publicBase.replace(/\/$/, "")}/${key}`
  }

  return createReadUrl(key)
}
