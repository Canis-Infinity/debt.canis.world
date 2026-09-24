import { paymentLabels } from "@/configs/labels"
import type { Payment } from "@/lib/types"

export function paymentLabel(payment: Payment) {
  return payment.method === "other"
    ? `其它：${payment.description}`
    : paymentLabels[payment.method]
}
