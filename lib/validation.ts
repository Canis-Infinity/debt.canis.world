import { z } from "zod"

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "請選擇日期")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`)
    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value &&
      value >= "1900-01-01"
    )
  }, "日期無效")
const amount = z
  .string()
  .regex(/^\d+$/, "請輸入新臺幣正整數")
  .transform(Number)
  .pipe(
    z
      .number()
      .int()
      .min(1, "金額必須大於 0")
      .max(999999999999, "金額超出可記錄範圍")
  )
const payment = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("other"),
    description: z
      .string()
      .trim()
      .min(1, "請填寫還款方式")
      .max(100, "還款方式最多 100 個字元"),
  }),
  z.object({
    method: z.literal("bank"),
    bankCode: z.string().regex(/^\d{3}$/, "銀行代碼需為 3 位數字"),
    bankAccount: z.string().regex(/^\d{5,20}$/, "銀行帳號需為 5–20 位數字"),
  }),
  z.object({ method: z.literal("line_pay_money") }),
  z.object({ method: z.literal("ipass_money") }),
  z.object({ method: z.literal("cash") }),
])
const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("請輸入有效的電子郵件")
  .max(254)
const password = z
  .string()
  .min(12, "密碼至少需要 12 個字元")
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "密碼不可超過 72 bytes"
  )
export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "請輸入名稱").max(80, "名稱最多 80 個字元"),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "兩次密碼不一致",
  })
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "請輸入密碼").max(200),
})
export const debtSchema = z.object({
  date,
  amount,
  lender: z.string().trim().min(1, "請填寫跟誰借").max(100, "最多 100 個字元"),
  payment,
  note: z.string().trim().max(2000, "備註最多 2,000 個字元"),
})
export const repaymentSchema = debtSchema.omit({ lender: true })
export const borrowingSchema = debtSchema.pick({
  date: true,
  amount: true,
  note: true,
})
export const accountStatusSchema = z.object({
  status: z.enum(["approved", "rejected", "suspended"]),
  version: z.number().int().nonnegative(),
})
export type FieldErrors = Record<string, string[] | undefined>
export function zodFields(error: z.ZodError): FieldErrors {
  const fields: FieldErrors = {}
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form"
    fields[key] = [...(fields[key] || []), issue.message]
  }
  return fields
}

export const changePasswordSchema = z
  .object({
    currentPassword: loginSchema.shape.password,
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "兩次密碼不一致",
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    path: ["newPassword"],
    message: "新密碼不可與目前密碼相同",
  })

export const profileSchema = z.object({ name: registerSchema.shape.name })
