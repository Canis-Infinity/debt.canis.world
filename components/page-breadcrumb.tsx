"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
export function PageBreadcrumb({ path: override }: { path?: string }) {
  const pathname = usePathname()
  const path = override || pathname
  const label =
    path === "/"
      ? "債務總覽"
      : path === "/admin"
        ? "使用者管理"
        : path === "/settings"
          ? "帳號設定"
          : path === "/register"
            ? "註冊"
            : path === "/offline"
              ? "離線"
              : "登入"
  return (
    <Breadcrumb aria-label="頁面路徑" className="mb-5">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/" />}>首頁</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{label}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
