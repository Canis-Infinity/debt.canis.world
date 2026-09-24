"use client"

import { AppSelect } from "@/components/app-select"
import { AppShell } from "@/components/app-shell"
import { useAuth } from "@/components/auth-provider"
import { DebtDetails } from "@/components/debts/debt-details"
import { DebtList } from "@/components/debts/debt-list"
import { DebtSummary } from "@/components/debts/debt-summary"
import { DeleteDialog } from "@/components/delete-dialog"
import { DetailSheet } from "@/components/detail-sheet"
import { ListPagination } from "@/components/list-pagination"
import { ContentSkeleton } from "@/components/page-skeleton"
import { RecordDialog } from "@/components/record-dialog"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { DEFAULT_PAGE_SIZE } from "@/configs/pagination"
import { useDebtHistory } from "@/hooks/use-debt-history"
import { useDialogState } from "@/hooks/use-dialog-state"
import { useResource } from "@/hooks/use-resource"
import type { Deletion, Editor } from "@/lib/record-types"
import { type Debt } from "@/lib/types"
import { listDebts } from "@/services/debts"
import { Plus, RefreshCw, Search, Wallet } from "lucide-react"
import { useState } from "react"

export function DebtDashboard() {
  return (
    <AppShell>
      <DebtContent />
    </AppShell>
  )
}
function DebtContent() {
  const { user } = useAuth()
  const {
    data: debts,
    setData: setDebts,
    loading,
    error,
    load,
  } = useResource(listDebts, [], "正在載入債務…", !!user)
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE)
  const [filter, setFilter] = useState("all")
  const [editor, setEditor, editorKey] = useDialogState<Editor>()
  const [deletion, setDeletion, deletionKey] = useDialogState<Deletion>()
  const [selectedSnapshot, setSelectedSnapshot] = useState<Debt | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  function saved(debt: Debt) {
    setDebts((items) =>
      [debt, ...items.filter((item) => item.id !== debt.id)].sort(
        (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
      )
    )
  }
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
  const history = useDebtHistory(selected)
  function openDetail(id: string) {
    setSelectedSnapshot(debts.find((debt) => debt.id === id) || null)
    setSelectedId(id)
    history.setRepaymentPage(1)
    history.setBorrowingPage(1)
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
      <DebtSummary debts={debts} />
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
            <DebtList
              pageDebts={pageDebts}
              selectedId={selectedId}
              openDetail={openDetail}
            />
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
          <DebtDetails
            selected={selected}
            history={history}
            setEditor={setEditor}
            setDeletion={setDeletion}
            dialogs={dialogs}
          />
        </DetailSheet>
      ) : (
        dialogs
      )}
    </>
  )
}
