"use client"
import { Progress } from "@/components/ui/progress"
import { useDialogState } from "@/hooks/use-dialog-state"
import { useCallback, useEffect, useState } from "react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCheck,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Wallet,
  Search,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DetailSheet } from "@/components/detail-sheet"
import { ListPagination } from "@/components/list-pagination"
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet"
import { AppSelect } from "@/components/app-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@/components/ui/empty"
import { toast } from "@/components/ui/toast"
import { AppShell } from "@/components/app-shell"
import { useAuth } from "@/components/auth-provider"
import { RecordDialog, type Editor } from "@/components/record-dialog"
import { DeleteDialog } from "@/components/delete-dialog"
import { api } from "@/lib/api"
import {
  money,
  paymentLabels,
  type Debt,
  type Borrowing,
  type Payment,
  type Repayment,
} from "@/lib/types"
import { ContentSkeleton } from "@/components/page-skeleton"

function PaymentText({ payment }: { payment: Payment }) {
  return (
    <span className="break-all">
      {paymentLabels[payment.method]}
      {payment.method === "bank" && (
        <span className="mt-1 block font-mono text-xs text-muted-foreground">
          {payment.bankCode} · {payment.bankAccount}
        </span>
      )}
    </span>
  )
}
export function DebtDashboard() {
  return (
    <AppShell>
      <DebtContent />
    </AppShell>
  )
}
function DebtContent() {
  const { user } = useAuth()
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [borrowingPage, setBorrowingPage] = useState(1)
  const [borrowingPageSize, setBorrowingPageSize] = useState(10)
  const [repaymentPage, setRepaymentPage] = useState(1)
  const [repaymentPageSize, setRepaymentPageSize] = useState(10)
  const [filter, setFilter] = useState("all")
  const [editor, setEditor, editorKey] = useDialogState<Editor>()
  const [deletion, setDeletion, deletionKey] = useDialogState<{
    debt: Debt
    repayment?: Repayment
    borrowing?: Borrowing
  }>()
  const [selectedSnapshot, setSelectedSnapshot] = useState<Debt | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const load = useCallback((signal?: AbortSignal) => {
    const id = toast.add({
      title: "正在載入債務…",
      type: "loading",
      timeout: 0,
    })
    return api<{ debts: Debt[] }>("/debts", { signal })
      .then((result) => {
        setDebts(result.debts)
        setError("")
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
  }, [])
  useEffect(() => {
    if (!user) return
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [user, load])
  function saved(debt: Debt) {
    setDebts((items) =>
      [debt, ...items.filter((item) => item.id !== debt.id)].sort(
        (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
      )
    )
  }
  const borrowed = debts.reduce((sum, debt) => sum + BigInt(debt.amount), 0n)
  const paid = debts.reduce((sum, debt) => sum + BigInt(debt.paid), 0n)
  const percent = borrowed ? Number((paid * 100n) / borrowed) : 0
  const settled = debts.filter((debt) => debt.remaining === 0).length
  const visible = debts.filter(
    (debt) =>
      (filter === "all" ||
        (filter === "active" ? debt.remaining > 0 : debt.remaining === 0)) &&
      `${debt.lender} ${debt.note}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase())
  )
  const selected =
    debts.find((debt) => debt.id === selectedId) ||
    (selectedId ? selectedSnapshot : null)
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(visible.length / pageSize))
  )
  const pageDebts = visible.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  const currentRepaymentPage = Math.min(
    repaymentPage,
    Math.max(
      1,
      Math.ceil((selected?.repayments.length ?? 0) / repaymentPageSize)
    )
  )
  const borrowingRecords = selected
    ? [
        {
          id: selected.id,
          date: selected.date,
          amount: selected.initialAmount ?? selected.amount,
          note: selected.note,
          createdAt: selected.createdAt,
          updatedAt: selected.updatedAt,
          initial: true,
        },
        ...(selected.borrowings || []).map((item) => ({
          ...item,
          initial: false,
        })),
      ].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    : []
  const currentBorrowingPage = Math.min(
    borrowingPage,
    Math.max(1, Math.ceil(borrowingRecords.length / borrowingPageSize))
  )
  function openDetail(id: string) {
    setSelectedSnapshot(debts.find((debt) => debt.id === id) || null)
    setSelectedId(id)
    setRepaymentPage(1)
    setBorrowingPage(1)
  }
  function changePage(next: number) {
    setPage(next)
    document.getElementById("debts-heading")?.scrollIntoView({ block: "start" })
  }
  const dialogs = (
    <>
      {editor && (
        <RecordDialog
          key={editorKey}
          nested={!!selected}
          editor={editor}
          onClose={() => setEditor(null)}
          onSaved={saved}
        />
      )}
      {deletion && (
        <DeleteDialog
          key={deletionKey}
          nested={!!selected}
          {...deletion}
          onClose={() => setDeletion(null)}
          onDeleted={(debt) => {
            if (debt) saved(debt)
            else {
              setDebts((items) =>
                items.filter((item) => item.id !== deletion.debt.id)
              )
              if (selectedId === deletion.debt.id)
                setSelectedSnapshot(deletion.debt)
            }
          }}
        />
      )}
    </>
  )
  if (loading) return <ContentSkeleton variant="dashboard" />
  if (error)
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>無法載入債務</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => void load()}>重新載入</Button>
        </EmptyContent>
      </Empty>
    )
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">債務總覽</h1>
          <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
            把每一筆借還，整理成看得見的進度。
          </p>
        </div>
        <Button size="lg" onClick={() => setEditor({ kind: "debt" })}>
          <Plus />
          新增債務
        </Button>
      </div>
      <section aria-label="完整債務統計" className="mb-5 border-y py-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { label: "剩餘債務", value: borrowed - paid, icon: Wallet },
            { label: "累計借款", value: borrowed, icon: ArrowDownLeft },
            { label: "累計還款", value: paid, icon: ArrowUpRight },
          ].map(({ label, value, icon: Icon }, index) => (
            <div
              key={label}
              className={
                index
                  ? "min-w-0 sm:border-l sm:pl-4"
                  : "col-span-2 min-w-0 sm:col-span-1"
              }
            >
              <p className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className="size-4" />
                {label}
              </p>
              <p
                className={`font-mono text-xl font-medium tracking-tight break-all sm:text-2xl ${index === 0 ? "text-primary" : ""}`}
              >
                {money(value)}
              </p>
            </div>
          ))}
        </div>
        <Progress value={percent} aria-label="整體還款進度" className="mt-4">
          <div className="flex w-full items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CheckCheck className="size-4" />
              已結清 {settled} / {debts.length} 筆
            </span>
            <span>整體已還 {percent}%</span>
          </div>
        </Progress>
      </section>
      <section aria-labelledby="debts-heading">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 id="debts-heading" className="scroll-mt-24 text-lg font-semibold">
            我的債務{" "}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              {visible.length} 筆
            </span>
          </h2>
          <Button variant="ghost" onClick={() => void load()}>
            <RefreshCw />
            重新整理
          </Button>
        </div>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <InputGroup className="flex-1">
            <InputGroupInput
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder="搜尋對方名稱或備註"
              aria-label="搜尋債務"
            />
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
          </InputGroup>
          <AppSelect
            label="債務狀態"
            value={filter}
            onValueChange={(value) => {
              setFilter(value)
              setPage(1)
            }}
            options={[
              { value: "all", label: "全部債務" },
              { value: "active", label: "未結清" },
              { value: "settled", label: "已結清" },
            ]}
          />
        </div>
        {!visible.length ? (
          <Empty className="border border-dashed py-14">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Wallet />
              </EmptyMedia>
              <EmptyTitle>
                {debts.length ? "找不到符合的紀錄" : "從第一筆債務開始"}
              </EmptyTitle>
              <EmptyDescription>
                {debts.length
                  ? "試試其他關鍵字，或清除篩選條件。"
                  : "記下借款，之後每次還款都能追蹤進度。"}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                onClick={
                  debts.length
                    ? () => {
                        setQuery("")
                        setFilter("all")
                      }
                    : () => setEditor({ kind: "debt" })
                }
              >
                {debts.length ? "清除篩選" : "新增第一筆債務"}
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>借款日期 / 對方</TableHead>
                    <TableHead>約定還款</TableHead>
                    <TableHead className="text-right">借款金額</TableHead>
                    <TableHead className="text-right">已還金額</TableHead>
                    <TableHead className="text-right">剩餘金額</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageDebts.map((debt) => (
                    <TableRow
                      key={debt.id}
                      data-state={
                        selectedId === debt.id ? "selected" : undefined
                      }
                    >
                      <TableCell>
                        <span className="block max-w-40 truncate font-medium">
                          {debt.lender}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {debt.date}
                        </span>
                      </TableCell>
                      <TableCell>
                        {paymentLabels[debt.payment.method]}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {money(debt.amount)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {money(debt.paid)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {money(debt.remaining)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={debt.remaining ? "outline" : "secondary"}
                        >
                          {debt.remaining ? "未結清" : "已結清"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          onClick={() => openDetail(debt.id)}
                          aria-haspopup="dialog"
                        >
                          明細 <ChevronRight />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="divide-y border-y lg:hidden">
              {pageDebts.map((debt) => (
                <article key={debt.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-medium">{debt.lender}</h3>
                      <Badge variant={debt.remaining ? "outline" : "secondary"}>
                        {debt.remaining ? "未結清" : "已結清"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {debt.date} · {paymentLabels[debt.payment.method]}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      剩餘{" "}
                      <span className="font-mono font-medium break-all text-foreground">
                        {money(debt.remaining)}
                      </span>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => openDetail(debt.id)}
                    aria-haspopup="dialog"
                  >
                    還款明細 <ChevronRight />
                  </Button>
                </article>
              ))}
            </div>
            <ListPagination
              label="債務"
              total={visible.length}
              page={currentPage}
              pageSize={pageSize}
              onPageChange={changePage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setPage(1)
              }}
            />
          </>
        )}
      </section>
      {selected ? (
        <DetailSheet
          onClose={() => {
            setSelectedId(null)
            setSelectedSnapshot(null)
          }}
          busy={!!editor || !!deletion}
          removed={!debts.some((debt) => debt.id === selectedId)}
        >
          <SheetContent
            showCloseButton={false}
            className="data-[side=right]:w-full data-[side=right]:sm:max-w-2xl"
          >
            <SheetHeader className="shrink-0 border-b">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <SheetTitle className="break-words">
                    跟 {selected.lender} 借的債務
                  </SheetTitle>
                  <SheetDescription>
                    {selected.date} 借款 ·{" "}
                    {selected.remaining ? "未結清" : "已結清"}
                  </SheetDescription>
                </div>
                <SheetClose
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="關閉債務明細"
                    />
                  }
                >
                  <X />
                </SheetClose>
              </div>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              <dl className="mb-5 grid grid-cols-3 gap-3 border-b pb-4 text-xs">
                {[
                  { label: "借款金額", value: selected.amount },
                  { label: "已還金額", value: selected.paid },
                  { label: "剩餘金額", value: selected.remaining },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="mt-1 font-mono text-base font-medium break-all">
                      {money(value)}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-sm">
                  <p className="mb-2 text-xs text-muted-foreground">
                    約定還款方式
                  </p>
                  <PaymentText payment={selected.payment} />
                </div>
                <div className="text-sm">
                  <p className="mb-2 text-xs text-muted-foreground">備註</p>
                  <p className="break-words whitespace-pre-wrap">
                    {selected.note || "未填寫備註"}
                  </p>
                </div>
              </div>
              <div className="my-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <Button
                  size="default"
                  onClick={() =>
                    setEditor({ kind: "borrowing", debt: selected })
                  }
                >
                  <ArrowDownLeft />
                  新增借款
                </Button>
                <Button
                  size="default"
                  disabled={selected.remaining === 0}
                  onClick={() =>
                    setEditor({ kind: "repayment", debt: selected })
                  }
                >
                  <ArrowUpRight />
                  {selected.remaining === 0 ? "已全部還清" : "新增還款"}
                </Button>
                <Button
                  size="default"
                  variant="outline"
                  onClick={() => setEditor({ kind: "debt", debt: selected })}
                >
                  <Pencil />
                  編輯債務
                </Button>
                <Button
                  size="default"
                  variant="destructive"
                  onClick={() => setDeletion({ debt: selected })}
                >
                  <Trash2 />
                  刪除債務
                </Button>
              </div>
              <Tabs defaultValue="repayments">
                <TabsList aria-label="借還紀錄">
                  <TabsTrigger value="repayments">還款紀錄</TabsTrigger>
                  <TabsTrigger value="borrowings">借款紀錄</TabsTrigger>
                </TabsList>
                <TabsContent value="repayments">
                  <div className="mb-3 flex flex-wrap justify-between gap-2 text-sm">
                    <h3 className="font-medium">
                      還款紀錄 · {selected.repayments.length} 筆
                    </h3>
                    <span className="text-muted-foreground">
                      剩餘{" "}
                      <span className="font-mono text-foreground">
                        {money(selected.remaining)}
                      </span>
                    </span>
                  </div>
                  {!selected.repayments.length ? (
                    <Empty className="border border-dashed">
                      <EmptyHeader>
                        <EmptyTitle>尚未有還款紀錄</EmptyTitle>
                        <EmptyDescription>
                          每完成一次還款，就在這裡記錄日期、金額與方式。
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <div className="divide-y border-y">
                      {[...selected.repayments]
                        .sort(
                          (a, b) =>
                            b.date.localeCompare(a.date) ||
                            b.id.localeCompare(a.id)
                        )
                        .slice(
                          (currentRepaymentPage - 1) * repaymentPageSize,
                          currentRepaymentPage * repaymentPageSize
                        )
                        .map((repayment) => (
                          <article
                            key={repayment.id}
                            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-3 sm:grid-cols-[100px_1fr_auto]"
                          >
                            <div className="col-span-2 flex min-w-0 items-center justify-between gap-3 sm:col-span-1 sm:block">
                              <p className="text-xs text-muted-foreground">
                                {repayment.date}
                              </p>
                              <p className="font-mono font-medium break-all sm:mt-1">
                                {money(repayment.amount)}
                              </p>
                            </div>
                            <div className="min-w-0 text-sm">
                              <PaymentText payment={repayment.payment} />
                              {repayment.note && (
                                <p className="mt-2 text-xs break-words whitespace-pre-wrap text-muted-foreground">
                                  {repayment.note}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                aria-label={`編輯 ${repayment.date} 的還款`}
                                onClick={() =>
                                  setEditor({
                                    kind: "repayment",
                                    debt: selected,
                                    repayment,
                                  })
                                }
                              >
                                <Pencil />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                aria-label={`刪除 ${repayment.date} 的還款`}
                                onClick={() =>
                                  setDeletion({ debt: selected, repayment })
                                }
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          </article>
                        ))}
                    </div>
                  )}
                  {selected.repayments.length > 0 && (
                    <ListPagination
                      label="還款"
                      total={selected.repayments.length}
                      page={currentRepaymentPage}
                      pageSize={repaymentPageSize}
                      onPageChange={setRepaymentPage}
                      onPageSizeChange={(size) => {
                        setRepaymentPageSize(size)
                        setRepaymentPage(1)
                      }}
                    />
                  )}
                </TabsContent>
                <TabsContent value="borrowings">
                  <h3 className="mb-3 font-medium">
                    借款紀錄 · {borrowingRecords.length} 筆
                  </h3>
                  <div className="divide-y border-y">
                    {borrowingRecords
                      .slice(
                        (currentBorrowingPage - 1) * borrowingPageSize,
                        currentBorrowingPage * borrowingPageSize
                      )
                      .map((borrowing) => (
                        <article key={borrowing.id} className="space-y-2 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {borrowing.date} ·{" "}
                                {borrowing.initial ? "首次借款" : "加借"}
                              </p>
                              <p className="font-mono font-medium break-all">
                                {money(borrowing.amount)}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                aria-label={`編輯 ${borrowing.date} 的借款`}
                                onClick={() =>
                                  setEditor(
                                    borrowing.initial
                                      ? { kind: "debt", debt: selected }
                                      : {
                                          kind: "borrowing",
                                          debt: selected,
                                          borrowing,
                                        }
                                  )
                                }
                              >
                                <Pencil />
                              </Button>
                              {!borrowing.initial && (
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  aria-label={`刪除 ${borrowing.date} 的借款`}
                                  onClick={() =>
                                    setDeletion({ debt: selected, borrowing })
                                  }
                                >
                                  <Trash2 />
                                </Button>
                              )}
                            </div>
                          </div>
                          {borrowing.note && (
                            <p className="text-xs break-words whitespace-pre-wrap text-muted-foreground">
                              {borrowing.note}
                            </p>
                          )}
                        </article>
                      ))}
                  </div>
                  <ListPagination
                    label="借款"
                    total={borrowingRecords.length}
                    page={currentBorrowingPage}
                    pageSize={borrowingPageSize}
                    onPageChange={setBorrowingPage}
                    onPageSizeChange={(size) => {
                      setBorrowingPageSize(size)
                      setBorrowingPage(1)
                    }}
                  />
                </TabsContent>
              </Tabs>
              <p className="mt-3 text-xs text-muted-foreground">
                最後更新：
                {new Date(selected.updatedAt).toLocaleString("zh-TW", {
                  timeZone: "Asia/Taipei",
                })}
              </p>
            </div>
            {dialogs}
          </SheetContent>
        </DetailSheet>
      ) : (
        dialogs
      )}
    </>
  )
}
