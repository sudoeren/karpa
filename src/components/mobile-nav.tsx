"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
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
    <div className="fixed bottom-6 left-0 right-0 z-50 px-4 md:hidden pointer-events-none">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mx-auto max-w-sm pointer-events-auto"
      >
        <div className="flex items-center justify-around h-16 px-2 bg-background/60 dark:bg-black/60 backdrop-blur-2xl border border-white/10 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-3xl ring-1 ring-white/20 dark:ring-white/10 overflow-hidden relative">
          {items.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300",
                  isActive ? "text-primary scale-110" : "text-muted-foreground"
                )}
              >
                <div className="relative z-10 flex flex-col items-center gap-0.5">
                  <item.icon className={cn(
                    "size-5 transition-all duration-300",
                    isActive && "drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                  )} />
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-tighter transition-all duration-300",
                    isActive ? "opacity-100" : "opacity-60"
                  )}>
                    {item.label}
                  </span>
                </div>

                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-indicator"
                      className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-2xl z-0"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                    />
                  )}
                </AnimatePresence>
                
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-dot"
                    className="absolute bottom-1.5 size-1 rounded-full bg-primary"
                    transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
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
