"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { 
  Languages, 
  History, 
  Star, 
  Settings, 
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navItems = [
  { href: "/", icon: Languages, labelKey: "translator" as const },
  { href: "/history", icon: History, labelKey: "history" as const },
  { href: "/favorites", icon: Star, labelKey: "favorites" as const },
  { href: "/settings", icon: Settings, labelKey: "settings" as const },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsCollapsed(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Check connection status
  useEffect(() => {
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
    const interval = setInterval(checkConnection, 30000) // Check every 30s
    return () => clearInterval(interval)
  }, [])

  // Desktop Sidebar
  if (!isMobile) {
    return (
      <TooltipProvider delayDuration={0}>
        <motion.aside
          initial={false}
          animate={{ 
            width: isCollapsed ? "80px" : "280px",
          }}
          className="sticky top-0 h-svh z-40 bg-sidebar border-r border-sidebar-border shadow-xl flex flex-col transition-all duration-300 ease-in-out hidden md:flex shrink-0"
        >
          {/* Header */}
          <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
            <div className={cn("flex items-center gap-3 overflow-hidden transition-all", isCollapsed ? "justify-center w-full" : "")}>
              <Logo size={isCollapsed ? 32 : 28} />
              {!isCollapsed && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-bold text-lg whitespace-nowrap text-sidebar-foreground"
                >
                  Localce
                </motion.span>
              )}
            </div>
            
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto text-muted-foreground hover:text-foreground hidden lg:flex"
                onClick={() => setIsCollapsed(true)}
              >
                <PanelLeftClose className="size-4" />
              </Button>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return isCollapsed ? (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center justify-center size-12 rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className="size-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover text-popover-foreground border-border">
                    {t.nav[item.labelKey]}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="size-5" />
                  <span className="font-medium text-sm">{t.nav[item.labelKey]}</span>
                </Link>
              )
            })}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-sidebar-border">
             {isCollapsed ? (
                <div className="flex flex-col gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "size-3 rounded-full mx-auto border border-background shadow-sm transition-colors",
                        isConnected === null ? "bg-yellow-500" : isConnected ? "bg-green-500" : "bg-red-500"
                      )} />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {isConnected === null ? "Checking..." : isConnected ? "Online" : "Offline"}
                    </TooltipContent>
                  </Tooltip>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-full h-10 rounded-xl"
                    onClick={() => setIsCollapsed(false)}
                  >
                    <PanelLeftOpen className="size-5 text-muted-foreground" />
                  </Button>
                </div>
             ) : (
               <div className="space-y-3">
                 <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "size-2 rounded-full transition-colors",
                        isConnected === null ? "bg-yellow-500" : isConnected ? "bg-green-500" : "bg-red-500"
                      )} />
                      <span className="text-xs font-medium text-muted-foreground">
                        {isConnected === null ? "Checking..." : isConnected ? "LM Studio Online" : "Disconnected"}
                      </span>
                    </div>
                 </div>
                 <div className="p-4 rounded-xl bg-sidebar-accent/50 border border-sidebar-border/50">
                    <p className="text-xs text-muted-foreground text-center">
                      Localce v1.0.0
                    </p>
                 </div>
               </div>
             )}
          </div>
        </motion.aside>
      </TooltipProvider>
    )
  }

  // Mobile Bottom Navigation
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border pb-safe md:hidden">
      <div className="flex items-center justify-around p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-all",
                isActive && "bg-primary/10"
              )}>
                <item.icon className="size-5" />
              </div>
              <span className="text-[10px] font-medium">{t.nav[item.labelKey]}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
