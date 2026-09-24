"use client"

import { PaymentText } from "@/components/debts/payment-text"
import { ListPagination } from "@/components/list-pagination"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { TabsContent } from "@/components/ui/tabs"
import type { useDebtHistory } from "@/hooks/use-debt-history"
import type { Deletion, Editor } from "@/lib/record-types"
import { type Debt } from "@/lib/types"
import { formatAmount } from "@/utils/format"
import { Pencil, Trash2 } from "lucide-react"

export function RepaymentHistory({
  selected,
  history,
  setEditor,
  setDeletion,
}: {
  selected: Debt
  history: ReturnType<typeof useDebtHistory>
  setEditor: (editor: Editor) => void
  setDeletion: (deletion: Deletion) => void
}) {
  const {
    repaymentPageSize,
    currentRepaymentPage,
    setRepaymentPage,
    setRepaymentPageSize,
  } = history
  return (
    <TabsContent value="repayments">
      <div className="mb-3 flex flex-wrap justify-between gap-2 text-sm">
        <h3 className="font-medium">
          還款紀錄 · {selected.repayments.length} 筆
        </h3>
        <span className="text-muted-foreground">
          剩餘{" "}
          <span className="font-mono text-foreground">
            {formatAmount(selected.remaining)}
          </span>
        </span>
      </div>
      {!selected.repayments.length ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>尚未有還款紀錄</EmptyTitle>
            <EmptyDescription>
              每完成一次還款，就在這裡記錄日期、金額與方式。
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="divide-y border-y">
          {[...selected.repayments]
            .sort(
              (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
            )
            .slice(
              (currentRepaymentPage - 1) * repaymentPageSize,
              currentRepaymentPage * repaymentPageSize
            )
            .map((repayment) => (
              <article
                key={repayment.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-3 sm:grid-cols-[100px_1fr_auto]"
              >
                <div className="col-span-2 flex min-w-0 items-center justify-between gap-3 sm:col-span-1 sm:block">
                  <p className="text-xs text-muted-foreground">
                    {repayment.date}
                  </p>
                  <p className="font-mono font-medium break-all sm:mt-1">
                    {formatAmount(repayment.amount)}
                  </p>
                </div>
                <div className="min-w-0 text-sm">
                  <PaymentText payment={repayment.payment} />
                  {repayment.note && (
                    <p className="mt-2 text-xs break-words whitespace-pre-wrap text-muted-foreground">
                      {repayment.note}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`編輯 ${repayment.date} 的還款`}
                    onClick={() =>
                      setEditor({
                        kind: "repayment",
                        debt: selected,
                        repayment,
                      })
                    }
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    aria-label={`刪除 ${repayment.date} 的還款`}
                    onClick={() => setDeletion({ debt: selected, repayment })}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </article>
            ))}
        </div>
      )}
      {selected.repayments.length > 0 && (
        <ListPagination
          label="還款"
          total={selected.repayments.length}
          page={currentRepaymentPage}
          pageSize={repaymentPageSize}
          onPageChange={setRepaymentPage}
          onPageSizeChange={(size) => {
            setRepaymentPageSize(size)
            history.setRepaymentPage(1)
          }}
        />
      )}
    </TabsContent>
  )
}
