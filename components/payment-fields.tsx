"use client"

import { AppSelect } from "@/components/app-select"
import { FormField } from "@/components/form-field"
import { Input } from "@/components/ui/input"
import { paymentLabels } from "@/configs/labels"
import { type Payment } from "@/lib/types"
import type { FieldErrors } from "@/lib/validation"

export function PaymentFields({
  value,
  onChange,
  errors,
  disabled,
  label,
}: {
  value: Payment
  onChange: (payment: Payment) => void
  errors: FieldErrors
  disabled: boolean
  label: string
}) {
  return (
    <>
      <FormField
        id="payment-method"
        label={label}
        required
        error={errors.payment || errors["payment.method"]}
      >
        <AppSelect
          id="payment-method"
          value={value.method}
          disabled={disabled}
          required
          className="w-full"
          onValueChange={(value) => {
            const method = value as Payment["method"]
            onChange(
              method === "bank"
                ? { method, bankCode: "", bankAccount: "" }
                : { method }
            )
          }}
          options={Object.entries(paymentLabels).map(([value, label]) => ({
            value,
            label,
          }))}
          invalid={!!errors.payment || !!errors["payment.method"]}
          describedBy="payment-method-error"
        />
      </FormField>
      {value.method === "bank" && (
        <div className="grid gap-4 sm:grid-cols-[100px_1fr]">
          <FormField
            id="bank-code"
            label="銀行代碼"
            required
            error={errors["payment.bankCode"]}
          >
            <Input
              id="bank-code"
              value={value.bankCode}
              onChange={(event) =>
                onChange({ ...value, bankCode: event.target.value })
              }
              inputMode="numeric"
              placeholder="例如 004"
              maxLength={3}
              required
              disabled={disabled}
              aria-invalid={!!errors["payment.bankCode"]}
              aria-describedby="bank-code-error"
            />
          </FormField>
          <FormField
            id="bank-account"
            label="銀行帳號"
            required
            error={errors["payment.bankAccount"]}
          >
            <Input
              id="bank-account"
              value={value.bankAccount}
              onChange={(event) =>
                onChange({ ...value, bankAccount: event.target.value })
              }
              inputMode="numeric"
              autoComplete="off"
              maxLength={20}
              required
              disabled={disabled}
              aria-invalid={!!errors["payment.bankAccount"]}
              aria-describedby="bank-account-error"
            />
          </FormField>
        </div>
      )}
    </>
  )
}
