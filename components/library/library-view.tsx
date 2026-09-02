import type { ReactNode } from "react"
import { Search01Icon } from "@hugeicons/core-free-icons"

import { requireUser } from "@/lib/auth/current-user"
import * as itemsService from "@/lib/items/service"
import { resolveItemsMedia } from "@/lib/items/resolve"
import type { ListItemsFilters } from "@/lib/items/types"
import { Topbar } from "@/components/library/topbar"
import { ItemGrid } from "@/components/library/item-grid"
import { EmptyState } from "@/components/library/empty-state"

export async function LibraryView({
  title,
  filters,
  emptyState,
  subTabs,
}: {
  title: string
  filters: ListItemsFilters
  emptyState: ReactNode
  /** Optional sub-tab bar rendered between the Topbar and the grid — only
   * the X category page uses this (Posts/Articles), see x-kind-tabs.tsx. */
  subTabs?: ReactNode
}) {
  const { supabase, user } = await requireUser()
  const items = await itemsService.listItems(supabase, user.id, filters)
  const resolved = await resolveItemsMedia(items)

  const isEmpty = resolved.length === 0
  const isSearching = Boolean(filters.query)

  return (
    <div className="flex h-full flex-col">
      <Topbar title={title} />
      {subTabs}
      <div className="flex-1 overflow-x-hidden overflow-y-auto p-4">
        {!isEmpty ? (
          <ItemGrid items={resolved} />
        ) : isSearching ? (
          <EmptyState
            icon={Search01Icon}
            title={`No results for "${filters.query}"`}
            description="Try a different word, or check another category."
          />
        ) : (
          emptyState
        )}
      </div>
    </div>
  )
}
