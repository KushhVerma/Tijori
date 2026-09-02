"use client"

import * as React from "react"
import Image from "next/image"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  StarIcon,
  ExternalLinkIcon,
  Delete02Icon,
  Loading03Icon,
  BadgeCheckIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { deleteItemAction, toggleFavoriteAction, updateItemAction } from "@/actions/items"
import type { ResolvedItem, XAuthor } from "@/lib/items/resolve"
import { sourceMeta } from "@/lib/items/constants"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SourceIcon } from "@/components/library/source-icon"
import { FallbackCover } from "@/components/library/fallback-cover"
import { TagEditor } from "@/components/item-detail/tag-editor"

export function ItemDetailSheet({
  item,
  open,
  onOpenChange,
}: {
  item: ResolvedItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!item) {
    return <Sheet open={open} onOpenChange={onOpenChange} />
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-2xl">
        {/* Keyed by item id so switching items remounts local state instead
         * of needing an effect to resync it (avoids setState-in-effect). */}
        <ItemDetailBody key={item.id} item={item} onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}

function XAuthorRow({ author }: { author: XAuthor }) {
  const initial = author.name?.[0] ?? author.handle?.[0] ?? "?"

  return (
    <div className="flex items-center gap-2.5">
      <Avatar className="size-9">
        {author.avatarUrl && <AvatarImage src={author.avatarUrl} alt={author.name ?? author.handle ?? ""} />}
        <AvatarFallback>{initial.toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1 text-sm font-medium">
          {author.name}
          {author.verified && (
            <HugeiconsIcon icon={BadgeCheckIcon} className="size-3.5 text-primary" />
          )}
        </div>
        {author.handle && <span className="text-xs text-muted-foreground">@{author.handle}</span>}
      </div>
    </div>
  )
}

function ItemDetailBody({ item, onClose }: { item: ResolvedItem; onClose: () => void }) {
  const [title, setTitle] = React.useState(item.title ?? "")
  const [notes, setNotes] = React.useState(item.notes ?? "")
  const [tags, setTags] = React.useState(item.tags.map((t) => t.name))
  const [favorite, setFavorite] = React.useState(item.favorite)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  async function persist(patch: Parameters<typeof updateItemAction>[1]) {
    try {
      await updateItemAction(item.id, patch)
    } catch {
      toast.error("Couldn't save your change")
    }
  }

  async function handleToggleFavorite() {
    const next = !favorite
    setFavorite(next)
    try {
      await toggleFavoriteAction(item.id, next)
    } catch {
      setFavorite(!next)
      toast.error("Couldn't update favourite")
    }
  }

  function handleTagsChange(next: string[]) {
    setTags(next)
    persist({ tagNames: next })
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteItemAction(item.id)
      toast.success("Removed from Tijori")
      onClose()
    } catch {
      toast.error("Couldn't delete this item")
    } finally {
      setIsDeleting(false)
      setConfirmDelete(false)
    }
  }

  const meta = sourceMeta(item.source_type)
  const previewSrc = item.mediaUrl ?? item.previewImageUrl

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <SheetHeader className="sr-only">
        <SheetTitle>{item.title ?? "Inspiration detail"}</SheetTitle>
      </SheetHeader>

      <div className="relative flex max-h-[55vh] min-h-[240px] items-center justify-center bg-muted">
        {item.media_kind === "video" && item.mediaUrl ? (
          <video
            src={item.mediaUrl}
            controls
            className="max-h-[55vh] w-full bg-black"
            poster={item.thumbnailUrl ?? undefined}
          />
        ) : previewSrc ? (
          <Image
            src={previewSrc}
            alt={item.title ?? "Saved inspiration"}
            width={item.width ?? 1200}
            height={item.height ?? 675}
            className="max-h-[55vh] w-full object-contain"
            unoptimized
          />
        ) : (
          <FallbackCover id={item.id} label={item.title} className="h-[55vh]" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <SourceIcon source={item.source_type} />
            <span>{meta.label}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant={favorite ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={handleToggleFavorite}
              aria-label={favorite ? "Remove from favourites" : "Add to favourites"}
            >
              <HugeiconsIcon icon={StarIcon} className={cn("size-4", favorite && "fill-current text-primary")} />
            </Button>
            {item.url && (
              <Button variant="ghost" size="icon-sm" render={<a href={item.url} target="_blank" rel="noopener noreferrer" />}>
                <HugeiconsIcon icon={ExternalLinkIcon} className="size-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete"
            >
              <HugeiconsIcon icon={Delete02Icon} className="size-4" />
            </Button>
          </div>
        </div>

        {item.xAuthor && <XAuthorRow author={item.xAuthor} />}

        {item.tweetText ? (
          <p className="-mt-2 whitespace-pre-wrap text-base leading-snug">{item.tweetText}</p>
        ) : (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title !== (item.title ?? "") && persist({ title })}
            placeholder="Untitled"
            className="h-auto border-none bg-transparent px-0 text-lg font-medium shadow-none focus-visible:ring-0"
          />
        )}

        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="-mt-3 truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            {item.url}
          </a>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Tags</label>
          <TagEditor tags={tags} onChange={handleTagsChange} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => notes !== (item.notes ?? "") && persist({ notes })}
            placeholder="Why did you save this?"
            rows={4}
          />
        </div>

        <p className="mt-auto pt-2 text-xs text-muted-foreground">
          Saved {new Date(item.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{item.title || "This item"}&rdquo; will be permanently removed from Tijori.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
