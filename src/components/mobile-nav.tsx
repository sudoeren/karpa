"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Languages, History, Star, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"

export function MobileNav() {
  const pathname = usePathname()
  const { t } = useLanguage()

  const items = [
    {
      href: "/",
      label: t.nav.translator,
      icon: Languages
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
    <div className="fixed bottom-6 left-0 right-0 z-50 px-6 md:hidden pointer-events-none">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mx-auto max-w-sm pointer-events-auto"
      >
        <div className="flex items-center justify-around h-16 px-2 bg-background/60 backdrop-blur-xl border border-border rounded-2xl shadow-xl shadow-black/5">
          {items.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn(
                  "size-5 transition-transform duration-200",
                  isActive && "scale-110"
                )} />
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-tight transition-all duration-200",
                  isActive ? "opacity-100" : "opacity-60"
                )}>
                  {item.label}
                </span>
                
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active-bar"
                    className="absolute -bottom-1 w-6 h-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}