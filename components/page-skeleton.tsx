import { Skeleton } from "@/components/ui/skeleton"
import { SiteFooter } from "@/components/site-footer"
type Variant = "dashboard" | "users" | "settings" | "login" | "register"
function Lines() {
  return (
    <div className="min-w-0 space-y-2">
      <Skeleton className="h-4 w-28 max-w-full" />
      <Skeleton className="h-3 w-40 max-w-full" />
    </div>
  )
}
function FormSkeleton({ count }: { count: number }) {
  return (
    <div className="w-full max-w-lg space-y-6">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
      <Skeleton className="h-4 w-44" />
      <Skeleton className="h-9 w-full" />
    </div>
  )
}
export function ContentSkeleton({
  variant = "dashboard",
}: {
  variant?: Variant
}) {
  const auth = variant === "login" || variant === "register"
  return (
    <div
      role="status"
      aria-label="正在載入內容"
      aria-busy="true"
      className="space-y-5"
    >
      <span className="sr-only">正在載入，請稍候。</span>
      <div aria-hidden="true" className="space-y-5">
        {auth ? (
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="space-y-6">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-12 w-64 max-w-full" />
              <Skeleton className="h-12 w-48" />
              <Lines />
            </div>
            <div className="space-y-7">
              <Skeleton className="h-7 w-32" />
              <FormSkeleton count={variant === "register" ? 4 : 2} />
            </div>
          </div>
        ) : variant === "settings" ? (
          <>
            <Skeleton className="h-8 w-32" />

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <Skeleton className="h-6 w-24" />
                <FormSkeleton count={1} />
                <Lines />
                <Lines />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-4 w-64 max-w-full" />
                <FormSkeleton count={3} />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="hidden h-4 w-60 sm:block" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
            <div
              className={
                variant === "users"
                  ? "grid grid-cols-4 gap-3 border-y py-4"
                  : "grid grid-cols-2 gap-4 border-y py-4 sm:grid-cols-3"
              }
            >
              {Array.from({ length: variant === "users" ? 4 : 3 }, (_, i) => (
                <div
                  key={i}
                  className={
                    variant === "dashboard" && i === 0
                      ? "col-span-2 space-y-2 sm:col-span-1"
                      : "space-y-2"
                  }
                >
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-7 w-16 max-w-full" />
                </div>
              ))}
              {variant === "dashboard" && (
                <div className="col-span-full mt-2 space-y-3">
                  <div className="flex justify-between gap-3">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-1 w-full" />
                </div>
              )}
            </div>
            {variant === "dashboard" && (
              <div className="flex justify-between">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-7 w-20" />
              </div>
            )}
            <div className="flex gap-3">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 w-24" />
            </div>
            <div className="divide-y border-y">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <Lines />
                  {variant === "dashboard" && (
                    <>
                      <Skeleton className="hidden h-4 w-16 md:block" />
                      <Skeleton className="hidden h-4 w-20 md:block" />
                    </>
                  )}
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-32" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
export function PageSkeleton({ variant = "dashboard" }: { variant?: Variant }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div
          aria-hidden="true"
          className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-10"
        >
          <Skeleton className="size-8 md:hidden" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="ml-6 hidden h-8 w-44 md:block" />
          <Skeleton className="ml-auto h-8 w-24" />
          <Skeleton className="hidden h-8 w-16 md:block" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
        <Skeleton className="mb-5 h-4 w-44" />
        <ContentSkeleton variant={variant} />
      </main>
      <SiteFooter />
    </div>
  )
}
