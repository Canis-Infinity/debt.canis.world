import { PageBreadcrumb } from "@/components/page-breadcrumb"
import Link from "next/link"
import { WifiOff } from "lucide-react"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-7xl flex-col p-6">
      <PageBreadcrumb path="/offline" />
      <div className="flex flex-1 items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <WifiOff />
            </EmptyMedia>
            <EmptyTitle>目前沒有網路連線</EmptyTitle>
            <EmptyDescription>
              為保護你的資料，債務紀錄不會儲存在離線快取。請重新連線後再開啟帳本。
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/" />}>重新開啟帳本</Button>
          </EmptyContent>
        </Empty>
      </div>
    </main>
  )
}
