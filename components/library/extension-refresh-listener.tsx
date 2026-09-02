"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// The browser extension can't reach into React state directly, so after a
// successful save it injects a tiny script into any open Tijori tab that
// just dispatches this DOM event — cheap, no page reload. We listen for it
// here and do a Next.js soft refresh (re-fetches server data for the
// current route only) instead of the extension doing a full tabs.reload(),
// which in dev mode meant re-downloading and re-hydrating the entire app.
export function ExtensionRefreshListener() {
  const router = useRouter()

  useEffect(() => {
    function handleItemSaved() {
      router.refresh()
    }
    window.addEventListener("tijori:item-saved", handleItemSaved)
    return () => window.removeEventListener("tijori:item-saved", handleItemSaved)
  }, [router])

  return null
}
