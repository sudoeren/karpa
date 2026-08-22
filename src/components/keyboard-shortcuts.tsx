"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Keyboard } from "@phosphor-icons/react"
import { useLanguage } from "@/contexts/language-context"

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { setTheme, theme } = useTheme()
  const { t } = useLanguage()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "?" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
      
      if (e.key === "," && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        router.push("/settings")
      }

      if (e.key === "d" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setTheme(theme === "dark" ? "light" : "dark")
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [router, setTheme, theme])

  const shortcuts = [
    { key: "Ctrl + Enter", action: t.keyboard.translate },
    { key: "Ctrl + ,", action: t.keyboard.settings },
    { key: "Ctrl + D", action: t.keyboard.theme },
    { key: "Ctrl + ?", action: t.keyboard.shortcuts },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="size-5" />
            {t.keyboard.title}
          </DialogTitle>
          <DialogDescription>
            {t.keyboard.desc}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between p-2 rounded-lg border bg-muted/50"
            >
              <span className="text-sm font-medium">{shortcut.action}</span>
              <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-background px-2.5 font-mono text-[10px] font-medium text-muted-foreground shadow-sm opacity-100">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
