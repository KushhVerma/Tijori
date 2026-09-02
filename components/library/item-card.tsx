"use client"

import * as React from "react"
import Image from "next/image"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PlayIcon,
  StarIcon,
  MoreHorizontalIcon,
  Edit02Icon,
  Delete02Icon,
  ExternalLinkIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { deleteItemAction, toggleFavoriteAction } from "@/actions/items"
import type { ResolvedItem } from "@/lib/items/resolve"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

function formatDuration(seconds: number | null) {
  if (!seconds) return null
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function ItemCard({
  item,
  onOpen,
}: {
  item: ResolvedItem
  onOpen: (id: string) => void
}) {
  const [favorite, setFavorite] = React.useState(item.favorite)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const previewSrc = item.mediaUrl ?? item.thumbnailUrl ?? item.previewImageUrl
  const isVideo = item.media_kind === "video"
  const duration = formatDuration(item.duration_seconds)

  async function handleToggleFavorite(e: React.MouseEvent) {
    e.stopPropagation()
    const next = !favorite
    setFavorite(next)
    try {
      await toggleFavoriteAction(item.id, next)
    } catch {
      setFavorite(!next)
      toast.error("Couldn't update favourite")
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteItemAction(item.id)
      toast.success("Removed from Tijori")
    } catch {
      toast.error("Couldn't delete this item")
    } finally {
      setIsDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        {...attributes}
        {...listeners}
        onClick={() => onOpen(item.id)}
        onKeyDown={(e) => e.key === "Enter" && onOpen(item.id)}
        className={cn(
          "group/card relative block w-full cursor-grab touch-none overflow-hidden rounded-xl bg-card outline-none active:cursor-grabbing focus-visible:ring-3 focus-visible:ring-ring/30",
          isDragging && "z-10 opacity-40"
        )}
      >
        <div className="relative w-full overflow-hidden bg-muted">
          {previewSrc ? (
            <Image
              src={previewSrc}
              alt={item.title ?? "Saved inspiration"}
              // Real dimensions only exist for files the user uploaded
              // themselves (captured client-side at upload time). Anything
              // pulled from a link preview has no real size to go on, so
              // default to landscape rather than an arbitrary portrait guess
              // — matches the fallback-cover ratio and avoids odd crops on
              // square/logo-shaped preview images.
              width={item.width ?? 800}
              height={item.height ?? 450}
              className="h-auto w-full object-cover transition-transform duration-300 group-hover/card:scale-[1.02]"
              unoptimized
            />
          ) : (
            <div className="aspect-[16/9] w-full">
              <FallbackCover id={item.id} label={item.title} />
            </div>
          )}

          {isVideo && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
              <div className="flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
                <HugeiconsIcon icon={PlayIcon} className="size-4" />
              </div>
            </div>
          )}

          {duration && (
            <Badge variant="secondary" className="absolute bottom-2 right-2 bg-black/60 text-white">
              {duration}
            </Badge>
          )}

          {/* Hover actions — subtle, not permanently visible */}
          <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover/card:opacity-100">
            <Button
              variant="secondary"
              size="icon-sm"
              className="bg-black/50 text-white hover:bg-black/70"
              onClick={handleToggleFavorite}
              aria-label={favorite ? "Remove from favourites" : "Add to favourites"}
            >
              <HugeiconsIcon
                icon={StarIcon}
                className={cn("size-3.5", favorite && "fill-current")}
              />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="secondary"
                    size="icon-sm"
                    className="bg-black/50 text-white hover:bg-black/70"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    aria-label="More actions"
                  />
                }
              >
                <HugeiconsIcon icon={MoreHorizontalIcon} className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => onOpen(item.id)}>
                  <HugeiconsIcon icon={Edit02Icon} data-icon="inline-start" />
                  Edit
                </DropdownMenuItem>
                {item.url && (
                  <DropdownMenuItem
                    render={<a href={item.url} target="_blank" rel="noopener noreferrer" />}
                  >
                    <HugeiconsIcon icon={ExternalLinkIcon} data-icon="inline-start" />
                    Open original
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <HugeiconsIcon icon={Delete02Icon} data-icon="inline-start" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-1 px-1 py-2">
          {item.title && (
            <p className="line-clamp-2 text-sm font-medium leading-snug">{item.title}</p>
          )}
          {item.xAuthor ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Avatar className="size-4">
                {item.xAuthor.avatarUrl && <AvatarImage src={item.xAuthor.avatarUrl} alt="" />}
                <AvatarFallback className="text-[8px]">
                  {(item.xAuthor.name ?? item.xAuthor.handle ?? "?")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">@{item.xAuthor.handle}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <SourceIcon source={item.source_type} />
              {item.domain && <span className="truncate">{item.domain}</span>}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{item.title ?? "This item"}&rdquo; will be permanently removed from Tijori.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
