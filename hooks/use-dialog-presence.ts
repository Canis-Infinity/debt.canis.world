"use client"

import { useEffect, useRef, useState } from "react"

// Let Base UI finish its native enter/exit animation before releasing dialog data.
export function useDialogPresence(onExited: () => void, closing = false) {
  const [open, setOpen] = useState(false)
  const entered = useRef(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      entered.current = true
      setOpen(!closing)
    })
    return () => cancelAnimationFrame(frame)
  }, [closing])
  return {
    open,
    close: () => setOpen(false),
    onOpenChangeComplete: (value: boolean) => {
      if (!value && entered.current) onExited()
    },
  }
}
