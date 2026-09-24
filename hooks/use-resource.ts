"use client"

import { toast } from "@/components/ui/toast"
import { useCallback, useEffect, useState } from "react"

export function useResource<T>(
  fetcher: (signal?: AbortSignal) => Promise<T>,
  initial: T,
  loadingTitle: string,
  enabled = true
) {
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const load = useCallback(
    (signal?: AbortSignal) => {
      const id = toast.add({ title: loadingTitle, type: "loading", timeout: 0 })
      return fetcher(signal)
        .then((result) => {
          if (!signal?.aborted) {
            setData(result)
            setError("")
          }
          toast.close(id)
        })
        .catch((err) => {
          if (!signal?.aborted) {
            const message = err instanceof Error ? err.message : "載入失敗"
            setError(message)
            toast.update(id, { title: message, type: "error", timeout: 7000 })
          } else toast.close(id)
        })
        .finally(() => {
          if (!signal?.aborted) setLoading(false)
        })
    },
    [fetcher, loadingTitle]
  )
  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [enabled, load])
  return { data, setData, loading, error, load }
}
