import type { Metadata } from "next"
import { Geist, Geist_Mono, Pixelify_Sans } from "next/font/google"
import "./globals.css"

const pixelifySans = Pixelify_Sans({
  variable: "--font-pixelify",
  subsets: ["latin"],
  weight: ["400", "700"],
})
import { ThemeProvider } from "@/components/layout/theme-provider"
import { Navbar } from "@/components/ui/mini-navbar"
import { Toaster } from "@/components/ui/sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "EDITH — Conversational Gmail Assistant",
  description:
    "Manage your Gmail inbox using natural voice conversations powered by OpenAI and Composio.",

}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${pixelifySans.variable} h-full antialiased bg-background`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Navbar />
          <main className="flex flex-1 flex-col">{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
