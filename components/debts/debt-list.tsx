"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { paymentLabel } from "@/utils/payment"
import { type Debt } from "@/lib/types"
import { money } from "@/utils/format"
import { ChevronRight } from "lucide-react"

export function DebtList({
  pageDebts,
  selectedId,
  openDetail,
}: {
  pageDebts: Debt[]
  selectedId: string | null
  openDetail: (id: string) => void
}) {
  return (
    <>
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>借款日期 / 對方</TableHead>
              <TableHead>約定還款</TableHead>
              <TableHead className="text-right">借款金額</TableHead>
              <TableHead className="text-right">已還金額</TableHead>
              <TableHead className="text-right">剩餘金額</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageDebts.map((debt) => (
              <TableRow
                key={debt.id}
                data-state={selectedId === debt.id ? "selected" : undefined}
              >
                <TableCell>
                  <span className="block max-w-40 truncate font-medium">
                    {debt.lender}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {debt.date}
                  </span>
                </TableCell>
                <TableCell className="max-w-48 break-all whitespace-normal">
                  {paymentLabel(debt.payment)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {money(debt.amount)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {money(debt.paid)}
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                  {money(debt.remaining)}
                </TableCell>
                <TableCell>
                  <Badge variant={debt.remaining ? "outline" : "secondary"}>
                    {debt.remaining ? "未結清" : "已結清"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => openDetail(debt.id)}
                    aria-haspopup="dialog"
                  >
                    明細 <ChevronRight />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="divide-y border-y lg:hidden">
        {pageDebts.map((debt) => (
          <article key={debt.id} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-medium">{debt.lender}</h3>
                <Badge variant={debt.remaining ? "outline" : "secondary"}>
                  {debt.remaining ? "未結清" : "已結清"}
                </Badge>
              </div>
              <p className="mt-1 text-xs break-all text-muted-foreground">
                {debt.date} · {paymentLabel(debt.payment)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                剩餘{" "}
                <span className="font-mono font-medium break-all text-foreground">
                  {money(debt.remaining)}
                </span>
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => openDetail(debt.id)}
              aria-haspopup="dialog"
            >
              還款明細 <ChevronRight />
            </Button>
          </article>
        ))}
      </div>
    </>
  )
}
