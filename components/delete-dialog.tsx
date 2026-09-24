"use client"
import { useNestedBackdrop } from "@/hooks/use-nested-backdrop"
import { createPortal } from "react-dom"
import { useRef, useState } from "react"
import { useDialogPresence } from "@/hooks/use-dialog-presence"
import { Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FieldError } from "@/components/ui/field"
import { api, mutation, ApiError } from "@/lib/api"
import type { Debt, Repayment, Borrowing } from "@/lib/types"
import { money } from "@/lib/types"
export function DeleteDialog({
  debt,
  repayment,
  borrowing,
  onClose,
  nested = false,
  onDeleted,
}: {
  debt: Debt
  repayment?: Repayment
  borrowing?: Borrowing
  nested?: boolean
  onClose: () => void
  onDeleted: (debt?: Debt) => void
}) {
  const { container, ref: popupRef } = useNestedBackdrop(nested)
  const record = repayment || borrowing
  const kind = borrowing ? "借款" : "還款"
  const [pending, setPending] = useState(false)
  const afterExit = useRef<(() => void) | null>(null)
  const presence = useDialogPresence(() => {
    afterExit.current?.()
    onClose()
  })
  const [error, setError] = useState("")
  const [conflict, setConflict] = useState(false)
  async function remove() {
    if (pending) return
    setPending(true)
    setError("")
    try {
      const result = await mutation(
        "正在刪除…",
        record ? `${kind}紀錄已刪除` : "債務及全部借還紀錄已刪除",
        () =>
          api<{ debt?: Debt }>(
            `/debts/${debt.id}${borrowing ? `/borrowings/${borrowing.id}` : repayment ? `/repayments/${repayment.id}` : ""}`,
            {
              method: "DELETE",
              body: JSON.stringify({ version: debt.version }),
            }
          )
      )
      afterExit.current = () => onDeleted(result.debt)
      presence.close()
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗")
      if (err instanceof ApiError && err.status === 409) setConflict(true)
    } finally {
      setPending(false)
    }
  }
  return (
    <AlertDialog
      open={presence.open}
      onOpenChangeComplete={presence.onOpenChangeComplete}
      onOpenChange={(open) => {
        if (!open && !pending) presence.close()
      }}
    >
      {container && createPortal(<AlertDialogOverlay forceRender />, container)}
      <AlertDialogContent size="sm" ref={popupRef}>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>
            {record ? `刪除這筆${kind}？` : "刪除這筆債務？"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {record
              ? `將刪除 ${record.date} 的 ${money(record.amount)} ${kind}，並重新計算剩餘債務。`
              : `將刪除跟 ${debt.lender} 借的 ${money(debt.amount)} 債務，以及全部借款與 ${debt.repayments.length} 筆還款紀錄。`}
            此操作無法復原。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <FieldError>{error}</FieldError>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>取消</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={conflict ? () => window.location.reload() : remove}
          >
            {conflict ? "重新載入最新紀錄" : pending ? "刪除中…" : "確認刪除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
