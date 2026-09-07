"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Folder01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import {
  addItemToFolderAction,
  listFoldersAction,
  listItemFolderIdsAction,
  removeItemFromFolderAction,
} from "@/actions/folders"
import type { FolderRow } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** A plain positioned <div>, not a portal-based DropdownMenu/Popover — this
 * lives inside the item detail Sheet, which is itself a modal/focus-trapping
 * portal. Two nested focus-trapping portals (Sheet + Menu) can fight over
 * focus badly enough to hang the tab. TagEditor's own suggestion list sits
 * in this same Sheet and already sidesteps this the same way — matching
 * that proven-safe pattern here instead of DropdownMenu.
 *
 * Always mounted (not conditionally rendered) so closing can animate: the
 * panel is either shown or hidden via CSS transition, not add/remove from
 * the tree. */
export function MoveToFolderMenu({ itemId }: { itemId: string }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [folders, setFolders] = React.useState<FolderRow[]>([])
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [loaded, setLoaded] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  function openMenu() {
    setIsOpen(true)
    if (loaded) return
    listFoldersAction()
      .then((allFolders) => setFolders(allFolders))
      .catch(() => {})
    listItemFolderIdsAction(itemId)
      .then((itemFolderIds) => {
        setSelectedIds(new Set(itemFolderIds))
        setLoaded(true)
      })
      .catch(() => {})
  }

  // Close on outside click — the Sheet's own focus trap means a portal-based
  // "click outside to close" primitive isn't available here, so this is done
  // by hand instead.
  React.useEffect(() => {
    if (!isOpen) return
    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [isOpen])

  // One tap = one action, not a multi-select checklist that stays open —
  // picking a folder moves the item there and closes, same feel as picking
  // an option from any other single-action menu.
  async function selectFolder(folder: FolderRow) {
    const alreadyIn = selectedIds.has(folder.id)
    setIsOpen(false)

    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (alreadyIn) next.delete(folder.id)
      else next.add(folder.id)
      return next
    })

    try {
      if (alreadyIn) {
        await removeItemFromFolderAction(itemId, folder.id)
        toast.success(`Removed from "${folder.name}"`)
      } else {
        await addItemToFolderAction(itemId, folder.id)
        toast.success(`Moved to "${folder.name}"`)
      }
    } catch {
      setSelectedIds((prev) => {
        const reverted = new Set(prev)
        if (alreadyIn) reverted.add(folder.id)
        else reverted.delete(folder.id)
        return reverted
      })
      toast.error("Couldn't update that folder")
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        aria-label="Move to folder"
      >
        <HugeiconsIcon icon={Folder01Icon} className="size-4" />
      </Button>

      <div
        className={cn(
          "absolute right-0 top-full z-50 mt-1 w-56 origin-top-right overflow-hidden rounded-2xl bg-popover p-1 text-sm shadow-lg ring-1 ring-foreground/5 transition-all duration-150 dark:ring-foreground/10",
          isOpen
            ? "scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        )}
      >
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Move to…</div>
        {folders.length === 0 ? (
          <div className="px-2 py-3 text-xs text-muted-foreground">
            No folders yet — create one from the sidebar first.
          </div>
        ) : (
          <div className="max-h-56 overflow-y-auto">
            {folders.map((folder) => {
              const checked = selectedIds.has(folder.id)
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => selectFolder(folder)}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-foreground hover:bg-muted"
                >
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    className={cn("size-3.5 shrink-0", checked ? "opacity-100" : "opacity-0")}
                  />
                  <span className="truncate">{folder.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
