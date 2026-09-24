"use client"

import { toast } from "@/components/ui/toast"
import type { FieldErrors } from "@/lib/validation"

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields?: FieldErrors
  ) {
    super(message)
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api/debt${path}`, {
      ...options,
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-Debt-Request": "1",
        ...options.headers,
      },
      signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(20000)])
        : AbortSignal.timeout(20000),
    })
  } catch (error) {
    if (options.signal?.aborted) throw error
    throw new ApiError("無法連線，請檢查網路後重試", 0)
  }
  const body = await response
    .json()
    .catch(() => ({ message: "服務回應異常，請稍後再試" }))
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/auth/"))
      window.dispatchEvent(new Event("debt-session-expired"))
    throw new ApiError(body.message || "操作失敗", response.status, body.fields)
  }
  return body as T
}
export async function mutation<T>(
  pending: string,
  success: string,
  action: () => Promise<T>
): Promise<T> {
  const id = toast.add({ title: pending, type: "loading", timeout: 0 })
  try {
    const result = await action()
    toast.update(id, { title: success, type: "success", timeout: 4000 })
    return result
  } catch (error) {
    toast.update(id, {
      title: error instanceof Error ? error.message : "操作失敗",
      type: "error",
      timeout: 7000,
    })
    throw error
  }
}
