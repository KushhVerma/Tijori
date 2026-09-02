import { StarIcon } from "@hugeicons/core-free-icons"

import { parseSort } from "@/lib/items/constants"
import { LibraryView } from "@/components/library/library-view"
import { EmptyState } from "@/components/library/empty-state"

export default async function FavouritesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>
}) {
  const params = await searchParams

  return (
    <LibraryView
      title="Favourites"
      filters={{
        query: params.q,
        sort: parseSort(params.sort),
        favorite: true,
      }}
      emptyState={
        <EmptyState
          icon={StarIcon}
          title="No favourites yet"
          description="Star anything you want to find again fast — it'll show up here."
        />
      }
    />
  )
}
