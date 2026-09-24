import type { Metadata } from "next"
import { Geist, Geist_Mono, Noto_Sans_TC } from "next/font/google"
import NextTopLoader from "nextjs-toploader"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toast"
import { AuthProvider } from "@/components/auth-provider"
import { PwaRegistration } from "@/components/pwa-registration"
import { cn } from "@/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

const fontChinese = Noto_Sans_TC({
  subsets: ["latin"],
  variable: "--font-noto-sans-tc",
  display: "swap",
  preload: false,
})

export const metadata: Metadata = {
  title: "債務統計",
  description: "管理債務與還款紀錄，掌握借款、已還金額與剩餘債務。",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "債務手帳" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-Hant"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable,
        fontChinese.variable
      )}
    >
      <body>
        <ThemeProvider>
          <AuthProvider>
            <NextTopLoader color="var(--primary)" showSpinner={false} />
            {children}
            <Toaster />
            <PwaRegistration />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
