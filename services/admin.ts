import { api } from "@/lib/api"
import type { User } from "@/lib/types"

export const listUsers = async (signal?: AbortSignal) =>
  (await api<{ users: User[] }>("/admin/users", { signal })).users
export const reviewUser = (
  id: string,
  input: { status: "approved" | "rejected" | "suspended"; version: number }
) =>
  api<{ user: User }>(`/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
