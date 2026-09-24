"use client"
import { useEffect } from "react"
import { toast } from "@/components/ui/toast"
export function PwaRegistration() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    )
      return
    navigator.serviceWorker.register("/sw.js").catch(() =>
      toast.add({
        title: "離線功能暫時無法啟用",
        description: "仍可在線上正常使用。",
        type: "error",
      })
    )
    const offline = () =>
      toast.add({
        title: "目前離線",
        description: "重新連線後才能讀取或儲存紀錄。",
        type: "warning",
      })
    const online = () => toast.add({ title: "網路已恢復", type: "success" })
    window.addEventListener("offline", offline)
    window.addEventListener("online", online)
    return () => {
      window.removeEventListener("offline", offline)
      window.removeEventListener("online", online)
    }
  }, [])
  return null
}
