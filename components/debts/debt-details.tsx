"use client"

import { BorrowingHistory } from "@/components/debts/borrowings-history"
import { PaymentText } from "@/components/debts/payment-text"
import { RepaymentHistory } from "@/components/debts/repayments-history"
import { Button } from "@/components/ui/button"
import {
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { useDebtHistory } from "@/hooks/use-debt-history"
import type { Deletion, Editor } from "@/lib/record-types"
import { type Debt } from "@/lib/types"
import { formatAmount } from "@/utils/format"
import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2, X } from "lucide-react"
import type { ReactNode } from "react"

export function DebtDetails({
  selected,
  history,
  setEditor,
  setDeletion,
  dialogs,
}: {
  selected: Debt
  history: ReturnType<typeof useDebtHistory>
  setEditor: (editor: Editor) => void
  setDeletion: (deletion: Deletion) => void
  dialogs: ReactNode
}) {
  return (
    <SheetContent
      showCloseButton={false}
      className="data-[side=right]:w-full data-[side=right]:sm:max-w-2xl"
    >
      <SheetHeader className="shrink-0 border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <SheetTitle className="break-words">
              跟 {selected.lender} 借的債務
            </SheetTitle>
            <SheetDescription>
              {selected.date} 借款 · {selected.remaining ? "未結清" : "已結清"}
            </SheetDescription>
          </div>
          <SheetClose
            render={
              <Button variant="ghost" size="icon" aria-label="關閉債務明細" />
            }
          >
            <X />
          </SheetClose>
        </div>
      </SheetHeader>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <dl className="mb-5 grid grid-cols-3 gap-3 border-b pb-4 text-xs">
          {[
            { label: "借款金額", value: selected.amount },
            { label: "已還金額", value: selected.paid },
            { label: "剩餘金額", value: selected.remaining },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="mt-1 font-mono text-base font-medium break-all">
                {formatAmount(value)}
              </dd>
            </div>
          ))}
        </dl>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-sm">
            <p className="mb-2 text-xs text-muted-foreground">約定還款方式</p>
            <PaymentText payment={selected.payment} />
          </div>
          <div className="text-sm">
            <p className="mb-2 text-xs text-muted-foreground">備註</p>
            <p className="break-words whitespace-pre-wrap">
              {selected.note || "未填寫備註"}
            </p>
          </div>
        </div>
        <div className="my-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button
            size="default"
            onClick={() => setEditor({ kind: "borrowing", debt: selected })}
          >
            <ArrowDownLeft />
            新增借款
          </Button>
          <Button
            size="default"
            disabled={selected.remaining === 0}
            onClick={() => setEditor({ kind: "repayment", debt: selected })}
          >
            <ArrowUpRight />
            {selected.remaining === 0 ? "已全部還清" : "新增還款"}
          </Button>
          <Button
            size="default"
            variant="outline"
            onClick={() => setEditor({ kind: "debt", debt: selected })}
          >
            <Pencil />
            編輯債務
          </Button>
          <Button
            size="default"
            variant="destructive"
            onClick={() => setDeletion({ debt: selected })}
          >
            <Trash2 />
            刪除債務
          </Button>
        </div>
        <Tabs defaultValue="repayments">
          <TabsList aria-label="借還紀錄">
            <TabsTrigger value="repayments">還款紀錄</TabsTrigger>
            <TabsTrigger value="borrowings">借款紀錄</TabsTrigger>
          </TabsList>
          <RepaymentHistory
            selected={selected}
            history={history}
            setEditor={setEditor}
            setDeletion={setDeletion}
          />
          <BorrowingHistory
            selected={selected}
            history={history}
            setEditor={setEditor}
            setDeletion={setDeletion}
          />
        </Tabs>
        <p className="mt-3 text-xs text-muted-foreground">
          最後更新：
          {new Date(selected.updatedAt).toLocaleString("zh-TW", {
            timeZone: "Asia/Taipei",
          })}
        </p>
      </div>
      {dialogs}
    </SheetContent>
  )
}
