"use client"

import * as React from "react"
import Image from "next/image"
import {
  History,
  Star,
  Languages,
  Settings,
  ChevronRight,
  ChevronDown,
  Sparkles,
  FileText,
  Globe,
  Zap,
  BookOpen,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  User,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/contexts/language-context"

export function AppSidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()

  // Navigation data with translations
  const navMain = [
    {
      title: t.nav.workspace,
      icon: Sparkles,
      isOpen: true,
      items: [
        {
          title: t.nav.translator,
          url: "/",
          icon: Languages,
        },
      ],
    },
    {
      title: t.nav.library,
      icon: BookOpen,
      isOpen: true,
      items: [
        {
          title: t.nav.history,
          url: "/history",
          icon: History,
        },
        {
          title: t.nav.favorites,
          url: "/favorites",
          icon: Star,
        },
      ],
    },
  ]

  const navSecondary = [
    {
      title: t.nav.settings,
      url: "/settings",
      icon: Settings,
    },
    {
      title: t.nav.about,
      url: "/about",
      icon: User,
    },
  ]

  return (
    <Sidebar variant="floating" collapsible="icon">
      {/* Header with Logo */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  {/* Logo Container */}
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                    <Image
                      src="/logo.png"
                      alt="Localce Logo"
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Localce</span>
                    <span className="truncate text-xs text-muted-foreground">
                      AI Translator
                    </span>
                  </div>
                  <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <DropdownMenuItem className="gap-2 p-2">
                  <div className="flex size-6 items-center justify-center rounded-sm border bg-background">
                    <Globe className="size-4" />
                  </div>
                  <span className="font-medium">v2.2.0</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 p-2">
                  <Zap className="size-4 text-green-500" />
                  <span>LM Studio Connected</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 p-2" asChild>
                  <Link href="https://github.com/sudoeren/localce" target="_blank">
                    <ExternalLink className="size-4" />
                    <span>GitHub</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* Main Navigation */}
        {navMain.map((section) => (
          <Collapsible
            key={section.title}
            defaultOpen={section.isOpen}
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center gap-2">
                  <section.icon className="size-4" />
                  <span>{section.title}</span>
                  <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => {
                      const isActive = pathname === item.url
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={item.title}
                            className={cn(
                              "transition-all duration-150",
                              isActive && "bg-primary text-primary-foreground font-medium"
                            )}
                          >
                            <Link href={item.url}>
                              <item.icon className="size-4" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}

        {/* Secondary Navigation */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {navSecondary.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      size="sm"
                      isActive={isActive}
                      tooltip={item.title}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Link href={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-medium">
                      LC
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Local User</span>
                    <span className="truncate text-xs text-muted-foreground">
                      Free Plan
                    </span>
                  </div>
                  <ModeToggle />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="end"
                side="right"
                sideOffset={4}
              >
                <DropdownMenuItem className="gap-2 p-2">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm">LM Studio Ready</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 p-2" asChild>
                  <Link href="/settings">
                    <Settings className="size-4" />
                    <span>{t.nav.settings}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 p-2" asChild>
                  <Link href="/about">
                    <User className="size-4" />
                    <span>{t.nav.about}</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
