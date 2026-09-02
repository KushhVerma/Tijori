"use client"

import * as React from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"

import { SORT_OPTIONS } from "@/lib/items/constants"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AddInspirationDialog } from "@/components/add-inspiration/add-inspiration-dialog"

export function Topbar({ title }: { title: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Lazily seeded from the URL on mount only. Each route (All, Inbox, a
  // source, a tag) is a distinct page component, so navigating between them
  // remounts Topbar and reseeds this naturally — no effect needed to keep
  // it in sync with searchParams after that.
  const [query, setQuery] = React.useState(() => searchParams.get("q") ?? "")

  React.useEffect(() => {
    const handle = setTimeout(() => {
      const current = searchParams.get("q") ?? ""
      if (query === current) return

      const params = new URLSearchParams(searchParams.toString())
      if (query) params.set("q", query)
      else params.delete("q")
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }, 250)

    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  function updateSort(value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === "newest") params.delete("sort")
    else params.set("sort", value)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur">
      <SidebarTrigger />
      <h1 className="hidden text-sm font-medium sm:block">{title}</h1>

      <div className="relative ml-auto max-w-sm flex-1">
        <HugeiconsIcon
          icon={Search01Icon}
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your library…"
          className="pl-8"
        />
      </div>

      {/* Controlled (not defaultValue) so it reflects sort changes made
       * elsewhere — e.g. ItemGrid switching to "Custom order" when you
       * drag a card. */}
      <Select value={searchParams.get("sort") ?? "newest"} onValueChange={updateSort}>
        <SelectTrigger className="hidden h-8 w-36 sm:flex">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AddInspirationDialog />
    </div>
  )
}
