import { cookies } from "next/headers"

import { requireUser } from "@/lib/auth/current-user"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/library/app-sidebar"
import { ExtensionRefreshListener } from "@/components/library/extension-refresh-listener"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireUser()
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <ExtensionRefreshListener />
      <AppSidebar userEmail={user.email ?? null} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
