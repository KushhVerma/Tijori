import { notFound } from "next/navigation"
import { Folder01Icon } from "@hugeicons/core-free-icons"

import { requireUser } from "@/lib/auth/current-user"
import * as foldersService from "@/lib/folders/service"
import { parseSort } from "@/lib/items/constants"
import { LibraryView } from "@/components/library/library-view"
import { EmptyState } from "@/components/library/empty-state"
import { AddInspirationDialog } from "@/components/add-inspiration/add-inspiration-dialog"

export default async function FolderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ q?: string; sort?: string }>
}) {
  const { id } = await params
  const { supabase, user } = await requireUser()
  const folder = await foldersService.getFolder(supabase, user.id, id)
  if (!folder) notFound()

  const search = await searchParams

  return (
    <LibraryView
      title={folder.name}
      filters={{
        query: search.q,
        sort: parseSort(search.sort),
        folderId: folder.id,
      }}
      emptyState={
        <EmptyState
          icon={Folder01Icon}
          title={`Nothing in ${folder.name} yet`}
          description="Move something here from its detail view, or save it straight into this folder from the extension."
          action={<AddInspirationDialog />}
        />
      }
    />
  )
}
