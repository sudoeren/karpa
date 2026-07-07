"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Translate, ClockCounterClockwise, Star, Gear, WifiHigh, WifiSlash, Spinner } from "@phosphor-icons/react"
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
    { href: "/", icon: Translate, labelKey: "translator" as const },
    { href: "/history", icon: ClockCounterClockwise, labelKey: "history" as const },
    { href: "/favorites", icon: Star, labelKey: "favorites" as const },
    { href: "/settings", icon: Gear, labelKey: "settings" as const },
  ]

  return (
    <TooltipProvider delayDuration={0}>
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-1 px-2 py-1.5 bg-background/60 backdrop-blur-xl border border-border rounded-2xl">
          <div className="pr-2 border-r border-border mr-1 pl-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="size-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors cursor-help">
                  <div className={cn(
                    "size-1.5 rounded-full transition-colors",
                    isConnected === true ? "bg-emerald-500" :
                    isConnected === false ? "bg-rose-500" :
                    "bg-amber-500"
                  )} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={15} className="text-xs">
                <div className="flex items-center gap-1.5">
                  {isConnected === null ? <Spinner className="size-3 animate-spin" /> : isConnected ? <WifiHigh className="size-3 text-emerald-500" /> : <WifiSlash className="size-3 text-rose-500" />}
                  {isConnected === null ? "Checking..." : isConnected ? "Engine Online" : "Engine Offline"}
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <div className={cn(
                      "size-10 flex items-center justify-center rounded-xl transition-colors",
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}>
                      <item.icon className="size-5" />
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={15} className="text-xs">
                  {t.nav[item.labelKey]}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}
