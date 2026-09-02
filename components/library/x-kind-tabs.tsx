"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { X_KIND_TABS, parseXKind } from "@/lib/items/constants"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Sub-tabs shown only on the X category page — Posts vs. Articles (see
// lib/items/x-embed.ts for how a save is classified). "All" clears the
// `kind` param entirely rather than being its own filter value.
export function XKindTabs() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const current = parseXKind(searchParams.get("kind") ?? undefined) ?? "all"

  function updateKind(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") params.delete("kind")
    else params.set("kind", value)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="mt-3 px-4 py-2">
      <Tabs value={current} onValueChange={(v) => updateKind(String(v))}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {X_KIND_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
