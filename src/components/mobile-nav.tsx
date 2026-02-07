"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, History, Star, Settings, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"

export function MobileNav() {
  const pathname = usePathname()
  const { t } = useLanguage()

  const items = [
    {
      href: "/",
      label: t.nav.translator,
      icon: Home
    },
    {
      href: "/history",
      label: t.nav.history,
      icon: History
    },
    {
      href: "/favorites",
      label: t.nav.favorites,
      icon: Star
    },
    {
      href: "/settings",
      label: t.nav.settings,
      icon: Settings
    }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t md:hidden pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-all",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-1 rounded-xl transition-colors",
                isActive && "bg-primary/10"
              )}>
                <item.icon className={cn("size-5", isActive && "fill-current")} />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
