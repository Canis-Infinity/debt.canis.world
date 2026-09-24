"use client"
import { useCallback, useState } from "react"
// Keep the official overlay in the popup's portal, before the popup in paint order.
// A second Base UI Portal would register a second internal backdrop for the same root.
export function useNestedBackdrop(nested: boolean) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const ref = useCallback(
    (popup: HTMLDivElement | null) => {
      if (!nested || !popup) return
      const host = document.createElement("div")
      popup.before(host)
      setContainer(host)
      return () => {
        host.remove()
      }
    },
    [nested]
  )
  return { container, ref }
}
