"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { toast } from "sonner"

import { reorderAllItemsAction, reorderItemAction } from "@/actions/items"
import type { ResolvedItem } from "@/lib/items/resolve"
import { useColumnCount } from "@/hooks/use-column-count"
import { ItemCard } from "@/components/library/item-card"
import { ItemCardOverlay } from "@/components/library/item-card-overlay"
import { ItemDetailSheet } from "@/components/item-detail/item-detail-sheet"

// Matches the default image dimensions used elsewhere (item-card.tsx) for
// items with no real width/height on record — used here only to estimate
// relative column heights for balancing, not for actual rendering.
const DEFAULT_ASPECT = 450 / 800

function estimatedHeight(item: ResolvedItem) {
  if (item.width && item.height) return item.height / item.width
  return DEFAULT_ASPECT
}

// Splits the flat, position-ordered item list into N columns for masonry —
// each item goes into whichever column is currently shortest, the same
// balancing a CSS `columns-N` layout does automatically.
//
// This exists because drag-and-drop can't work correctly on a CSS
// multi-column layout: dnd-kit's sorting strategies assume DOM order
// follows visual, row-major order. A CSS multi-column masonry breaks that
// assumption — items flow down one column before moving to the next, so
// "item N+1" is usually nowhere near item N on screen. Instead, each
// column here is rendered as its own independent SortableContext — the
// same architecture as a Jira/Trello board (columns = separate sortable
// lists, dragging between them is a first-class move), which is also
// dnd-kit's own recommended pattern for masonry-with-drag.
function distributeIntoColumns(items: ResolvedItem[], columnCount: number): string[][] {
  const columns: string[][] = Array.from({ length: columnCount }, () => [])
  const heights = new Array(columnCount).fill(0)

  for (const item of items) {
    let shortest = 0
    for (let i = 1; i < columnCount; i++) {
      if (heights[i] < heights[shortest]) shortest = i
    }
    columns[shortest].push(item.id)
    heights[shortest] += estimatedHeight(item)
  }

  return columns
}

function findColumn(columns: string[][], id: string) {
  return columns.findIndex((col) => col.includes(id))
}

// Flattens the columns back into one order for computing/persisting
// `position` — row by row across all columns (row 0 of every column, then
// row 1, etc.), not column-by-column. Column-by-column would mean "the top"
// only ever really meant the top of column 1 — dropping something at the
// top of column 2+ would compute a position somewhere in the *middle* of
// the real order instead, which is both wrong and unstable (columns get
// rebalanced fresh on every render, so that stray middle position could
// land it in a visibly different spot next time). Row-major matches how a
// masonry grid actually reads left-to-right, top-to-bottom.
function flattenRowMajor(columns: string[][]): string[] {
  const maxLen = Math.max(0, ...columns.map((col) => col.length))
  const result: string[] = []
  for (let row = 0; row < maxLen; row++) {
    for (const col of columns) {
      if (col[row] !== undefined) result.push(col[row])
    }
  }
  return result
}

export function ItemGrid({ items }: { items: ResolvedItem[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const columnCount = useColumnCount()

  const [openId, setOpenId] = React.useState<string | null>(null)
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [activeWidth, setActiveWidth] = React.useState<number | null>(null)

  const itemsById = React.useMemo(() => new Map(items.map((i) => [i.id, i])), [items])

  // orderedItems is the flat, authoritative order (server-sorted by
  // position, or updated locally right after a drag settles) — it's what
  // gets flattened back into position values to persist. columns is the
  // live, per-container drag state derived from it, kept as its own state
  // (not a pure memo of orderedItems) so onDragOver can move an item
  // between columns instantly as you drag across them, before the drop
  // actually settles — the "make room" feel Jira/Trello have.
  const [orderedItems, setOrderedItems] = React.useState(items)
  const [columns, setColumns] = React.useState(() => distributeIntoColumns(items, columnCount))

  // Resync whenever the server gives us a genuinely new list, or the
  // viewport crosses a column-count breakpoint — done during render per
  // React's guidance for "adjust state when inputs change" rather than
  // mirroring it with an effect.
  const [synced, setSynced] = React.useState({ items, columnCount })
  if (synced.items !== items || synced.columnCount !== columnCount) {
    setSynced({ items, columnCount })
    setOrderedItems(items)
    setColumns(distributeIntoColumns(items, columnCount))
  }

  const openItem = orderedItems.find((i) => i.id === openId) ?? null
  const activeItem = activeId ? (itemsById.get(activeId) ?? null) : null

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
    setActiveWidth(event.active.rect.current.initial?.width ?? null)
  }

  // Moves the dragged item into whichever column it's hovering over, live —
  // within-column reordering is handled by each card's own useSortable()
  // transform automatically, so this only needs to act on cross-column
  // moves. Reads from `prev` inside the updater (not the outer `columns`
  // closure) since onDragOver can fire several times in quick succession
  // during one continuous drag, before a re-render lands.
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setColumns((prev) => {
      const fromCol = findColumn(prev, active.id as string)
      const toCol = findColumn(prev, over.id as string)
      if (fromCol === -1 || toCol === -1 || fromCol === toCol) return prev

      const next = prev.map((col) => [...col])
      const fromIndex = next[fromCol].indexOf(active.id as string)
      const toIndex = next[toCol].indexOf(over.id as string)
      next[fromCol].splice(fromIndex, 1)
      next[toCol].splice(toIndex, 0, active.id as string)
      return next
    })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    setActiveWidth(null)
    if (!over || active.id === over.id) return

    const fromCol = findColumn(columns, active.id as string)
    const toCol = findColumn(columns, over.id as string)
    if (fromCol === -1 || toCol === -1) return

    const finalColumns = columns.map((col) => [...col])
    const overIndex = finalColumns[toCol].indexOf(over.id as string)

    if (fromCol === toCol) {
      const activeIndex = finalColumns[fromCol].indexOf(active.id as string)
      finalColumns[fromCol] = arrayMove(finalColumns[fromCol], activeIndex, overIndex)
    } else {
      // handleDragOver already moved it into the right column live — this
      // just settles it at the exact drop target within that column.
      const idx = finalColumns[toCol].indexOf(active.id as string)
      finalColumns[toCol].splice(idx, 1)
      finalColumns[toCol].splice(overIndex, 0, active.id as string)
    }
    setColumns(finalColumns)

    // Flatten row-major (see flattenRowMajor above) to get one linear order.
    const flatIds = flattenRowMajor(finalColumns)
    const flatItems = flatIds.map((id) => itemsById.get(id)).filter((i): i is ResolvedItem => !!i)
    const newIndex = flatIds.indexOf(active.id as string)

    const wasAlreadyCustom = searchParams.get("sort") === "custom"

    let reorderedFlat: ResolvedItem[]
    let persist: () => Promise<void>

    if (wasAlreadyCustom) {
      // Already position-sorted, so a single-item midpoint update is
      // correct and cheap — this is the normal, common-case path.
      const before = flatItems[newIndex - 1]?.position ?? null
      const after = flatItems[newIndex + 1]?.position ?? null
      const newPosition =
        before !== null && after !== null
          ? (before + after) / 2
          : before !== null
            ? before + 1000
            : after !== null
              ? after - 1000
              : 1000

      reorderedFlat = flatItems.map((item) =>
        item.id === active.id ? { ...item, position: newPosition } : item
      )
      persist = () => reorderItemAction(active.id as string, newPosition)
    } else {
      // This drag is what's switching the view into "Custom order" for the
      // first time. Before now, the on-screen order came from something
      // other than `position` (newest/oldest) — those stored position
      // values can be stale, missing, or unrelated to what's actually
      // visible, so treating flatItems' neighbours as meaningful for a
      // midpoint calculation would produce a number that doesn't reflect
      // where anything actually is. Renumber the whole visible list once,
      // in its current (drop-adjusted) order, to establish a real
      // baseline — see itemsService.reorderAllItems.
      reorderedFlat = flatItems.map((item, index) => ({ ...item, position: (index + 1) * 1000 }))
      persist = () => reorderAllItemsAction(flatIds)
    }

    setOrderedItems(reorderedFlat)
    setSynced({ items: reorderedFlat, columnCount })

    // Wait for the position(s) to actually land in the database before
    // touching the URL below — switching the `sort` param makes Next.js
    // re-fetch the list fresh from the server, and if that landed before
    // this write finished, it would briefly pull back the pre-drag order
    // (a visible snap-back, since our own resync-on-new-data logic would
    // then overwrite the optimistic local state with that stale fetch).
    try {
      await persist()
    } catch {
      toast.error("Couldn't save the new order")
      return
    }

    // Manual order only "sticks" on reload while sort=custom — switch to it
    // automatically so a drag never looks like it silently didn't work.
    if (!wasAlreadyCustom) {
      const params = new URLSearchParams(searchParams.toString())
      params.set("sort", "custom")
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4">
          {columns.map((columnIds, colIndex) => (
            <SortableContext key={colIndex} items={columnIds} strategy={verticalListSortingStrategy}>
              <div className="flex min-w-0 flex-1 flex-col gap-4">
                {columnIds.map((id) => {
                  const item = itemsById.get(id)
                  return item ? <ItemCard key={id} item={item} onOpen={setOpenId} /> : null
                })}
              </div>
            </SortableContext>
          ))}
        </div>

        <DragOverlay>
          {activeItem ? (
            <div style={activeWidth ? { width: activeWidth } : undefined}>
              <ItemCardOverlay item={activeItem} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <ItemDetailSheet
        item={openItem}
        open={openId !== null}
        onOpenChange={(open) => !open && setOpenId(null)}
      />
    </>
  )
}
