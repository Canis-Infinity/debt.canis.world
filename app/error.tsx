"use client"
import { useEffect } from "react"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
export default function ErrorPage({ reset }: { reset: () => void }) {
  useEffect(() => {
    toast.add({ title: "頁面暫時無法載入", type: "error" })
  }, [])
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>頁面暫時無法載入</EmptyTitle>
        <EmptyDescription>
          請重試；若剛才已送出紀錄，重新載入確認後再操作。
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={reset}>重試</Button>
      </EmptyContent>
    </Empty>
  )
}
