"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon, Copy01Icon, CheckmarkCircle02Icon, Loading03Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { createApiTokenAction } from "@/actions/tokens"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function CreateTokenDialog() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)
  const [createdToken, setCreatedToken] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  function reset() {
    setName("")
    setCreatedToken(null)
    setCopied(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setIsCreating(true)
    try {
      const { token } = await createApiTokenAction(name)
      setCreatedToken(token)
      router.refresh()
    } catch {
      toast.error("Couldn't create the token")
    } finally {
      setIsCreating(false)
    }
  }

  async function handleCopy() {
    if (!createdToken) return
    await navigator.clipboard.writeText(createdToken)
    setCopied(true)
    toast.success("Copied")
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        <HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
        New token
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{createdToken ? "Token created" : "New personal access token"}</DialogTitle>
        </DialogHeader>

        {createdToken ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Copy this now — you won&apos;t be able to see it again. Paste it into the extension
              when it asks you to sign in.
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-muted p-2.5">
              <code className="flex-1 truncate text-xs">{createdToken}</code>
              <Button variant="ghost" size="icon-sm" onClick={handleCopy} aria-label="Copy token">
                <HugeiconsIcon
                  icon={copied ? CheckmarkCircle02Icon : Copy01Icon}
                  className={copied ? "text-primary" : undefined}
                />
              </Button>
            </div>
            <Button className="w-full" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="token-name">Name</Label>
              <Input
                id="token-name"
                autoFocus
                placeholder="e.g. Chrome extension"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isCreating}>
              {isCreating && (
                <HugeiconsIcon icon={Loading03Icon} className="animate-spin" data-icon="inline-start" />
              )}
              Create token
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
