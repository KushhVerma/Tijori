"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon, Link01Icon, Image01Icon, Loading03Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { createItemFromUploadAction, createItemFromUrlAction } from "@/actions/items"
import { detectSourceFromUrl } from "@/lib/items/source-detection"
import { SOURCE_TYPES } from "@/lib/items/constants"
import type { SourceType } from "@/lib/supabase/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TagEditor } from "@/components/item-detail/tag-editor"

export function AddInspirationDialog() {
  const [open, setOpen] = React.useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
        Add
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Inspiration</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="url">
          <TabsList className="w-full">
            <TabsTrigger value="url" className="flex-1">
              <HugeiconsIcon icon={Link01Icon} data-icon="inline-start" />
              Paste URL
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex-1">
              <HugeiconsIcon icon={Image01Icon} data-icon="inline-start" />
              Upload
            </TabsTrigger>
          </TabsList>
          <TabsContent value="url" className="pt-2">
            <UrlForm onDone={() => setOpen(false)} />
          </TabsContent>
          <TabsContent value="upload" className="pt-2">
            <UploadForm onDone={() => setOpen(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function SourceSelect({
  value,
  onChange,
}: {
  value: SourceType
  onChange: (v: SourceType) => void
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SourceType)}>
      <SelectTrigger className="h-8 w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SOURCE_TYPES.filter((s) => s.value !== "screenshot" && s.value !== "screen_recording").map(
          (s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          )
        )}
      </SelectContent>
    </Select>
  )
}

function UrlForm({ onDone }: { onDone: () => void }) {
  const [url, setUrl] = React.useState("")
  const [source, setSource] = React.useState<SourceType>("website")
  const [sourceTouched, setSourceTouched] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [tags, setTags] = React.useState<string[]>([])
  const [isSaving, setIsSaving] = React.useState(false)

  function handleUrlChange(value: string) {
    setUrl(value)
    if (!sourceTouched) {
      try {
        setSource(detectSourceFromUrl(value))
      } catch {
        // ignore — leave last known source
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return

    setIsSaving(true)
    try {
      await createItemFromUrlAction({
        url: url.trim(),
        title: title.trim() || undefined,
        notes: notes.trim() || undefined,
        tagNames: tags,
        sourceType: source,
      })
      toast.success("Saved to Tijori")
      onDone()
    } catch {
      toast.error("Couldn't save this link")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          type="url"
          autoFocus
          placeholder="https://…"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>Source</Label>
        <SourceSelect
          value={source}
          onChange={(v) => {
            setSource(v)
            setSourceTouched(true)
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">Title (optional)</Label>
        <Input
          id="title"
          placeholder="Leave blank to auto-detect"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Tags (optional)</Label>
        <TagEditor tags={tags} onChange={setTags} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Why did you save this?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSaving || !url.trim()}>
        {isSaving && <HugeiconsIcon icon={Loading03Icon} className="animate-spin" data-icon="inline-start" />}
        Save to Tijori
      </Button>
    </form>
  )
}

function readFileDimensions(file: File): Promise<{ width?: number; height?: number; durationSeconds?: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)

    if (file.type.startsWith("image/")) {
      const img = new window.Image()
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
        URL.revokeObjectURL(url)
      }
      img.onerror = () => {
        resolve({})
        URL.revokeObjectURL(url)
      }
      img.src = url
      return
    }

    if (file.type.startsWith("video/")) {
      const video = document.createElement("video")
      video.preload = "metadata"
      video.onloadedmetadata = () => {
        resolve({
          width: video.videoWidth,
          height: video.videoHeight,
          durationSeconds: Math.round(video.duration),
        })
        URL.revokeObjectURL(url)
      }
      video.onerror = () => {
        resolve({})
        URL.revokeObjectURL(url)
      }
      video.src = url
      return
    }

    resolve({})
    URL.revokeObjectURL(url)
  })
}

function UploadForm({ onDone }: { onDone: () => void }) {
  const [file, setFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [title, setTitle] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [tags, setTags] = React.useState<string[]>([])
  const [isSaving, setIsSaving] = React.useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null

    // No browser can display HEIC/HEIF in an <img> — catch it immediately
    // rather than uploading it and only then discovering it can't render.
    if (selected && (selected.type === "image/heic" || selected.type === "image/heif")) {
      toast.error("HEIC/HEIF isn't supported — convert it to JPEG or PNG first, then pick that file.")
      e.target.value = ""
      setFile(null)
      setPreviewUrl(null)
      return
    }

    setFile(selected)
    setPreviewUrl(selected ? URL.createObjectURL(selected) : null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setIsSaving(true)
    try {
      const dimensions = await readFileDimensions(file)

      const uploadRes = await fetch("/api/v1/uploads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contentType: file.type, sizeBytes: file.size }),
      })
      if (!uploadRes.ok) {
        const body = await uploadRes.json().catch(() => null)
        throw new Error(body?.error ?? "Couldn't prepare upload")
      }
      const { uploadUrl, key, mediaKind } = await uploadRes.json()

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      })
      if (!putRes.ok) throw new Error("Upload to storage failed")

      await createItemFromUploadAction({
        mediaKey: key,
        mediaKind,
        sourceType: mediaKind === "video" ? "screen_recording" : "screenshot",
        title: title.trim() || undefined,
        notes: notes.trim() || undefined,
        tagNames: tags,
        ...dimensions,
      })

      toast.success("Saved to Tijori")
      onDone()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save this file")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="file">Image or video</Label>
        <Input id="file" type="file" accept="image/*,video/*" onChange={handleFileChange} required />
      </div>

      {previewUrl && (
        <div className="overflow-hidden rounded-lg bg-muted">
          {file?.type.startsWith("video/") ? (
            <video src={previewUrl} className="max-h-48 w-full" controls />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Preview" className="max-h-48 w-full object-contain" />
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="upload-title">Title (optional)</Label>
        <Input id="upload-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label>Tags (optional)</Label>
        <TagEditor tags={tags} onChange={setTags} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="upload-notes">Notes (optional)</Label>
        <Textarea id="upload-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>

      <Button type="submit" className="w-full" disabled={isSaving || !file}>
        {isSaving && <HugeiconsIcon icon={Loading03Icon} className="animate-spin" data-icon="inline-start" />}
        Save to Tijori
      </Button>
    </form>
  )
}
