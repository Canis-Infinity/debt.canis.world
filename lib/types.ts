export type Payment =
  | { method: "bank"; bankCode: string; bankAccount: string }
  | { method: "line_pay_money" | "ipass_money" | "cash" }

export type User = {
  id: string
  name: string
  email: string
  role: "user" | "admin"
  status: "pending" | "approved" | "rejected" | "suspended"
  version: number
  createdAt: string
  updatedAt: string
  reviewedAt?: string
}
export type Repayment = {
  id: string
  date: string
  amount: number
  payment: Payment
  note: string
  createdAt: string
  updatedAt: string
}
export type Debt = {
  initialAmount: number
  borrowings: Borrowing[]
  id: string
  date: string
  amount: number
  lender: string
  payment: Payment
  note: string
  version: number
  paid: number
  remaining: number
  repayments: Repayment[]
  createdAt: string
  updatedAt: string
}
export type Borrowing = Pick<
  Repayment,
  "id" | "date" | "amount" | "note" | "createdAt" | "updatedAt"
>
export const paymentLabels = {
  bank: "匯款",
  line_pay_money: "LINE Pay Money",
  ipass_money: "iPass Money",
  cash: "現金",
}
export const statusLabels = {
  pending: "待核准",
  approved: "已核准",
  rejected: "未通過",
  suspended: "已停用",
}
export function money(value: number | bigint) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(value)
}
export function today() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())
  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type)?.value)
    .join("-")
}
