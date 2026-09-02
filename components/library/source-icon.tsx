import { HugeiconsIcon } from "@hugeicons/react"

import { sourceMeta } from "@/lib/items/constants"
import { cn } from "@/lib/utils"
import type { SourceType } from "@/lib/supabase/types"

/** Deliberately small and muted — the saved reference is the hero, not the
 * source's branding (per product spec: "avoid huge source branding"). */
export function SourceIcon({
  source,
  className,
}: {
  source: SourceType
  className?: string
}) {
  const meta = sourceMeta(source)
  return <HugeiconsIcon icon={meta.icon} className={cn("size-3.5", className)} aria-label={meta.label} />
}
