"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, Loading03Icon, Mail01Icon } from "@hugeicons/core-free-icons"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get("next") ?? "/"

  const [email, setEmail] = React.useState("")
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "error">("idle")
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!email.trim()) return

    setStatus("sending")
    setErrorMessage(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })

    if (error) {
      setStatus("error")
      setErrorMessage(error.message)
      return
    }

    setStatus("sent")
  }

  if (status === "sent") {
    return (
      <div className="space-y-3 text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Check your email</p>
          <p className="text-sm text-muted-foreground">
            We sent a sign-in link to <span className="text-foreground">{email}</span>.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setStatus("idle")}>
          Use a different email
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      {status === "error" && errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={status === "sending"}>
        {status === "sending" ? (
          <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" data-icon="inline-start" />
        ) : (
          <HugeiconsIcon icon={Mail01Icon} data-icon="inline-start" />
        )}
        Send magic link
      </Button>
    </form>
  )
}
