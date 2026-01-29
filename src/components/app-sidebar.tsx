"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { 
  Languages, 
  History, 
  Star, 
  Settings, 
  PanelLeftClose,
  PanelLeftOpen,
  Menu
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

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
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
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
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <div className={cn("flex items-center gap-3 overflow-hidden transition-all w-full", isCollapsed ? "justify-center" : "")}>
          <Logo size={isCollapsed ? 32 : 28} />
          {!isCollapsed && (
            <span className="font-bold text-lg whitespace-nowrap text-sidebar-foreground">
              Localce
            </span>
          )}
        </div>
        
        {!isCollapsed && !isMobile && (
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

      <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          
          const LinkContent = (
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("size-5 shrink-0", isActive ? "text-sidebar-primary-foreground" : "text-muted-foreground group-hover:text-sidebar-accent-foreground")} />
              {!isCollapsed && <span className="font-medium text-sm">{t.nav[item.labelKey]}</span>}
              {!isCollapsed && isActive && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-current opacity-50" />
              )}
            </Link>
          )

          return isCollapsed && !isMobile ? (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center justify-center size-10 rounded-lg transition-all duration-200 mx-auto",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="size-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-popover text-popover-foreground border-border font-medium">
                {t.nav[item.labelKey]}
              </TooltipContent>
            </Tooltip>
          ) : (
            <div key={item.href} onClick={() => {}}>
               {LinkContent}
            </div>
          )
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border mt-auto">
         {isCollapsed && !isMobile ? (
            <div className="flex flex-col gap-4 items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "size-2.5 rounded-full border border-background shadow-sm transition-colors cursor-help",
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
                className="size-8 rounded-lg"
                onClick={() => setIsCollapsed(false)}
              >
                <PanelLeftOpen className="size-4 text-muted-foreground" />
              </Button>
            </div>
         ) : (
           <div className="space-y-4">
             <div className="flex items-center justify-between px-2 bg-sidebar-accent/30 rounded-lg p-2 border border-sidebar-border/50">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-2 w-2">
                    <span className={cn(
                      "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                      isConnected === null ? "bg-yellow-500" : isConnected ? "bg-green-500" : "bg-red-500"
                    )}></span>
                    <span className={cn(
                      "relative inline-flex rounded-full h-2 w-2",
                      isConnected === null ? "bg-yellow-500" : isConnected ? "bg-green-500" : "bg-red-500"
                    )}></span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {isConnected === null ? "Checking..." : isConnected ? "LM Studio Ready" : "Disconnected"}
                  </span>
                </div>
             </div>
             
             <div className="flex items-center justify-between text-[10px] text-muted-foreground px-2">
                <span>v1.0.0</span>
                <span>© 2024</span>
             </div>
           </div>
         )}
      </div>
    </div>
  )

  // Mobile Header
  if (isMobile) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-xl border-b px-4 flex items-center justify-between md:hidden">
        <div className="flex items-center gap-2">
          <Logo size={24} />
          <span className="font-bold text-lg">Localce</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="-mr-2">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px] bg-sidebar border-r border-sidebar-border">
            {renderSidebarContent()}
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  // Desktop Sidebar
  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ 
          width: isCollapsed ? "72px" : "260px",
        }}
        className="sticky top-0 h-svh z-40 bg-sidebar border-r border-sidebar-border shadow-sm flex flex-col transition-all duration-300 ease-in-out hidden md:flex shrink-0"
      >
        {renderSidebarContent()}
      </motion.aside>
    </TooltipProvider>
  )
}
