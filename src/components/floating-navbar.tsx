"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Languages, History, Star, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"
import { Logo } from "@/components/logo"
import { motion } from "framer-motion"

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
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="flex items-center gap-2 p-1.5 bg-background/70 backdrop-blur-2xl border border-border/50 rounded-full shadow-lg shadow-black/5 dark:shadow-black/20">
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center justify-center size-10 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          <Logo size={22} />
        </Link>

        {/* Divider */}
        <div className="w-px h-6 bg-border/50" />

        {/* Navigation Items */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-active"
                    className="absolute inset-0 bg-primary rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <item.icon className="size-4" />
                  <span className="hidden sm:inline">{t.nav[item.labelKey]}</span>
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </motion.nav>
  )
}
