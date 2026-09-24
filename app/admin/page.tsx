import { AppShell } from "@/components/app-shell"
import { AdminContent } from "@/components/admin-page"
export default function Page() {
  return (
    <AppShell admin>
      <AdminContent />
    </AppShell>
  )
}
