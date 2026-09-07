"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Loading03Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { createFolderAction } from "@/actions/folders"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { SidebarGroupAction } from "@/components/ui/sidebar"

export function NewFolderDialog() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setIsSaving(true)
    try {
      const folder = await createFolderAction(trimmed)
      setName("")
      setOpen(false)
      router.push(`/folder/${folder.id}`)
    } catch {
      toast.error("Couldn't create that folder")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<SidebarGroupAction title="New folder" />}>
        <HugeiconsIcon icon={Add01Icon} />
        <span className="sr-only">New folder</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New folder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            autoFocus
            placeholder="Folder name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={isSaving || !name.trim()}>
            {isSaving && (
              <HugeiconsIcon icon={Loading03Icon} className="animate-spin" data-icon="inline-start" />
            )}
            Create folder
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
