"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"

import { listTagsAction } from "@/actions/tags"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/** Fast, chip-style tag input: type + Enter/comma to add, click × to remove.
 * A dropdown of your existing tags (not yet on this item) shows below the
 * input while it's focused — every tag by default, narrowing to whatever
 * matches what you've typed so far, and clicking one adds it directly. */
export function TagEditor({
  tags,
  onChange,
  placeholder = "Add a tag…",
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}) {
  const [draft, setDraft] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const [allTags, setAllTags] = React.useState<string[]>([])

  // Fetched once per mount — cheap, and this list only ever needs to be
  // roughly fresh (a tag created seconds ago elsewhere showing up a little
  // late here isn't worth a refetch-on-every-keystroke).
  React.useEffect(() => {
    listTagsAction()
      .then((rows) => setAllTags(rows.map((t) => t.name)))
      .catch(() => {
        // Suggestions are a nice-to-have — typing your own tag still works
        // even if this fetch fails.
      })
  }, [])

  const query = draft.trim().toLowerCase()
  const suggestions = allTags.filter((name) => {
    if (tags.some((t) => t.toLowerCase() === name.toLowerCase())) return false
    return query === "" || name.toLowerCase().includes(query)
  })

  function addTag(value: string) {
    const trimmed = value.trim()
    if (!trimmed) return
    if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return
    onChange([...tags, trimmed])
  }

  function commitDraft() {
    const value = draft
    setDraft("")
    addTag(value)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      commitDraft()
    } else if (e.key === "Escape") {
      setIsOpen(false)
    } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag))
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="rounded-full p-0.5 hover:bg-foreground/10"
              aria-label={`Remove ${tag}`}
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-2.5" />
            </button>
          </Badge>
        ))}
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            commitDraft()
            setIsOpen(false)
          }}
          placeholder={placeholder}
          className="h-6 w-28 shrink-0 border-none bg-transparent px-1 shadow-none focus-visible:ring-0"
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-40 w-48 overflow-y-auto rounded-2xl bg-popover p-1 text-sm shadow-lg ring-1 ring-foreground/5 dark:ring-foreground/10">
          {suggestions.map((name) => (
            <button
              key={name}
              type="button"
              // Fires before the input's onBlur (which would otherwise close
              // this dropdown first and swallow the click).
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addTag(name)}
              className={cn(
                "flex w-full items-center rounded-xl px-2 py-1.5 text-left text-foreground hover:bg-muted"
              )}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
