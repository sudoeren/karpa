"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { 
  Languages, 
  History, 
  Star, 
  Settings,
  CircleCheck,
  CircleX,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"
import { Logo } from "@/components/logo"
import { useState, useEffect } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel
} from "@/components/ui/sidebar"

const navItems = [
  { href: "/", icon: Languages, labelKey: "translator" as const },
  { href: "/history", icon: History, labelKey: "history" as const },
  { href: "/favorites", icon: Star, labelKey: "favorites" as const },
  { href: "/settings", icon: Settings, labelKey: "settings" as const },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { t } = useLanguage()
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  
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

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Logo size={20} className="text-white" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold text-base">Localce</span>
                  <span className="text-xs text-muted-foreground">AI Translator</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t.nav.workspace}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    tooltip={t.nav[item.labelKey]}
                    className="h-10 transition-colors"
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span className="font-medium">{t.nav[item.labelKey]}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              size="lg"
              className={cn(
                "border transition-colors",
                isConnected === true && "bg-green-500/5 border-green-500/20 hover:bg-green-500/10",
                isConnected === false && "bg-red-500/5 border-red-500/20 hover:bg-red-500/10",
                isConnected === null && "bg-muted/30 border-muted hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "flex aspect-square size-8 items-center justify-center rounded-lg",
                isConnected === true && "text-green-600 dark:text-green-400",
                isConnected === false && "text-red-600 dark:text-red-400",
                isConnected === null && "text-muted-foreground"
              )}>
                {isConnected === null ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isConnected ? (
                  <CircleCheck className="size-4" />
                ) : (
                  <CircleX className="size-4" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className={cn(
                  "truncate font-semibold",
                  isConnected === true && "text-green-600 dark:text-green-400",
                  isConnected === false && "text-red-600 dark:text-red-400"
                )}>
                  {isConnected === null ? "Checking..." : isConnected ? "LM Studio Ready" : "Disconnected"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {isConnected === null ? "Please wait" : isConnected ? "v1.0.0" : "Check connection"}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
