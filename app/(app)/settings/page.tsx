import { KeyIcon } from "@hugeicons/core-free-icons"

import { requireUser } from "@/lib/auth/current-user"
import * as tokensService from "@/lib/tokens/service"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { EmptyState } from "@/components/library/empty-state"
import { CreateTokenDialog } from "@/components/settings/create-token-dialog"
import { DeleteTokenButton } from "@/components/settings/delete-token-button"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

export default async function SettingsPage() {
  const { supabase, user } = await requireUser()
  const tokens = await tokensService.listApiTokens(supabase, user.id)

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur">
        <SidebarTrigger />
        <h1 className="text-sm font-medium">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-xl space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium">Access tokens</h2>
              <p className="text-sm text-muted-foreground">
                Used by the browser extension (and, later, the iOS app) to save into your library
                without your web login.
              </p>
            </div>
            <CreateTokenDialog />
          </div>

          {tokens.length === 0 ? (
            <EmptyState
              icon={KeyIcon}
              title="No tokens yet"
              description="Create one to connect the browser extension."
            />
          ) : (
            <div className="divide-y rounded-xl border">
              {tokens.map((token) => (
                <div key={token.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{token.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {formatDate(token.created_at)}
                      {token.last_used_at ? ` · last used ${formatDate(token.last_used_at)}` : " · never used"}
                    </p>
                  </div>
                  <DeleteTokenButton id={token.id} name={token.name} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
