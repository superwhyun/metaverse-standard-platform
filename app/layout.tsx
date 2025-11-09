import type React from "react"
import type { Metadata } from "next"
import { Source_Sans_3, Noto_Sans_KR, Noto_Serif_KR, Inter } from "next/font/google"
import "./globals.css"
import ClientSessionProvider from "@/components/providers/session-provider"
import { ThemeProvider } from "@/components/theme-provider"

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-sans",
  weight: ["400", "500", "600"],
})

// Heading font (Latin): Inter — clean, modern
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
})

// Korean fonts for consistent rendering across platforms
const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-noto-sans-kr",
})

const notoSerifKR = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-noto-serif-kr",
})

export const metadata: Metadata = {
  title: "메타버스 국제표준화 동향",
  description: "메타버스 국제표준화 동향과 표준 검색 사이트",
  generator: "v0.app",
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${inter.variable} ${sourceSans.variable} ${notoSansKR.variable} ${notoSerifKR.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ClientSessionProvider>
            {children}
          </ClientSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
