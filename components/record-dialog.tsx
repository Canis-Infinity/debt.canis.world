"use client"
import { useNestedBackdrop } from "@/hooks/use-nested-backdrop"
import { createPortal } from "react-dom"
import { useRef, useState } from "react"
import { useDialogPresence } from "@/hooks/use-dialog-presence"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { AppSelect } from "@/components/app-select"
import { DatePicker } from "@/components/date-picker"
import { Textarea } from "@/components/ui/textarea"
import { FieldError, FieldGroup } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { FormField } from "@/components/form-field"
import { PaymentFields } from "@/components/payment-fields"
import { api, ApiError, mutation } from "@/lib/api"
import {
  debtSchema,
  borrowingSchema,
  repaymentSchema,
  zodFields,
  type FieldErrors,
} from "@/lib/validation"
import {
  money,
  today,
  type Debt,
  type Borrowing,
  type Payment,
  type Repayment,
} from "@/lib/types"
import { toast } from "@/components/ui/toast"

export type Editor =
  | { kind: "debt"; debt?: Debt }
  | { kind: "borrowing"; debt: Debt; borrowing?: Borrowing }
  | { kind: "repayment"; debt: Debt; repayment?: Repayment }
export function RecordDialog({
  editor,
  onClose,
  nested = false,
  onSaved,
}: {
  editor: Editor
  nested?: boolean
  onClose: () => void
  onSaved: (debt: Debt) => void
}) {
  const { container, ref: popupRef } = useNestedBackdrop(nested)
  const isRepayment = editor.kind === "repayment"
  const isBorrowing = editor.kind === "borrowing"
  const [borrowingMode, setBorrowingMode] = useState("existing")
  const appendBorrowing = isBorrowing && borrowingMode === "existing"
  const newDebt = isBorrowing && borrowingMode === "new"
  const record = isRepayment
    ? editor.repayment
    : isBorrowing
      ? editor.borrowing
      : editor.debt
  const initialAmount = editor.debt?.initialAmount ?? editor.debt?.amount ?? 0
  const defaultAmount =
    editor.kind === "debt" && editor.debt ? initialAmount : record?.amount
  const [payment, setPayment] = useState<Payment>(
    (editor.kind === "repayment" ? editor.repayment?.payment : undefined) ||
      editor.debt?.payment || { method: "cash" }
  )
  const [errors, setErrors] = useState<FieldErrors>({})
  const [pending, setPending] = useState(false)
  const afterExit = useRef<(() => void) | null>(null)
  const presence = useDialogPresence(() => {
    afterExit.current?.()
    onClose()
  })
  const [conflict, setConflict] = useState(false)
  const title = `${record ? "編輯" : "新增"}${isRepayment ? "還款" : isBorrowing ? "借款" : "債務"}`
  const available = isRepayment
    ? editor.debt.remaining + (editor.repayment?.amount || 0)
    : undefined
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const raw = {
      ...Object.fromEntries(new FormData(event.currentTarget)),
      payment,
    }
    const parsed = (
      isRepayment
        ? repaymentSchema
        : appendBorrowing
          ? borrowingSchema
          : debtSchema
    ).safeParse(raw)
    if (!parsed.success) {
      setErrors(zodFields(parsed.error))
      toast.add({ title: "請檢查表單欄位", type: "error" })
      return
    }
    if (
      (available !== undefined && parsed.data.amount > available) ||
      (editor.kind === "debt" &&
        editor.debt &&
        parsed.data.amount + editor.debt.amount - initialAmount <
          editor.debt.paid)
    ) {
      setErrors({
        amount: [
          isRepayment
            ? `本次最多可還 ${money(available!)}`
            : `借款不可少於已還金額 ${money(editor.debt!.paid)}`,
        ],
      })
      toast.add({ title: "金額超出可記錄範圍", type: "error" })
      return
    }
    setErrors({})
    setPending(true)
    const path = isRepayment
      ? `/debts/${editor.debt.id}/repayments${editor.repayment ? `/${editor.repayment.id}` : ""}`
      : appendBorrowing
        ? `/debts/${editor.debt!.id}/borrowings${editor.kind === "borrowing" && editor.borrowing ? `/${editor.borrowing.id}` : ""}`
        : `/debts${editor.debt && !newDebt ? `/${editor.debt.id}` : ""}`
    const body = {
      ...parsed.data,
      ...(editor.kind === "debt" && editor.debt
        ? { amount: parsed.data.amount + editor.debt.amount - initialAmount }
        : {}),
      ...(editor.debt && !newDebt ? { version: editor.debt.version } : {}),
    }
    try {
      const result = await mutation("正在儲存…", `${title}成功`, () =>
        api<{ debt: Debt }>(path, {
          method: record ? "PUT" : "POST",
          body: JSON.stringify(body),
        })
      )
      afterExit.current = () => onSaved(result.debt)
      presence.close()
    } catch (err) {
      setErrors(
        err instanceof ApiError && err.fields
          ? err.fields
          : { form: [err instanceof Error ? err.message : "儲存失敗"] }
      )
      if (err instanceof ApiError && err.status === 409) setConflict(true)
    } finally {
      setPending(false)
    }
  }
  return (
    <Dialog
      open={presence.open}
      onOpenChangeComplete={presence.onOpenChangeComplete}
      onOpenChange={(open) => {
        if (!open && !pending) presence.close()
      }}
    >
      {container && createPortal(<DialogOverlay forceRender />, container)}
      <DialogContent
        ref={popupRef}
        className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
        showCloseButton={!pending}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isRepayment
              ? `跟 ${editor.debt.lender} 借的債務，本次最多可還 ${money(available!)}。`
              : appendBorrowing
                ? `向 ${editor.debt!.lender} 加借，將累加至這筆債務，沿用約定還款方式。`
                : editor.kind === "debt" && editor.debt
                  ? "編輯首次借款與約定資料；後續加借紀錄保持獨立。"
                  : "記錄借款日期、金額與約定還款方式。金額單位為新臺幣。"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate aria-busy={pending}>
          <FieldGroup>
            {isBorrowing && !editor.borrowing && (
              <FormField id="borrowing-mode" label="記錄方式" required>
                <AppSelect
                  id="borrowing-mode"
                  label="記錄方式"
                  value={borrowingMode}
                  onValueChange={setBorrowingMode}
                  disabled={pending}
                  className="w-full"
                  options={[
                    { value: "existing", label: "累加至這筆債務" },
                    { value: "new", label: "建立新債務" },
                  ]}
                />
              </FormField>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="record-date"
                label="日期"
                error={errors.date}
                required
              >
                <DatePicker
                  id="record-date"
                  name="date"
                  defaultValue={record?.date || today()}
                  disabled={pending}
                  invalid={!!errors.date}
                  describedBy="record-date-error"
                />
              </FormField>
              <FormField
                id="record-amount"
                label={isRepayment ? "還了多少（NT$）" : "借了多少（NT$）"}
                error={errors.amount}
                required
              >
                <InputGroup>
                  <InputGroupInput
                    id="record-amount"
                    name="amount"
                    inputMode="numeric"
                    defaultValue={defaultAmount?.toString() || ""}
                    placeholder="0"
                    required
                    disabled={pending}
                    className="font-mono"
                    aria-invalid={!!errors.amount}
                    aria-describedby="record-amount-error"
                  />
                  <InputGroupAddon>
                    <InputGroupText>NT$</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </FormField>
            </div>
            {!isRepayment && !appendBorrowing && (
              <FormField
                id="record-lender"
                label="跟誰借"
                error={errors.lender}
                required
              >
                <Input
                  id="record-lender"
                  name="lender"
                  defaultValue={editor.debt?.lender || ""}
                  maxLength={100}
                  required
                  disabled={pending}
                  placeholder="輸入對方名稱"
                  aria-invalid={!!errors.lender}
                  aria-describedby="record-lender-error"
                />
              </FormField>
            )}
            {!appendBorrowing && (
              <PaymentFields
                label={isRepayment ? "還款方式" : "約定還款方式"}
                value={payment}
                onChange={setPayment}
                errors={errors}
                disabled={pending}
              />
            )}
            <FormField
              id="record-note"
              label="備註（選填）"
              error={errors.note}
            >
              <Textarea
                id="record-note"
                name="note"
                defaultValue={record?.note || ""}
                maxLength={2000}
                rows={3}
                disabled={pending}
                aria-invalid={!!errors.note}
                aria-describedby="record-note-error"
                placeholder="補充這筆紀錄的相關資訊"
              />
            </FormField>
            <FieldError errors={errors.form?.map((message) => ({ message }))} />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={presence.close}
                disabled={pending}
              >
                取消
              </Button>
              {conflict ? (
                <Button type="button" onClick={() => window.location.reload()}>
                  重新載入最新紀錄
                </Button>
              ) : (
                <Button type="submit" disabled={pending}>
                  {pending ? "儲存中…" : "儲存紀錄"}
                </Button>
              )}
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}
