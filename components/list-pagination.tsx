"use client"

import { AppSelect } from "@/components/app-select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export function ListPagination({
  label,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  label: string
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const numbers = [...new Set([1, page, pages])].sort((a, b) => a - b)
  const items: (number | string)[] = []
  numbers.forEach((number, index) => {
    const previous = numbers[index - 1]
    if (previous && number - previous === 2) items.push(previous + 1)
    else if (previous && number - previous > 2) items.push(`gap-${number}`)
    items.push(number)
  })
  const go = (next: number) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    if (next >= 1 && next <= pages && next !== page) onPageChange(next)
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span aria-live="polite">
          {total ? (page - 1) * pageSize + 1 : 0}–
          {Math.min(page * pageSize, total)} / {total} 筆
        </span>
        <AppSelect
          label={`${label}每頁筆數`}
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
          options={[10, 20, 50, 100].map((size) => ({
            value: String(size),
            label: `每頁 ${size} 筆`,
          }))}
        />
      </div>
      <Pagination aria-label={`${label}分頁`} className="mr-0 ml-auto w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              text="上一頁"
              aria-label="上一頁"
              aria-disabled={page === 1}
              tabIndex={page === 1 ? -1 : undefined}
              className={
                page === 1 ? "pointer-events-none opacity-50" : undefined
              }
              onClick={go(page - 1)}
            />
          </PaginationItem>
          {items.map((item) => (
            <PaginationItem key={item}>
              {typeof item === "string" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  href="#"
                  aria-label={`第 ${item} 頁`}
                  isActive={item === page}
                  onClick={go(item)}
                >
                  {item}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              href="#"
              text="下一頁"
              aria-label="下一頁"
              aria-disabled={page === pages}
              tabIndex={page === pages ? -1 : undefined}
              className={
                page === pages ? "pointer-events-none opacity-50" : undefined
              }
              onClick={go(page + 1)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
