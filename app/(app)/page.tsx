import { Grid02Icon, Tag01Icon } from "@hugeicons/core-free-icons"

import { parseSort } from "@/lib/items/constants"
import { LibraryView } from "@/components/library/library-view"
import { EmptyState } from "@/components/library/empty-state"
import { AddInspirationDialog } from "@/components/add-inspiration/add-inspiration-dialog"

export default async function AllLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; tag?: string; tagName?: string }>
}) {
  const params = await searchParams
  const isTagFiltered = Boolean(params.tag)

  return (
    <LibraryView
      title={isTagFiltered ? `#${params.tagName ?? "Tag"}` : "All"}
      filters={{
        query: params.q,
        sort: parseSort(params.sort),
        tagId: params.tag,
      }}
      emptyState={
        isTagFiltered ? (
          <EmptyState
            icon={Tag01Icon}
            title="Nothing tagged yet"
            description="Add this tag to an item and it'll show up here."
          />
        ) : (
          <EmptyState
            icon={Grid02Icon}
            title="Your library is empty"
            description="Save your first screenshot, link, or clip to start building your Tijori."
            action={<AddInspirationDialog />}
          />
        )
      }
    />
  )
}
