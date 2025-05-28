"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { AppSidebar } from "@/components/app-sidebar"

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="lg:hidden">
      {/* Header fixo para mobile */}
      <header className="sticky top-0 z-50 w-full border-b border-blue-100 dark:border-blue-900 bg-blue-50/95 dark:bg-blue-950/95 backdrop-blur supports-[backdrop-filter]:bg-blue-50/60 dark:supports-[backdrop-filter]:bg-blue-950/60">
        <div className="flex h-14 items-center px-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="mr-3 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                aria-label="Abrir menu de navegação"
              >
                <Menu className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 border-blue-100 dark:border-blue-900">
              <SheetHeader className="sr-only">
                <SheetTitle>Menu de Navegação E-PROSYS</SheetTitle>
              </SheetHeader>
              {/* Sidebar completo dentro do Sheet */}
              <div className="h-full">
                <AppSidebar onNavigate={() => setIsOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo/Título no header mobile */}
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="text-xl text-blue-700 dark:text-blue-300">E-PROSYS</span>
          </Link>
        </div>
      </header>
    </div>
  )
}
