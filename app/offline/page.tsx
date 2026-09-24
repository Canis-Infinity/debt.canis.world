import { PageBreadcrumb } from "@/components/page-breadcrumb"
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
            <EmptyTitle>暫時無法開啟帳本</EmptyTitle>
            <EmptyDescription>
              網路可能已中斷，或服務暫時無法使用。請確認連線，稍後再試。債務紀錄不會儲存在離線快取。
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <form action="/" method="get">
              <Button type="submit">重新開啟帳本</Button>
            </form>
          </EmptyContent>
        </Empty>
      </div>
    </main>
  )
}
