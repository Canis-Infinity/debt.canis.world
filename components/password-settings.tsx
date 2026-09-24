"use client"
import { ProfileForm } from "@/components/profile-form"
import { useState } from "react"
import { useRouter } from "nextjs-toploader/app"
import { KeyRound } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { PasswordInput } from "@/components/password-input"
import { FormField } from "@/components/form-field"
import { Button } from "@/components/ui/button"
import { FieldError, FieldGroup } from "@/components/ui/field"
import { toast } from "@/components/ui/toast"
import { api, ApiError, mutation } from "@/lib/api"
import {
  changePasswordSchema,
  zodFields,
  type FieldErrors,
} from "@/lib/validation"
export function PasswordSettings() {
  const { user, setUser } = useAuth()
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const parsed = changePasswordSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget))
    )
    if (!parsed.success) {
      setErrors(zodFields(parsed.error))
      toast.add({ title: "請檢查表單欄位", type: "error" })
      return
    }
    setPending(true)
    setErrors({})
    try {
      await mutation("正在修改密碼…", "密碼已更新，請重新登入", () =>
        api("/auth/password", {
          method: "POST",
          body: JSON.stringify(parsed.data),
        })
      )
      setUser(null)
      router.replace("/login")
    } catch (err) {
      setErrors(
        err instanceof ApiError && err.fields
          ? err.fields
          : { form: [err instanceof Error ? err.message : "修改失敗"] }
      )
    } finally {
      setPending(false)
    }
  }
  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
      <div className="space-y-5">
        <h2 className="text-lg font-semibold">帳號資料</h2>
        <ProfileForm />
        <dl className="space-y-4 border-t pt-5 text-sm">
          <div>
            <dt className="text-muted-foreground">電子郵件</dt>
            <dd className="mt-1 break-all">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">帳號權限</dt>
            <dd className="mt-1">
              {user?.role === "admin" ? "系統管理員" : "一般使用者"}
            </dd>
          </div>
        </dl>
      </div>
      <div className="max-w-lg border-t pt-6 lg:border-t-0 lg:pt-0">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <KeyRound className="text-primary" />
          修改密碼
        </h2>
        <p className="mt-2 mb-6 text-sm text-muted-foreground">
          更新後會登出所有裝置，請使用新密碼重新登入。
        </p>
        <form onSubmit={submit} noValidate aria-busy={pending}>
          <FieldGroup>
            {[
              { id: "currentPassword", label: "目前密碼" },
              { id: "newPassword", label: "新密碼" },
              { id: "confirmPassword", label: "再次輸入新密碼" },
            ].map(({ id, label }) => (
              <FormField
                key={id}
                id={id}
                label={label}
                required
                error={errors[id]}
                hint={
                  id === "newPassword"
                    ? "至少 12 個字元，最多 72 bytes。"
                    : undefined
                }
              >
                <PasswordInput
                  id={id}
                  name={id}
                  required
                  disabled={pending}
                  autoComplete={
                    id === "currentPassword"
                      ? "current-password"
                      : "new-password"
                  }
                  aria-invalid={!!errors[id]}
                  aria-describedby={`${id}-error`}
                />
              </FormField>
            ))}
            <FieldError errors={errors.form?.map((message) => ({ message }))} />
            <Button type="submit" disabled={pending}>
              <KeyRound />
              {pending ? "正在修改…" : "更新密碼"}
            </Button>
          </FieldGroup>
        </form>
      </div>
    </section>
  )
}
