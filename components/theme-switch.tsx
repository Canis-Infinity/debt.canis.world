"use client"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { AppSelect } from "@/components/app-select"
const subscribe = () => () => {}
const themeOptions = [
  { value: "system", label: "跟隨系統", icon: Monitor },
  { value: "light", label: "淺色模式", icon: Sun },
  { value: "dark", label: "深色模式", icon: Moon },
]
export function ThemeSwitch() {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
  return (
    <AppSelect
      label="色彩主題"
      value={mounted ? theme || "system" : "system"}
      onValueChange={setTheme}
      options={themeOptions}
    />
  )
}
