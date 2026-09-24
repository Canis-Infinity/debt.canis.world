"use client"

import { paymentLabel } from "@/utils/payment"
import { type Payment } from "@/lib/types"

export function PaymentText({ payment }: { payment: Payment }) {
  return (
    <span className="break-all">
      {paymentLabel(payment)}
      {payment.method === "bank" && (
        <span className="mt-1 block font-mono text-xs text-muted-foreground">
          {payment.bankCode} · {payment.bankAccount}
        </span>
      )}
    </span>
  )
}
