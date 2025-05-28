import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { RealtimeDataProvider } from "@/components/realtime-data-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "E-PROSYS",
  description: "Base de conhecimento multiplataforma, gestão de pendências, lista de acessos e controle de SPEDs",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <RealtimeDataProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>{children}</SidebarInset>
              <Toaster />
            </SidebarProvider>
          </RealtimeDataProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
