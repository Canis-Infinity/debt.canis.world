"use client"

import { Progress } from "@/components/ui/progress"
import { type Debt } from "@/lib/types"
import { money } from "@/utils/format"
import { ArrowDownLeft, ArrowUpRight, CheckCheck, Wallet } from "lucide-react"

export function DebtSummary({ debts }: { debts: Debt[] }) {
  const borrowed = debts.reduce((sum, debt) => sum + BigInt(debt.amount), 0n)
  const paid = debts.reduce((sum, debt) => sum + BigInt(debt.paid), 0n)
  const percent = borrowed ? Number((paid * 100n) / borrowed) : 0
  const settled = debts.filter((debt) => debt.remaining === 0).length
  return (
    <section aria-label="完整債務統計" className="mb-5 border-y py-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: "剩餘債務", value: borrowed - paid, icon: Wallet },
          { label: "累計借款", value: borrowed, icon: ArrowDownLeft },
          { label: "累計還款", value: paid, icon: ArrowUpRight },
        ].map(({ label, value, icon: Icon }, index) => (
          <div
            key={label}
            className={
              index
                ? "min-w-0 sm:border-l sm:pl-4"
                : "col-span-2 min-w-0 sm:col-span-1"
            }
          >
            <p className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Icon className="size-4" />
              {label}
            </p>
            <p
              className={`font-mono text-xl font-medium tracking-tight break-all sm:text-2xl ${index === 0 ? "text-primary" : ""}`}
            >
              {money(value)}
            </p>
          </div>
        ))}
      </div>
      <Progress value={percent} aria-label="整體還款進度" className="mt-4">
        <div className="flex w-full items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CheckCheck className="size-4" />
            已結清 {settled} / {debts.length} 筆
          </span>
          <span>整體已還 {percent}%</span>
        </div>
      </Progress>
    </section>
  )
}
