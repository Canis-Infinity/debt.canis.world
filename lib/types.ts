export type Payment =
  | { method: "other"; description: string }
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
