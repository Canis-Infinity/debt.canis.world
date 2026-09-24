import Link from "next/link"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
export default function NotFound() {
  return (
    <Empty className="min-h-svh">
      <EmptyHeader>
        <EmptyTitle>找不到這個頁面</EmptyTitle>
        <EmptyDescription>頁面可能已移除，請返回債務總覽。</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button render={<Link href="/" />}>返回總覽</Button>
      </EmptyContent>
    </Empty>
  )
}
