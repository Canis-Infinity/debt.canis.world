"use client"

import { AppSelect } from "@/components/app-select"
import { ContentSkeleton } from "@/components/page-skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { FieldError } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Toggle } from "@/components/ui/toggle"
import { statusLabels } from "@/configs/labels"
import { useDialogState } from "@/hooks/use-dialog-state"
import { useResource } from "@/hooks/use-resource"
import { mutation } from "@/lib/notifications"
import { type User } from "@/lib/types"
import { accountStatusSchema } from "@/lib/validation"
import { listUsers, reviewUser } from "@/services/admin"
import {
  LockKeyhole,
  LockKeyholeOpen,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  UserX,
} from "lucide-react"
import { useState } from "react"

type Action = { user: User; status: "approved" | "rejected" | "suspended" }
export function AdminContent() {
  const {
    data: users,
    setData: setUsers,
    loading,
    error,
    load,
  } = useResource(listUsers, [], "正在載入帳號…")
  const [filter, setFilter] = useState("pending")
  const [query, setQuery] = useState("")
  const [actionOpen, setActionOpen] = useState(false)
  const [action, setAction, actionKey] = useDialogState<Action>()
  const [pending, setPending] = useState(false)
  const [actionError, setActionError] = useState("")
  async function confirm() {
    if (!action || pending) return
    setPending(true)
    setActionError("")
    try {
      const input = accountStatusSchema.parse({
        status: action.status,
        version: action.user.version,
      })
      const result = await mutation("正在更新帳號…", "帳號狀態已更新", () =>
        reviewUser(action.user.id, input)
      )
      setUsers((items) =>
        items.map((user) => (user.id === result.user.id ? result.user : user))
      )
      setActionOpen(false)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "操作失敗")
    } finally {
      setPending(false)
    }
  }
  function openAction(user: User, status: Action["status"]) {
    setActionError("")
    setAction({ user, status })
    setActionOpen(true)
  }
  const visible = users.filter(
    (user) =>
      (filter === "all" || user.status === filter) &&
      `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase())
  )
  if (loading) return <ContentSkeleton variant="users" />
  if (error)
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>無法載入帳號</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => void load()}>重新載入</Button>
        </EmptyContent>
      </Empty>
    )
  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <ShieldCheck className="size-7 text-primary" />
            使用者管理
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            審核註冊申請，管理帳號使用權限。
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()}>
          <RefreshCw />
          重新整理
        </Button>
      </div>
      <div className="mb-5 grid grid-cols-4 gap-2 divide-x border-y py-4">
        {Object.entries(statusLabels).map(([status, label]) => (
          <div key={status} className="px-2 first:pl-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 font-mono text-2xl">
              {users.filter((user) => user.status === status).length}
            </p>
          </div>
        ))}
      </div>
      <div className="mb-4 flex items-center gap-2">
        <InputGroup className="min-w-0 flex-1">
          <InputGroupInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="搜尋帳號"
            placeholder="搜尋名稱或電子郵件"
          />
          <InputGroupAddon>
            <Search aria-hidden="true" />
          </InputGroupAddon>
        </InputGroup>
        <AppSelect
          label="帳號狀態"
          value={filter}
          onValueChange={setFilter}
          options={[
            { value: "all", label: "全部帳號" },
            ...Object.entries(statusLabels).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
      </div>
      {!visible.length ? (
        <Empty className="border border-dashed py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>目前沒有符合的帳號</EmptyTitle>
            <EmptyDescription>
              {filter === "pending"
                ? "新的註冊申請會出現在這裡。"
                : "試試其他關鍵字或狀態。"}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="divide-y border-y">
          {visible.map((user) => (
            <article
              key={user.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium break-words">{user.name}</h2>
                  <Badge
                    variant={user.status === "pending" ? "default" : "outline"}
                  >
                    {statusLabels[user.status]}
                  </Badge>
                  {user.role === "admin" && (
                    <Badge variant="secondary">管理員</Badge>
                  )}
                </div>
                <p className="mt-1 text-sm break-all text-muted-foreground">
                  {user.email}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  註冊於{" "}
                  {new Date(user.createdAt).toLocaleString("zh-TW", {
                    timeZone: "Asia/Taipei",
                  })}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
                {user.role === "admin" ? (
                  <span className="max-w-20 text-xs text-muted-foreground sm:max-w-none">
                    管理員帳號由伺服器管理
                  </span>
                ) : (
                  <>
                    {user.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => openAction(user, "approved")}
                      >
                        <UserCheck />
                        核准
                      </Button>
                    )}
                    {user.status === "pending" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openAction(user, "rejected")}
                      >
                        <UserX />
                        不核准
                      </Button>
                    )}
                    {user.status !== "pending" && (
                      <Toggle
                        variant="outline"
                        size="sm"
                        pressed={user.status === "approved"}
                        aria-label="啟用帳號"
                        disabled={pending}
                        onPressedChange={(enabled) =>
                          openAction(user, enabled ? "approved" : "suspended")
                        }
                      >
                        {user.status === "approved" ? (
                          <LockKeyholeOpen />
                        ) : (
                          <LockKeyhole />
                        )}
                        {user.status === "approved" ? "已啟用" : "已停用"}
                      </Toggle>
                    )}
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      {action && (
        <Dialog
          key={actionKey}
          open={actionOpen}
          onOpenChangeComplete={(open) => {
            if (!open) setAction(null)
          }}
          onOpenChange={(open) => {
            if (!open && !pending) setActionOpen(false)
          }}
        >
          <DialogContent showCloseButton={!pending}>
            <DialogHeader>
              <DialogTitle>
                {action.status === "approved"
                  ? "核准／啟用帳號？"
                  : action.status === "rejected"
                    ? "不核准這筆申請？"
                    : "停用帳號？"}
              </DialogTitle>
              <DialogDescription>
                <span className="break-all">
                  {action.user.name}（{action.user.email}）
                </span>
                <br />
                {action.status === "approved"
                  ? "此帳號將可登入並管理自己的債務。"
                  : "此帳號將無法登入，既有債務資料會保留。"}
              </DialogDescription>
            </DialogHeader>
            <FieldError>{actionError}</FieldError>
            <DialogFooter>
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => setActionOpen(false)}
              >
                取消
              </Button>
              <Button
                variant={
                  action.status === "approved" ? "default" : "destructive"
                }
                disabled={pending}
                onClick={confirm}
              >
                {pending ? "處理中…" : "確認變更"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
