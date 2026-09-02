import { notFound } from "next/navigation"

import { parseSort, parseXKind, sourceMetaBySlug } from "@/lib/items/constants"
import { LibraryView } from "@/components/library/library-view"
import { EmptyState } from "@/components/library/empty-state"
import { AddInspirationDialog } from "@/components/add-inspiration/add-inspiration-dialog"
import { XKindTabs } from "@/components/library/x-kind-tabs"

export default async function SourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>
  searchParams: Promise<{ q?: string; sort?: string; kind?: string }>
}) {
  const { type } = await params
  const meta = sourceMetaBySlug(type)
  if (!meta) notFound()

  const search = await searchParams
  const isX = meta.value === "x"

  return (
    <LibraryView
      title={meta.label}
      filters={{
        query: search.q,
        sort: parseSort(search.sort),
        sourceType: meta.value,
        xKind: isX ? parseXKind(search.kind) : undefined,
      }}
      subTabs={isX ? <XKindTabs /> : undefined}
      emptyState={
        <EmptyState
          icon={meta.icon}
          title={`No ${meta.label.toLowerCase()} yet`}
          description={`Save something from ${meta.label} and it'll show up here.`}
          action={<AddInspirationDialog />}
        />
      }
    />
  )
}
