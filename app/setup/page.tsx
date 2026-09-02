import { HugeiconsIcon } from "@hugeicons/react"
import { CloudIcon } from "@hugeicons/core-free-icons"

export default function SetupPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="space-y-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HugeiconsIcon icon={CloudIcon} className="size-5" />
          </div>
          <h1 className="text-lg font-medium">Connect Tijori&apos;s backend</h1>
          <p className="text-sm text-muted-foreground">
            The app is running, but it doesn&apos;t have a Supabase project to talk to yet.
            Copy <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.example</code> to{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code> and fill in:
          </p>
        </div>

        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
              1
            </span>
            <span>
              <code className="rounded bg-muted px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> from
              Project Settings → API in your Supabase dashboard.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
              2
            </span>
            <span>
              <code className="rounded bg-muted px-1 py-0.5 text-xs">SUPABASE_SERVICE_ROLE_KEY</code> from the same
              page (keep this one secret — it bypasses row security).
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
              3
            </span>
            <span>
              Run <code className="rounded bg-muted px-1 py-0.5 text-xs">supabase/migrations/0001_init.sql</code> in
              the Supabase SQL editor to create the tables.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
              4
            </span>
            <span>Restart the dev server, then refresh this page.</span>
          </li>
        </ol>
      </div>
    </div>
  )
}
