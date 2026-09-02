import { InboxIcon } from "@hugeicons/core-free-icons"

import { parseSort } from "@/lib/items/constants"
import { LibraryView } from "@/components/library/library-view"
import { EmptyState } from "@/components/library/empty-state"

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>
}) {
  const params = await searchParams

  return (
    <LibraryView
      title="Inbox"
      filters={{
        query: params.q,
        sort: parseSort(params.sort),
        organized: false,
      }}
      emptyState={
        <EmptyState
          icon={InboxIcon}
          title="Nothing new to review"
          description="Items captured from the browser extension or phone will land here first, ready to tag and organise whenever you like."
        />
      }
    />
  )
}
