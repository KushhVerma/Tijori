import Image from "next/image"

import type { ResolvedItem } from "@/lib/items/resolve"
import { FallbackCover } from "@/components/library/fallback-cover"

// The floating "picked up" preview shown in DragOverlay while dragging — a
// lightweight visual clone, not the real interactive ItemCard. It can't be
// reused here: ItemCard calls useSortable() to register itself as a
// sortable node, and DragOverlay renders a second copy outside any sortable
// list — same id, second registration, would fight the real one for the
// drag. This only ever renders, never handles clicks or drag events itself.
export function ItemCardOverlay({ item }: { item: ResolvedItem }) {
  const previewSrc = item.mediaUrl ?? item.thumbnailUrl ?? item.previewImageUrl

  return (
    <div className="w-full origin-center cursor-grabbing overflow-hidden rounded-xl bg-card shadow-2xl ring-2 ring-ring/50">
      <div className="relative w-full overflow-hidden bg-muted">
        {previewSrc ? (
          <Image
            src={previewSrc}
            alt=""
            width={item.width ?? 800}
            height={item.height ?? 450}
            className="h-auto w-full object-cover"
            unoptimized
          />
        ) : (
          <div className="aspect-[16/9] w-full">
            <FallbackCover id={item.id} label={item.title} />
          </div>
        )}
      </div>
      {item.title && (
        <div className="px-1 py-2">
          <p className="line-clamp-2 text-sm font-medium leading-snug">{item.title}</p>
        </div>
      )}
    </div>
  )
}
