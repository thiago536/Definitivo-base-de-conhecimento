"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  BookOpen,
  CheckSquare,
  Key,
  Settings,
  Home,
  Users,
  Smartphone,
  Wrench,
  Cog,
  RefreshCw,
  Printer,
  CreditCard,
  Lock,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { Separator } from "@/components/ui/separator"

// Map of category IDs to icons for the knowledge base
export const categoryIcons = {
  gerente: Users,
  pdv: BarChart3,
  "pdv-movel": Smartphone,
  instalacao: Wrench,
  automacao: Cog,
  integracao: RefreshCw,
  impressoras: Printer,
  pinpad: CreditCard,
}

export function AppSidebar() {
  const pathname = usePathname()
  const [dailyPassword, setDailyPassword] = useState("")

  // Calculate daily password
  useEffect(() => {
    const today = new Date()
    const day = String(today.getDate()).padStart(2, "0")
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const dateNumber = Number.parseInt(`${day}${month}`)

    const division = dateNumber / 8369
    const decimalPart = division.toString().split(".")[1] || "0000"
    const password = decimalPart.substring(0, 4).replace(/^0+/, "") || "0"

    setDailyPassword(password)
  }, [])

  const navItems = [
    {
      title: "Início",
      href: "/",
      icon: Home,
    },
    {
      title: "Base de Conhecimento",
      href: "/base-conhecimento",
      icon: BookOpen,
    },
    {
      title: "Pendências",
      href: "/pendencias",
      icon: CheckSquare,
    },
    {
      title: "Acessos",
      href: "/acessos",
      icon: Key,
    },
    {
      title: "Configuração",
      href: "/configuracao",
      icon: Settings,
    },
  ]

  return (
    <Sidebar className="border-r border-blue-100 dark:border-blue-900">
      <SidebarHeader>
        <div className="flex h-14 items-center border-b border-blue-100 dark:border-blue-900 px-6 bg-blue-50 dark:bg-blue-950">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="text-xl text-blue-700 dark:text-blue-300">E-PROSYS</span>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-gray-950">
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  className="hover:bg-blue-100 dark:hover:bg-blue-900/40"
                >
                  <Link href={item.href}>
                    <item.icon
                      className={`h-5 w-5 ${pathname === item.href ? "text-blue-600 dark:text-blue-400" : ""}`}
                    />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-blue-50 dark:bg-blue-950">
        <div className="flex flex-col p-4 gap-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">E-PROSYS v1.0.0</div>
            <ModeToggle />
          </div>

          <Separator className="bg-blue-200 dark:bg-blue-800" />

          <div className="flex items-center gap-2 p-2 bg-blue-100 dark:bg-blue-900 rounded-md">
            <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">Senha diária</div>
              <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{dailyPassword}</div>
            </div>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail className="bg-blue-100 dark:bg-blue-900" />
    </Sidebar>
  )
}
