"use client"

import { paymentLabels } from "@/configs/labels"
import { type Payment } from "@/lib/types"

export function PaymentText({ payment }: { payment: Payment }) {
  return (
    <span className="break-all">
      {paymentLabels[payment.method]}
      {payment.method === "bank" && (
        <span className="mt-1 block font-mono text-xs text-muted-foreground">
          {payment.bankCode} · {payment.bankAccount}
        </span>
      )}
    </span>
  )
}
