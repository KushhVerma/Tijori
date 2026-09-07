import { cookies } from "next/headers"

import { requireUser } from "@/lib/auth/current-user"
import * as foldersService from "@/lib/folders/service"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/library/app-sidebar"
import { ExtensionRefreshListener } from "@/components/library/extension-refresh-listener"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser()
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"
  const folders = await foldersService.listFolders(supabase, user.id)

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <ExtensionRefreshListener />
      <AppSidebar userEmail={user.email ?? null} folders={folders} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
