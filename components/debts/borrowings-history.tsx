"use client"

import { ListPagination } from "@/components/list-pagination"
import { Button } from "@/components/ui/button"
import { TabsContent } from "@/components/ui/tabs"
import type { useDebtHistory } from "@/hooks/use-debt-history"
import type { Deletion, Editor } from "@/lib/record-types"
import { type Debt } from "@/lib/types"
import { formatAmount } from "@/utils/format"
import { Pencil, Trash2 } from "lucide-react"

export function BorrowingHistory({
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
    borrowingPageSize,
    currentBorrowingPage,
    borrowingRecords,
    setBorrowingPage,
    setBorrowingPageSize,
  } = history
  return (
    <TabsContent value="borrowings">
      <h3 className="mb-3 font-medium">
        借款紀錄 · {borrowingRecords.length} 筆
      </h3>
      <div className="divide-y border-y">
        {borrowingRecords
          .slice(
            (currentBorrowingPage - 1) * borrowingPageSize,
            currentBorrowingPage * borrowingPageSize
          )
          .map((borrowing) => (
            <article key={borrowing.id} className="space-y-2 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {borrowing.date} · {borrowing.initial ? "首次借款" : "加借"}
                  </p>
                  <p className="font-mono font-medium break-all">
                    {formatAmount(borrowing.amount)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`編輯 ${borrowing.date} 的借款`}
                    onClick={() =>
                      setEditor(
                        borrowing.initial
                          ? { kind: "debt", debt: selected }
                          : {
                              kind: "borrowing",
                              debt: selected,
                              borrowing,
                            }
                      )
                    }
                  >
                    <Pencil />
                  </Button>
                  {!borrowing.initial && (
                    <Button
                      variant="destructive"
                      size="icon"
                      aria-label={`刪除 ${borrowing.date} 的借款`}
                      onClick={() => setDeletion({ debt: selected, borrowing })}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </div>
              </div>
              {borrowing.note && (
                <p className="text-xs break-words whitespace-pre-wrap text-muted-foreground">
                  {borrowing.note}
                </p>
              )}
            </article>
          ))}
      </div>
      <ListPagination
        label="借款"
        total={borrowingRecords.length}
        page={currentBorrowingPage}
        pageSize={borrowingPageSize}
        onPageChange={setBorrowingPage}
        onPageSizeChange={(size) => {
          setBorrowingPageSize(size)
          history.setBorrowingPage(1)
        }}
      />
    </TabsContent>
  )
}
