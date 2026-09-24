"use client"

import { Sheet } from "@/components/ui/sheet"
import { useDialogPresence } from "@/hooks/use-dialog-presence"

export function DetailSheet({
  children,
  onClose,
  busy,
  removed,
}: {
  children: React.ReactNode
  onClose: () => void
  busy: boolean
  removed: boolean
}) {
  const presence = useDialogPresence(onClose, removed)
  return (
    <Sheet
      open={presence.open}
      onOpenChange={(open) => {
        if (!open && !busy) presence.close()
      }}
      onOpenChangeComplete={presence.onOpenChangeComplete}
    >
      {children}
    </Sheet>
  )
}
