"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Languages, History, Star, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Logo } from "@/components/logo"

const navItems = [
  { href: "/", icon: Languages, labelKey: "translator" as const },
  { href: "/history", icon: History, labelKey: "history" as const },
  { href: "/favorites", icon: Star, labelKey: "favorites" as const },
  { href: "/settings", icon: Settings, labelKey: "settings" as const },
]

export function FloatingNavbar() {
  const pathname = usePathname()
  const { t } = useLanguage()

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between px-4 py-2 bg-background/80 backdrop-blur-xl border rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Logo size={28} />
              <span className="font-semibold text-sm hidden sm:block">Localce</span>
            </Link>

            {/* Navigation */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "relative flex items-center justify-center size-10 rounded-xl transition-all duration-200",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <item.icon className="size-[18px]" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-medium">
                      {t.nav[item.labelKey]}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </div>
        </div>
      </nav>
    </TooltipProvider>
  )
}
