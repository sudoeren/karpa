"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { 
  Languages, 
  History, 
  Star, 
  Settings
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
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-fit px-4">
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-2 p-2 bg-background/80 backdrop-blur-xl border shadow-lg shadow-black/5 rounded-full ring-1 ring-white/10 dark:ring-white/5"
        >
          {/* Connection Status Indicator */}
          <div className="pl-3 pr-1 border-r mr-1 hidden sm:flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "flex items-center justify-center size-2.5 rounded-full shadow-[0_0_8px]",
                  isConnected === true ? "bg-green-500 shadow-green-500/50" : 
                  isConnected === false ? "bg-red-500 shadow-red-500/50" : 
                  "bg-yellow-500 shadow-yellow-500/50 animate-pulse"
                )} />
              </TooltipTrigger>
              <TooltipContent side="top" className="font-medium">
                {isConnected === null ? "Checking..." : isConnected ? "LM Studio: Online" : "LM Studio: Offline"}
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
                      "relative flex items-center justify-center size-10 rounded-full transition-all duration-300",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-md scale-110" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-105"
                    )}>
                      <item.icon className="size-5" />
                      {isActive && (
                        <motion.div
                          layoutId="active-nav"
                          className="absolute -bottom-1 size-1 rounded-full bg-primary-foreground/50"
                        />
                      )}
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" className="mb-2">
                  <p>{t.nav[item.labelKey]}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </motion.div>
      </div>
    </TooltipProvider>
  )
}
