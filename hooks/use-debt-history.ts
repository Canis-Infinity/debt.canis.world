"use client"

import { DEFAULT_PAGE_SIZE } from "@/configs/pagination"
import type { Debt } from "@/lib/types"
import { useState } from "react"

export function useDebtHistory(selected: Debt | null) {
  const [borrowingPage, setBorrowingPage] = useState(1)
  const [borrowingPageSize, setBorrowingPageSize] =
    useState<number>(DEFAULT_PAGE_SIZE)
  const [repaymentPage, setRepaymentPage] = useState(1)
  const [repaymentPageSize, setRepaymentPageSize] =
    useState<number>(DEFAULT_PAGE_SIZE)
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
  return {
    borrowingPageSize,
    repaymentPageSize,
    currentRepaymentPage,
    currentBorrowingPage,
    borrowingRecords,
    setRepaymentPage,
    setRepaymentPageSize,
    setBorrowingPage,
    setBorrowingPageSize,
  }
}
