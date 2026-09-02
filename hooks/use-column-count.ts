"use client"

import * as React from "react"

// Mirrors the masonry grid's old Tailwind breakpoints
// (columns-2 sm:columns-3 lg:columns-4 xl:columns-5) — now computed in JS
// because drag-and-drop needs real column arrays to sort within (see
// item-grid.tsx for why a CSS multi-column layout can't support this).
const BREAKPOINTS: [minWidth: number, columns: number][] = [
  [1280, 5], // xl
  [1024, 4], // lg
  [640, 3], // sm
  [0, 2],
]

function columnsForWidth(width: number) {
  for (const [minWidth, columns] of BREAKPOINTS) {
    if (width >= minWidth) return columns
  }
  return 2
}

function subscribe(callback: () => void) {
  window.addEventListener("resize", callback)
  return () => window.removeEventListener("resize", callback)
}

function getSnapshot() {
  return columnsForWidth(window.innerWidth)
}

function getServerSnapshot() {
  return 2
}

// useSyncExternalStore instead of a resize-listener + setState effect —
// the correct primitive for subscribing to external browser state like
// window size, and avoids the extra render/hydration dance a manual
// effect-based version would need.
export function useColumnCount() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
