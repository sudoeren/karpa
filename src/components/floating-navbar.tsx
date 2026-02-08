"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Languages, 
  History, 
  Star, 
  Settings,
  Wifi,
  WifiOff,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function FloatingNavbar() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const [isConnected, setIsConnected] = React.useState<boolean | null>(null)
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

  // Connection check
  React.useEffect(() => {
    const checkConnection = async () => {
      try {
        const savedUrl = localStorage.getItem("lm-studio-url") || "http://localhost:1234"
        const response = await fetch('/api/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: savedUrl }),
        })
        const data = await response.json()
        setIsConnected(data.success)
      } catch {
        setIsConnected(false)
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  const navItems = [
    { href: "/", icon: Languages, labelKey: "translator" as const },
    { href: "/history", icon: History, labelKey: "history" as const },
    { href: "/favorites", icon: Star, labelKey: "favorites" as const },
    { href: "/settings", icon: Settings, labelKey: "settings" as const },
  ]

  const activeIndex = navItems.findIndex(item => item.href === pathname)

  return (
    <TooltipProvider delayDuration={0}>
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
        {/* Connection Aura Background */}
        <div className={cn(
          "absolute inset-0 -m-4 blur-2xl opacity-20 transition-colors duration-1000 rounded-full pointer-events-none",
          isConnected === true ? "bg-emerald-500/30" : 
          isConnected === false ? "bg-rose-500/30" : 
          "bg-amber-500/30 animate-pulse"
        )} />

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative flex items-center gap-1 p-1.5 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[28px] shadow-2xl shadow-black/50 ring-1 ring-white/5"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Active / Hover Background Capsule */}
          <AnimatePresence>
            {(hoveredIndex !== null || activeIndex !== -1) && (
              <motion.div
                layoutId="nav-glow"
                className="absolute bg-white/10 rounded-[22px] z-0"
                initial={false}
                animate={{
                  left: hoveredIndex !== null ? hoveredIndex * 52 + 6 : activeIndex * 52 + 6,
                  width: 48,
                  height: 48,
                  opacity: 1
                }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 30
                }}
              />
            )}
          </AnimatePresence>

          {/* Navigation Items */}
          {navItems.map((item, index) => {
            const isActive = pathname === item.href
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <motion.div
                      onMouseEnter={() => setHoveredIndex(index)}
                      className={cn(
                        "relative z-10 size-12 flex items-center justify-center rounded-[22px] transition-colors duration-300",
                        isActive ? "text-primary" : "text-white/40 hover:text-white"
                      )}
                    >
                      <item.icon className={cn(
                        "size-5 transition-transform duration-300",
                        isActive && "scale-110"
                      )} />
                      
                      {isActive && (
                        <motion.div
                          layoutId="nav-active-dot"
                          className="absolute bottom-1 size-1 rounded-full bg-primary"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                    </motion.div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={15} className="bg-zinc-900 border-white/5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 text-white">
                  {t.nav[item.labelKey]}
                </TooltipContent>
              </Tooltip>
            )
          })}

          {/* Connection Status Indicator */}
          <div className="ml-1 pl-1 border-l border-white/5 pr-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="size-10 flex items-center justify-center rounded-[18px] hover:bg-white/5 transition-colors cursor-help">
                  <div className={cn(
                    "size-2 rounded-full",
                    isConnected === true ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : 
                    isConnected === false ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" : 
                    "bg-amber-500 animate-pulse"
                  )} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={15} className="bg-zinc-900 border-white/5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 text-white">
                <div className="flex items-center gap-2">
                  {isConnected === null ? <Loader2 className="size-3 animate-spin" /> : isConnected ? <Wifi className="size-3 text-emerald-500" /> : <WifiOff className="size-3 text-rose-500" />}
                  {isConnected === null ? "Checking Engine..." : isConnected ? "Engine Online" : "Engine Offline"}
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </motion.div>
      </div>
    </TooltipProvider>
  )
}
