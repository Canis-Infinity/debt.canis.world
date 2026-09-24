"use client"

import { toast } from "@/components/ui/toast"
import { ApiError } from "@/lib/api"
import type { User } from "@/lib/types"
import { currentUser } from "@/services/auth"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

type AuthState = {
  user: User | null
  loading: boolean
  error: string
  setUser: (user: User | null) => void
  reload: () => void
}
const AuthContext = createContext<AuthState | null>(null)
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [revision, setRevision] = useState(0)
  const reload = useCallback(() => setRevision((value) => value + 1), [])
  useEffect(() => {
    const controller = new AbortController()
    currentUser(controller.signal)
      .then((data) => {
        setUser(data.user)
        setError("")
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        if (err instanceof ApiError && err.status === 401) {
          setUser(null)
          setError("")
          return
        }
        setError(err.message)
        toast.add({ title: err.message, type: "error" })
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [revision])
  useEffect(() => {
    const expire = () => setUser(null)
    window.addEventListener("debt-session-expired", expire)
    return () => window.removeEventListener("debt-session-expired", expire)
  }, [])
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        setUser: (nextUser) => {
          setUser(nextUser)
          setError("")
        },
        reload,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("AuthProvider is required")
  return context
}
