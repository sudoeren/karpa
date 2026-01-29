"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Languages, 
  History, 
  Star, 
  Settings, 
  PanelLeftClose, 
  PanelLeftOpen,
  Menu,
  CircleCheck,
  CircleX,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { Logo } from "@/components/logo"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"

type SidebarContentProps = {
  isCollapsed: boolean
  mobile?: boolean
  toggleCollapse: () => void
  setIsMobileOpen: (open: boolean) => void
  isConnected: boolean | null
  navItems: Array<{ href: string; icon: React.ElementType; labelKey: string }>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
  pathname: string
}

const SidebarContent = ({ 
  isCollapsed, 
  mobile = false, 
  toggleCollapse, 
  setIsMobileOpen,
  isConnected,
  navItems,
  t,
  pathname
}: SidebarContentProps) => (
  <div className="flex flex-col h-full bg-card/50 backdrop-blur-md border-r">
    {/* Header */}
    <div className={cn("flex items-center h-16 border-b px-4", isCollapsed && !mobile ? "justify-center" : "justify-between")}>
      <Link href="/" className="flex items-center gap-2 overflow-hidden">
        <div className="flex items-center justify-center shrink-0 size-8 rounded-lg bg-primary text-primary-foreground">
          <Logo size={20} className="text-white" />
        </div>
        {(!isCollapsed || mobile) && (
          <div className="flex flex-col leading-none">
            <span className="font-bold text-base">Localce</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">AI Translator</span>
          </div>
        )}
      </Link>
      {(!isCollapsed || mobile) && !mobile && (
         <Button variant="ghost" size="icon" onClick={toggleCollapse} className="ml-auto hidden md:flex text-muted-foreground hover:text-foreground">
           <PanelLeftClose className="size-4" />
         </Button>
      )}
    </div>

    {/* Nav */}
    <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link 
            key={item.href} 
            href={item.href}
            onClick={() => mobile && setIsMobileOpen(false)}
          >
            <div className={cn(
              "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              isActive 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              isCollapsed && !mobile && "justify-center px-2"
            )}>
              <item.icon className={cn("size-5 shrink-0", isActive && "fill-current")} />
              {(!isCollapsed || mobile) && (
                <span className="text-sm font-medium">{t.nav[item.labelKey]}</span>
              )}
              {isCollapsed && !mobile && (
                <div className="absolute left-14 z-50 rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none whitespace-nowrap border">
                  {t.nav[item.labelKey]}
                </div>
              )}
            </div>
          </Link>
        )
      })}
    </div>

    {/* Footer / Status */}
    <div className="p-3 border-t bg-muted/10">
      <div className={cn(
          "rounded-xl border p-2 transition-all duration-300",
          isConnected === true ? "bg-green-500/10 border-green-500/20" : 
          isConnected === false ? "bg-red-500/10 border-red-500/20" : 
          "bg-muted/50 border-border"
        )}>
          <div className={cn("flex items-center gap-3", isCollapsed && !mobile && "justify-center")}>
            <div className={cn(
              "shrink-0 flex items-center justify-center size-8 rounded-lg",
              isConnected === true ? "bg-green-500 text-white" : 
              isConnected === false ? "bg-red-500 text-white" : 
              "bg-muted text-muted-foreground"
            )}>
              {isConnected === null ? <Loader2 className="size-4 animate-spin" /> : 
               isConnected ? <CircleCheck className="size-4" /> : 
               <CircleX className="size-4" />}
            </div>
            
            {(!isCollapsed || mobile) && (
              <div className="flex flex-col min-w-0">
                <span className={cn(
                  "text-xs font-bold truncate",
                  isConnected === true ? "text-green-600 dark:text-green-400" : 
                  isConnected === false ? "text-red-600 dark:text-red-400" :
                  "text-muted-foreground"
                )}>
                  {isConnected === null ? "Checking..." : isConnected ? "Online" : "Offline"}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  LM Studio
                </span>
              </div>
            )}
          </div>
      </div>
      
      {isCollapsed && !mobile && (
           <Button variant="ghost" size="icon" onClick={toggleCollapse} className="mt-2 w-full flex md:hidden">
             <PanelLeftOpen className="size-4" />
           </Button>
      )}
    </div>
  </div>
)

export function SimpleSidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)
  const [isConnected, setIsConnected] = React.useState<boolean | null>(null)

  // Load sidebar state from localStorage on mount
  React.useEffect(() => {
    const savedState = localStorage.getItem("sidebar-collapsed")
    if (savedState) {
      setIsCollapsed(savedState === "true")
    }
  }, [])

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("sidebar-collapsed", String(newState))
  }

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

  const props = {
    isCollapsed,
    toggleCollapse,
    setIsMobileOpen,
    isConnected,
    navItems,
    t,
    pathname
  }

  return (
    <>
      {/* Mobile Header trigger */}
      <div className="fixed top-0 left-0 right-0 h-16 border-b bg-background/80 backdrop-blur-xl z-40 flex items-center px-4 md:hidden justify-between">
        <Link href="/" className="flex items-center gap-2">
           <Logo size={24} />
           <span className="font-bold">Localce</span>
        </Link>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px] border-r">
             <SheetTitle className="sr-only">Menu</SheetTitle>
             <SidebarContent mobile={true} {...props} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden md:flex flex-col h-svh sticky top-0 transition-all duration-300 ease-in-out border-r bg-background z-50",
          isCollapsed ? "w-[70px]" : "w-[260px]"
        )}
      >
        <SidebarContent {...props} />
        {isCollapsed && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleCollapse}
            className="absolute -right-3 top-20 rounded-full border bg-background shadow-md size-6 p-0 hover:bg-muted hidden"
          >
            <PanelLeftOpen className="size-3" />
          </Button>
        )}
      </aside>
    </>
  )
}