"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Grid02Icon,
  InboxIcon,
  StarIcon,
  Tag01Icon,
  SettingsIcon,
  LogoutIcon,
  Sun03Icon,
  Moon02Icon,
} from "@hugeicons/core-free-icons"

import { SOURCE_TYPES } from "@/lib/items/constants"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"

export function AppSidebar({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center px-2 py-1.5 group-data-[collapsible=icon]:hidden">
          {/* Same dark:/light-only visibility trick as the theme toggle —
           * two images always in the DOM, CSS decides which one shows, so
           * there's no client-only branch to disagree with the server. */}
          <Image
            src="/logo-black.png"
            alt="Tijori"
            width={112}
            height={47}
            priority
            className="h-7 w-auto dark:hidden"
          />
          <Image
            src="/logo-white.png"
            alt="Tijori"
            width={112}
            height={47}
            priority
            className="hidden h-7 w-auto dark:block"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/" />}
                  isActive={pathname === "/"}
                  tooltip="All"
                >
                  <HugeiconsIcon icon={Grid02Icon} />
                  <span>All</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/inbox" />}
                  isActive={pathname === "/inbox"}
                  tooltip="Inbox"
                >
                  <HugeiconsIcon icon={InboxIcon} />
                  <span>Inbox</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/favourites" />}
                  isActive={pathname === "/favourites"}
                  tooltip="Favourites"
                >
                  <HugeiconsIcon icon={StarIcon} />
                  <span>Favourites</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {SOURCE_TYPES.map((source) => (
                <SidebarMenuItem key={source.value}>
                  <SidebarMenuButton
                    render={<Link href={`/source/${source.slug}`} />}
                    isActive={pathname === `/source/${source.slug}`}
                    tooltip={source.label}
                  >
                    <HugeiconsIcon icon={source.icon} />
                    <span>{source.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/tags" />}
                  isActive={pathname === "/tags"}
                  tooltip="Tags"
                >
                  <HugeiconsIcon icon={Tag01Icon} />
                  <span>Tags</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/settings" />}
                  isActive={pathname === "/settings"}
                  tooltip="Settings"
                >
                  <HugeiconsIcon icon={SettingsIcon} />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => setTheme(isDark ? "light" : "dark")} tooltip="Toggle theme (or press d)">
              {/* resolvedTheme is unavailable during the server render, so
               * branching the icon/label on `isDark` would render different
               * elements on the server vs. after hydration — a structural
               * mismatch `suppressHydrationWarning` can't cover (it only
               * covers text/attribute diffs on the node it's applied to).
               * Rendering both and letting the `dark:` class — already set
               * on <html> before hydration by next-themes' injected script —
               * decide visibility avoids the mismatch entirely, no mount
               * effect needed. */}
              <HugeiconsIcon icon={Sun03Icon} className="hidden dark:block" />
              <HugeiconsIcon icon={Moon02Icon} className="block dark:hidden" />
              <span className="hidden dark:inline">Light mode</span>
              <span className="inline dark:hidden">Dark mode</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Sign out">
              <HugeiconsIcon icon={LogoutIcon} />
              <span className={cn(userEmail ? "truncate" : "")}>{userEmail ?? "Sign out"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
