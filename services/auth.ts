import { api } from "@/lib/api"
import type { User } from "@/lib/types"

export const currentUser = (signal?: AbortSignal) =>
  api<{ user: User }>("/auth/me", { signal })
export const login = (input: { email: string; password: string }) =>
  api<{ user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  })
export const register = (input: {
  name: string
  email: string
  password: string
}) =>
  api<{ message: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      password: input.password,
    }),
  })
export const logout = () =>
  api<{ message: string }>("/auth/logout", { method: "POST", body: "{}" })
export const updateProfile = (input: { name: string }) =>
  api<{ user: User }>("/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  })
export const changePassword = (input: {
  currentPassword: string
  newPassword: string
}) =>
  api<{ message: string }>("/auth/password", {
    method: "POST",
    body: JSON.stringify(input),
  })
