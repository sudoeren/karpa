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

  const activeIndex = items.findIndex(item => item.href === pathname)

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 px-6 md:hidden pointer-events-none">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mx-auto max-w-sm pointer-events-auto"
      >
        <div className="relative flex items-center justify-around h-16 p-1.5 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[28px] shadow-2xl shadow-black/50 ring-1 ring-white/5 overflow-hidden">
          {/* Sliding Active Indicator */}
          <AnimatePresence>
            {activeIndex !== -1 && (
              <motion.div
                layoutId="mobile-nav-pill"
                className="absolute bg-white/10 rounded-[22px] z-0"
                initial={false}
                animate={{
                  left: `calc(${activeIndex * 25}% + 6px)`,
                  width: "calc(25% - 12px)",
                  height: 48
                }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 30
                }}
              />
            )}
          </AnimatePresence>

          {items.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative z-10 flex flex-col items-center justify-center w-full h-full gap-1 transition-colors duration-300",
                  isActive ? "text-primary" : "text-white/40"
                )}
              >
                <item.icon className={cn(
                  "size-5 transition-all duration-300",
                  isActive && "scale-110"
                )} />
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-widest transition-all duration-300",
                  isActive ? "opacity-100" : "opacity-40"
                )}>
                  {item.label}
                </span>
                
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active-dot"
                    className="absolute bottom-1 size-0.5 rounded-full bg-primary"
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
