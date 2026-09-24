"use client"
import { SiteFooter } from "@/components/site-footer"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "nextjs-toploader/app"
import { useEffect, useState } from "react"
import {
  Wallet,
  ShieldCheck,
  UserRound,
  LogOut,
  LayoutDashboard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { ThemeSwitch } from "@/components/theme-switch"
import { api, mutation } from "@/lib/api"
import { MobileNavigation } from "@/components/mobile-navigation"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { PageSkeleton } from "@/components/page-skeleton"
import { PageBreadcrumb } from "@/components/page-breadcrumb"

export function AppShell({
  children,
  admin = false,
}: {
  children: React.ReactNode
  admin?: boolean
}) {
  const { user, loading, error, reload, setUser } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [pending, setPending] = useState(false)
  useEffect(() => {
    if (!loading && !error && !user) router.replace("/login")
  }, [loading, error, user, router])
  if (loading || (!user && !error))
    return (
      <PageSkeleton
        variant={
          pathname === "/admin"
            ? "users"
            : pathname.startsWith("/settings")
              ? "settings"
              : "dashboard"
        }
      />
    )
  if (error)
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>暫時無法載入</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={reload}>重新連線</Button>
        </EmptyContent>
      </Empty>
    )
  if (!user) return null
  async function logout() {
    setPending(true)
    try {
      await mutation("正在登出…", "已登出", () =>
        api("/auth/logout", { method: "POST", body: "{}" })
      )
      setUser(null)
      router.replace("/login")
    } catch {
      /* toast displays failure */
    } finally {
      setPending(false)
    }
  }
  return (
    <SidebarProvider open={false}>
      <MobileNavigation
        name={user.name}
        admin={user.role === "admin"}
        pending={pending}
        onLogout={logout}
      />
      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b bg-background">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:px-6 lg:px-10">
            <SidebarTrigger className="md:hidden" aria-label="開啟導覽選單" />
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 font-semibold"
            >
              <Wallet className="size-5 text-primary" />
              債務手帳
            </Link>
            <span className="hidden text-xs text-muted-foreground xl:inline">
              DEBT / 記錄每一步
            </span>
            <nav
              aria-label="主要導覽"
              className="ml-4 hidden items-center gap-2 md:flex"
            >
              <Button
                render={<Link href="/" />}
                variant={pathname === "/" ? "secondary" : "ghost"}
                aria-current={pathname === "/" ? "page" : undefined}
              >
                <LayoutDashboard />
                債務總覽
              </Button>
              <Button
                render={<Link href="/settings" />}
                variant={
                  pathname.startsWith("/settings") ? "secondary" : "ghost"
                }
                aria-current={
                  pathname.startsWith("/settings") ? "page" : undefined
                }
              >
                <UserRound />
                帳號設定
              </Button>
              {user.role === "admin" && (
                <Button
                  render={<Link href="/admin" />}
                  variant={pathname === "/admin" ? "secondary" : "ghost"}
                  aria-current={pathname === "/admin" ? "page" : undefined}
                >
                  <ShieldCheck />
                  使用者管理
                </Button>
              )}
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <ThemeSwitch />
              <Button
                variant="ghost"
                className="hidden md:inline-flex"
                onClick={logout}
                disabled={pending}
                aria-label="登出"
              >
                <LogOut /> <span className="hidden sm:inline">登出</span>
              </Button>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
          <PageBreadcrumb />
          <div className="mb-5 hidden flex-wrap items-center gap-2 text-xs text-muted-foreground md:flex">
            <span className="max-w-full truncate">{user.name}</span>
            <Badge variant="outline">
              {user.role === "admin" ? "管理員" : "個人帳本"}
            </Badge>
            <span>僅顯示你的債務資料</span>
          </div>
          {admin && user.role !== "admin" ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>無法存取此頁面</EmptyTitle>
                <EmptyDescription>這個頁面僅供管理員使用。</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button render={<Link href="/" />}>返回債務總覽</Button>
              </EmptyContent>
            </Empty>
          ) : (
            children
          )}
        </main>
        <SiteFooter />
      </div>
    </SidebarProvider>
  )
}
