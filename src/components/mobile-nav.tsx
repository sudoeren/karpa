"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Languages, History, Star, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"

export function MobileNav() {
  const pathname = usePathname()
  const { t } = useLanguage()

  const items = [
    { href: "/", label: t.nav.translator, icon: Languages },
    { href: "/history", label: t.nav.history, icon: History },
    { href: "/favorites", label: t.nav.favorites, icon: Star },
    { href: "/settings", label: t.nav.settings, icon: Settings },
  ]

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-6 md:hidden">
      <div className="flex items-center justify-around h-14 max-w-sm w-full px-2 bg-background/60 backdrop-blur-xl border border-border rounded-2xl">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="size-5" />
              <span className={cn(
                "text-[10px] font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
