"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
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

  // Connection check
  React.useEffect(() => {
    const checkConnection = async () => {
      try {
        const savedUrl = localStorage.getItem("llm-api-url") || localStorage.getItem("lm-studio-url") || "http://localhost:1234"
        const savedProvider = localStorage.getItem("llm-provider") || "lmstudio"
        const savedApiKey = sessionStorage.getItem("llm-api-key") || undefined
        const response = await fetch('/api/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: savedUrl, provider: savedProvider, apiKey: savedApiKey }),
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
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-1 px-2 py-2 bg-background/60 backdrop-blur-xl border border-border rounded-2xl shadow-xl shadow-black/5"
        >
          {/* Connection Status */}
          <div className="pr-2 border-r border-border mr-1 pl-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="size-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors cursor-help">
                  <div className={cn(
                    "size-1.5 rounded-full transition-all duration-500",
                    isConnected === true ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : 
                    isConnected === false ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" : 
                    "bg-amber-500 animate-pulse"
                  )} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={15} className="text-[10px] font-bold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  {isConnected === null ? <Loader2 className="size-3 animate-spin" /> : isConnected ? <Wifi className="size-3 text-emerald-500" /> : <WifiOff className="size-3 text-rose-500" />}
                  {isConnected === null ? "Checking..." : isConnected ? "Engine Online" : "Engine Offline"}
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Navigation Items */}
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <div className={cn(
                      "relative size-10 flex items-center justify-center rounded-xl transition-all duration-200 group",
                      isActive 
                        ? "text-primary bg-primary/10" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}>
                      <item.icon className={cn(
                        "size-5 transition-transform duration-200",
                        isActive ? "scale-110" : "group-hover:scale-110"
                      )} />
                      
                      {isActive && (
                        <motion.div
                          layoutId="nav-active-bar"
                          className="absolute -bottom-1 w-4 h-0.5 rounded-full bg-primary"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={15} className="text-[10px] font-bold uppercase tracking-wider">
                  {t.nav[item.labelKey]}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </motion.div>
      </div>
    </TooltipProvider>
  )
}