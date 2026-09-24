"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ShieldCheck,
  UserRound,
  LayoutDashboard,
  LogOut,
  Wallet,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"

export function MobileNavigation({
  name,
  admin,
  pending,
  onLogout,
}: {
  name: string
  admin: boolean
  pending: boolean
  onLogout: () => void
}) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()
  if (!isMobile) return null
  const links = [
    { href: "/", label: "債務總覽", icon: LayoutDashboard },
    { href: "/settings", label: "帳號設定", icon: UserRound },
    ...(admin
      ? [{ href: "/admin", label: "使用者管理", icon: ShieldCheck }]
      : []),
  ]
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 p-2">
          <Link
            href="/"
            onClick={() => setOpenMobile(false)}
            className="flex items-center gap-2 font-semibold"
          >
            <Wallet className="size-5 text-primary" />
            債務手帳
          </Link>
          <Button
            variant="ghost"
            size="icon"
            aria-label="關閉導覽選單"
            onClick={() => setOpenMobile(false)}
          >
            <X />
          </Button>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>主要導覽</SidebarGroupLabel>
          <nav aria-label="手機導覽">
            <SidebarMenu>
              {links.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    render={<Link href={href} />}
                    isActive={
                      pathname === href ||
                      (href === "/settings" &&
                        pathname.startsWith("/settings/"))
                    }
                    aria-current={
                      pathname === href ||
                      (href === "/settings" &&
                        pathname.startsWith("/settings/"))
                        ? "page"
                        : undefined
                    }
                    onClick={() => setOpenMobile(false)}
                  >
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </nav>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <div className="space-y-2 p-2">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <span className="truncate">{name}</span>
            <Badge variant="outline">{admin ? "管理員" : "個人帳本"}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">僅顯示你的債務資料</p>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onLogout} disabled={pending}>
              <LogOut />
              <span>{pending ? "正在登出…" : "登出"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
