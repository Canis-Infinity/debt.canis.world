"use client"

import { useAuth } from "@/components/auth-provider"
import { FormField } from "@/components/form-field"
import { PageBreadcrumb } from "@/components/page-breadcrumb"
import { PageSkeleton } from "@/components/page-skeleton"
import { PasswordInput } from "@/components/password-input"
import { SiteFooter } from "@/components/site-footer"
import { ThemeSwitch } from "@/components/theme-switch"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import { ApiError } from "@/lib/api"
import { mutation } from "@/lib/notifications"
import {
  loginSchema,
  registerSchema,
  zodFields,
  type FieldErrors,
} from "@/lib/validation"
import { login, register as registerAccount } from "@/services/auth"
import { UserCheck, Wallet } from "lucide-react"
import Link from "next/link"
import { useRouter } from "nextjs-toploader/app"
import { useEffect, useState } from "react"

export function AuthForm({ register = false }: { register?: boolean }) {
  const { user, loading, setUser } = useAuth()
  const router = useRouter()
  const [errors, setErrors] = useState<FieldErrors>({})
  const [pending, setPending] = useState(false)
  const [remember, setRemember] = useState(false)
  const [savedEmail, setSavedEmail] = useState("")
  useEffect(() => {
    if (register) return
    const frame = requestAnimationFrame(() => {
      try {
        const email = localStorage.getItem("debt.remembered-email") || ""
        setSavedEmail(email)
        setRemember(!!email)
      } catch {
        /* Storage may be unavailable. Login still works. */
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [register])
  const [submitted, setSubmitted] = useState(false)
  useEffect(() => {
    if (user) router.replace("/")
  }, [user, router])
  if (loading || user)
    return <PageSkeleton variant={register ? "register" : "login"} />
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const raw = Object.fromEntries(new FormData(event.currentTarget))
    const parsed = (register ? registerSchema : loginSchema).safeParse(raw)
    if (!parsed.success) {
      setErrors(zodFields(parsed.error))
      toast.add({ title: "請檢查表單欄位", type: "error" })
      return
    }
    setErrors({})
    setPending(true)
    try {
      if (register) {
        const input = registerSchema.parse(raw)
        await mutation("正在送出申請…", "申請已送出，等待管理員核准", () =>
          registerAccount(input)
        )
        setSubmitted(true)
      } else {
        const result = await mutation("正在登入…", "登入成功", () =>
          login(parsed.data)
        )
        try {
          if (remember)
            localStorage.setItem("debt.remembered-email", parsed.data.email)
          else localStorage.removeItem("debt.remembered-email")
        } catch {
          toast.add({ title: "已登入，但瀏覽器無法記住帳號", type: "error" })
        }
        setUser(result.user)
        router.replace("/")
      }
    } catch (err) {
      setErrors(
        err instanceof ApiError && err.fields
          ? err.fields
          : { form: [err instanceof Error ? err.message : "操作失敗"] }
      )
    } finally {
      setPending(false)
    }
  }
  const fields = [
    ...(register
      ? [{ name: "name", label: "名稱", type: "text", autoComplete: "name" }]
      : []),
    { name: "email", label: "電子郵件", type: "email", autoComplete: "email" },
    {
      name: "password",
      label: "密碼",
      type: "password",
      autoComplete: register ? "new-password" : "current-password",
    },
    ...(register
      ? [
          {
            name: "confirmPassword",
            label: "再次輸入密碼",
            type: "password",
            autoComplete: "new-password",
          },
        ]
      : []),
  ]
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Wallet className="size-5 text-primary" />
            債務手帳
          </Link>
          <ThemeSwitch />
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-x-12 gap-y-6 px-5 py-8 sm:py-10 lg:grid-cols-2 lg:gap-x-24 lg:gap-y-8 lg:py-12">
        <div className="lg:col-span-2">
          <PageBreadcrumb />
        </div>
        <section className="space-y-6">
          <p className="text-xs font-medium tracking-[0.2em] text-primary">
            YOUR DEBT, IN PERSPECTIVE
          </p>
          <h1 className="text-3xl leading-snug font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            清楚記錄，
            <br />
            一步一步還清。
          </h1>
          <p className="max-w-sm text-sm leading-7 text-muted-foreground">
            借了多少、還了多少、還剩多少。把每一筆債務與還款放在一起，讓自己的進度一目了然。
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 border-t pt-6 text-xs text-muted-foreground">
            <span>獨立個人帳本</span>
            <span>新臺幣整數記帳</span>
            <span>手機隨時記錄</span>
          </div>
        </section>
        <section className="w-full max-w-md lg:justify-self-end">
          {submitted ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UserCheck />
                </EmptyMedia>
                <EmptyTitle>申請已送出</EmptyTitle>
                <EmptyDescription>
                  管理員核准後，即可使用電子郵件與密碼登入。此帳號獨立於其他
                  Canis 網站。
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button render={<Link href="/login" />}>前往登入</Button>
              </EmptyContent>
            </Empty>
          ) : (
            <>
              <h2 className="text-xl font-semibold">
                {register ? "建立你的帳本" : "歡迎回來"}
              </h2>
              <p className="mt-2 mb-7 text-sm text-muted-foreground">
                {register
                  ? "公開註冊，經管理員核准後啟用。"
                  : "登入查看你的債務與還款進度。"}
              </p>
              <form onSubmit={submit} noValidate aria-busy={pending}>
                <FieldGroup>
                  {fields.map((field) => (
                    <FormField
                      key={field.name}
                      id={field.name}
                      label={field.label}
                      required
                      error={errors[field.name]}
                      hint={
                        register && field.name === "password"
                          ? "至少 12 個字元，最多 72 bytes。"
                          : undefined
                      }
                    >
                      {field.type === "password" ? (
                        <PasswordInput
                          id={field.name}
                          name={field.name}
                          autoComplete={field.autoComplete}
                          required
                          disabled={pending}
                          aria-invalid={!!errors[field.name]}
                          aria-describedby={`${field.name}-error`}
                        />
                      ) : (
                        <Input
                          id={field.name}
                          name={field.name}
                          type={field.type}
                          {...(!register && field.name === "email"
                            ? {
                                value: savedEmail,
                                onChange: (
                                  event: React.ChangeEvent<HTMLInputElement>
                                ) => setSavedEmail(event.target.value),
                              }
                            : {})}
                          autoComplete={field.autoComplete}
                          required
                          disabled={pending}
                          aria-invalid={!!errors[field.name]}
                          aria-describedby={`${field.name}-error`}
                        />
                      )}
                    </FormField>
                  ))}
                  {!register && (
                    <Field orientation="horizontal">
                      <Checkbox
                        id="remember"
                        checked={remember}
                        disabled={pending}
                        onCheckedChange={(checked) => {
                          setRemember(checked)
                          if (!checked) {
                            try {
                              localStorage.removeItem("debt.remembered-email")
                            } catch {
                              /* Optional storage. */
                            }
                          }
                        }}
                      />
                      <FieldLabel htmlFor="remember">記住帳號</FieldLabel>
                    </Field>
                  )}
                  <FieldError
                    errors={errors.form?.map((message) => ({ message }))}
                  />
                  <Button type="submit" size="lg" disabled={pending}>
                    {pending ? "處理中…" : register ? "送出註冊申請" : "登入"}
                  </Button>
                </FieldGroup>
              </form>
              <p className="mt-6 text-sm text-muted-foreground">
                {register ? "已經有帳號？" : "還沒有帳號？"}{" "}
                <Link
                  className="text-primary underline underline-offset-4"
                  href={register ? "/login" : "/register"}
                >
                  {register ? "登入" : "申請註冊"}
                </Link>
              </p>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
