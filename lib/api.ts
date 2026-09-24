"use client"

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
