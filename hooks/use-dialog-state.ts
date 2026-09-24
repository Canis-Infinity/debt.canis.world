"use client"

import { useCallback, useState } from "react"

// A new request gets a fresh instance, even while the previous dialog is exiting.
export function useDialogState<T>() {
  const [state, setState] = useState<{ value: T | null; key: number }>({
    value: null,
    key: 0,
  })
  const setValue = useCallback((value: T | null) => {
    setState((previous) => ({ value, key: previous.key + 1 }))
  }, [])
  return [state.value, setValue, state.key] as const
}
