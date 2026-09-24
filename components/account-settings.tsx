import { AppShell } from "@/components/app-shell"
export function AccountSettings({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">帳號設定</h1>
      {children}
    </AppShell>
  )
}
