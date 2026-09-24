import { api } from "@/lib/api"
import type { Deletion, Editor } from "@/lib/record-types"
import type { Debt } from "@/lib/types"
import type {
  borrowingSchema,
  debtSchema,
  repaymentSchema,
} from "@/lib/validation"
import type { z } from "zod"

type RecordInput =
  | z.output<typeof debtSchema>
  | z.output<typeof repaymentSchema>
  | z.output<typeof borrowingSchema>
export const listDebts = async (signal?: AbortSignal) =>
  (await api<{ debts: Debt[] }>("/debts", { signal })).debts
export function saveRecord(
  editor: Editor,
  input: RecordInput,
  borrowingMode: string
) {
  const isRepayment = editor.kind === "repayment"
  const appendBorrowing =
    editor.kind === "borrowing" && borrowingMode === "existing"
  const newDebt = editor.kind === "borrowing" && borrowingMode === "new"
  const record =
    editor.kind === "repayment"
      ? editor.repayment
      : editor.kind === "borrowing"
        ? editor.borrowing
        : editor.debt
  const path = isRepayment
    ? `/debts/${editor.debt.id}/repayments${editor.repayment ? `/${editor.repayment.id}` : ""}`
    : appendBorrowing
      ? `/debts/${editor.debt.id}/borrowings${editor.borrowing ? `/${editor.borrowing.id}` : ""}`
      : `/debts${editor.debt && !newDebt ? `/${editor.debt.id}` : ""}`
  const body = {
    ...input,
    ...(editor.kind === "debt" && editor.debt
      ? {
          amount:
            input.amount +
            editor.debt.amount -
            (editor.debt.initialAmount ?? editor.debt.amount),
        }
      : {}),
    ...(editor.debt && !newDebt ? { version: editor.debt.version } : {}),
  }
  return api<{ debt: Debt }>(path, {
    method: record ? "PUT" : "POST",
    body: JSON.stringify(body),
  })
}
export function deleteRecord({ debt, borrowing, repayment }: Deletion) {
  return api<{ debt?: Debt }>(
    `/debts/${debt.id}${borrowing ? `/borrowings/${borrowing.id}` : repayment ? `/repayments/${repayment.id}` : ""}`,
    { method: "DELETE", body: JSON.stringify({ version: debt.version }) }
  )
}
