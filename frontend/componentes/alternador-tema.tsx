"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function AlternadorTema() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl hover:bg-secondary transition-colors">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl shadow-soft-lg min-w-[140px]">
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className={cn(
            "py-2.5 px-3 rounded-lg cursor-pointer gap-3",
            theme === "light" && "bg-secondary"
          )}
        >
          <Sun className="h-4 w-4" />
          <span>Claro</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className={cn(
            "py-2.5 px-3 rounded-lg cursor-pointer gap-3",
            theme === "dark" && "bg-secondary"
          )}
        >
          <Moon className="h-4 w-4" />
          <span>Escuro</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
