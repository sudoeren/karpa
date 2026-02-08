"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion"
import { 
  Languages, 
  History, 
  Star, 
  Settings,
  Activity,
  Wifi,
  WifiOff
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
  const mouseX = useMotionValue(Infinity)

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

  return (
    <TooltipProvider delayDuration={0}>
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <motion.div 
          onMouseMove={(e) => mouseX.set(e.pageX)}
          onMouseLeave={() => mouseX.set(Infinity)}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-end gap-2 px-4 py-3 bg-background/40 dark:bg-black/40 backdrop-blur-2xl border border-white/10 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-3xl ring-1 ring-white/20 dark:ring-white/10 relative overflow-visible"
        >
          {/* Status Section */}
          <div className="flex flex-col items-center justify-center pr-3 border-r border-white/10 dark:border-white/5 mr-1 h-10">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative group cursor-help">
                  <div className={cn(
                    "size-2 rounded-full transition-all duration-500",
                    isConnected === true ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]" : 
                    isConnected === false ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]" : 
                    "bg-amber-500 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                  )} />
                  <div className={cn(
                    "absolute -inset-1 rounded-full opacity-0 group-hover:opacity-20 transition-opacity",
                    isConnected === true ? "bg-emerald-500" : isConnected === false ? "bg-rose-500" : "bg-amber-500"
                  )} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={20} className="bg-background/95 backdrop-blur-md border-white/10 px-3 py-1.5 text-xs font-medium">
                <div className="flex items-center gap-2">
                  {isConnected === null ? <Activity className="size-3 animate-spin" /> : isConnected ? <Wifi className="size-3 text-emerald-500" /> : <WifiOff className="size-3 text-rose-500" />}
                  <span>{isConnected === null ? "Checking connection..." : isConnected ? "LM Studio Online" : "LM Studio Offline"}</span>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Navigation Items */}
          <div className="flex items-end gap-3">
            {navItems.map((item) => (
              <NavItem 
                key={item.href} 
                item={item} 
                mouseX={mouseX} 
                isActive={pathname === item.href}
                label={t.nav[item.labelKey]}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </TooltipProvider>
  )
}

function NavItem({ 
  item, 
  mouseX, 
  isActive, 
  label 
}: { 
  item: any, 
  mouseX: any, 
  isActive: boolean,
  label: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 64, 40])
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 })

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={item.href}>
          <motion.div
            ref={ref}
            style={{ width }}
            className={cn(
              "relative aspect-square rounded-2xl flex items-center justify-center transition-colors duration-300 overflow-hidden",
              isActive 
                ? "bg-primary text-primary-foreground shadow-[0_8px_16px_rgba(0,0,0,0.1)]" 
                : "bg-white/5 dark:bg-white/10 text-muted-foreground hover:bg-white/10 dark:hover:bg-white/20 hover:text-foreground"
            )}
          >
            <item.icon className={cn(
              "transition-transform duration-300",
              isActive ? "size-6" : "size-5"
            )} />
            
            {isActive && (
              <motion.div
                layoutId="nav-active-glow"
                className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none"
              />
            )}
            
            <AnimatePresence>
              {isActive && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary-foreground"
                />
              )}
            </AnimatePresence>
          </motion.div>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={20} className="font-semibold text-[10px] uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black border-none px-2 py-1">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
