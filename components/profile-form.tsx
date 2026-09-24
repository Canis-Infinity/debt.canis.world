"use client"
import { useState } from "react"
import { Save } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { FormField } from "@/components/form-field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FieldError, FieldGroup } from "@/components/ui/field"
import { toast } from "@/components/ui/toast"
import { api, ApiError, mutation } from "@/lib/api"
import { profileSchema, zodFields, type FieldErrors } from "@/lib/validation"
import type { User } from "@/lib/types"
export function ProfileForm() {
  const { user, setUser } = useAuth()
  const [name, setName] = useState(user?.name || "")
  const [pending, setPending] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const parsed = profileSchema.safeParse({ name })
    if (!parsed.success) {
      setErrors(zodFields(parsed.error))
      toast.add({ title: "請檢查名稱欄位", type: "error" })
      return
    }
    setErrors({})
    setPending(true)
    try {
      const result = await mutation("正在更新名稱…", "帳號名稱已更新", () =>
        api<{ user: User }>("/auth/profile", {
          method: "PATCH",
          body: JSON.stringify(parsed.data),
        })
      )
      setUser(result.user)
      setName(result.user.name)
    } catch (err) {
      setErrors(
        err instanceof ApiError && err.fields
          ? err.fields
          : { form: [err instanceof Error ? err.message : "更新失敗"] }
      )
    } finally {
      setPending(false)
    }
  }
  return (
    <form onSubmit={submit} noValidate aria-busy={pending} className="max-w-lg">
      <FieldGroup>
        <FormField
          id="account-name"
          label="名稱"
          required
          error={errors.name}
          hint="最多 80 個字元。"
        >
          <Input
            id="account-name"
            name="name"
            autoComplete="name"
            required
            value={name}
            disabled={pending}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby="account-name-error"
          />
        </FormField>
        <FieldError errors={errors.form?.map((message) => ({ message }))} />
        <Button type="submit" disabled={pending}>
          <Save />
          {pending ? "正在儲存…" : "儲存名稱"}
        </Button>
      </FieldGroup>
    </form>
  )
}
