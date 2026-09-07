"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Folder01Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import {
  addItemToFolderAction,
  listFoldersAction,
  listItemFolderIdsAction,
  removeItemFromFolderAction,
} from "@/actions/folders"
import type { FolderRow } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/** Toggling a folder here is purely additive/subtractive to *that folder
 * only* — it never touches the item's source category, tags, or any other
 * folder. Fetches its own data (all folders + this item's current ones)
 * rather than threading props down through LibraryView/ItemGrid, same
 * pattern TagEditor already uses for its own suggestion list. */
export function MoveToFolderMenu({ itemId }: { itemId: string }) {
  const [folders, setFolders] = React.useState<FolderRow[]>([])
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [loaded, setLoaded] = React.useState(false)

  function loadOnce() {
    if (loaded) return
    Promise.all([listFoldersAction(), listItemFolderIdsAction(itemId)])
      .then(([allFolders, itemFolderIds]) => {
        setFolders(allFolders)
        setSelectedIds(new Set(itemFolderIds))
        setLoaded(true)
      })
      .catch(() => {
        // Menu just opens empty/unchecked if this fails — not worth a toast
        // for a background prefetch.
      })
  }

  async function toggleFolder(folderId: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(folderId)
      else next.delete(folderId)
      return next
    })

    try {
      if (checked) await addItemToFolderAction(itemId, folderId)
      else await removeItemFromFolderAction(itemId, folderId)
    } catch {
      setSelectedIds((prev) => {
        const reverted = new Set(prev)
        if (checked) reverted.delete(folderId)
        else reverted.add(folderId)
        return reverted
      })
      toast.error("Couldn't update that folder")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" onClick={loadOnce} aria-label="Move to folder" />
        }
      >
        <HugeiconsIcon icon={Folder01Icon} className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Move to…</DropdownMenuLabel>
        {folders.length === 0 ? (
          <div className="px-2 py-3 text-xs text-muted-foreground">
            No folders yet — create one from the sidebar first.
          </div>
        ) : (
          folders.map((folder) => (
            <DropdownMenuCheckboxItem
              key={folder.id}
              checked={selectedIds.has(folder.id)}
              onCheckedChange={(checked) => toggleFolder(folder.id, Boolean(checked))}
            >
              {folder.name}
            </DropdownMenuCheckboxItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
