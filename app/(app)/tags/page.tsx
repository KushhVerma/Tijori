import Link from "next/link"
import { Tag01Icon } from "@hugeicons/core-free-icons"

import { requireUser } from "@/lib/auth/current-user"
import * as tagsService from "@/lib/tags/service"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { EmptyState } from "@/components/library/empty-state"

export default async function TagsPage() {
  const { supabase, user } = await requireUser()
  const tags = await tagsService.listTags(supabase, user.id)

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur">
        <SidebarTrigger />
        <h1 className="text-sm font-medium">Tags</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tags.length === 0 ? (
          <EmptyState
            icon={Tag01Icon}
            title="No tags yet"
            description="Tags appear here as soon as you add one to a saved item."
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link key={tag.id} href={`/?tag=${tag.id}&tagName=${encodeURIComponent(tag.name)}`}>
                <Badge variant="outline" className="h-7 gap-1.5 px-3 text-sm hover:bg-muted">
                  {tag.name}
                  <span className="text-muted-foreground">{tag.itemCount}</span>
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
