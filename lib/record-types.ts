import type { Borrowing, Debt, Repayment } from "@/lib/types"

export type Editor =
  | { kind: "debt"; debt?: Debt }
  | { kind: "borrowing"; debt: Debt; borrowing?: Borrowing }
  | { kind: "repayment"; debt: Debt; repayment?: Repayment }

export type Deletion = {
  debt: Debt
  repayment?: Repayment
  borrowing?: Borrowing
}
