"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Languages, History, Star, Settings, Info, Moon, Sun, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
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
]

export function FloatingNavbar() {
  const pathname = usePathname()
  const { t, language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-1 px-2 py-2 bg-background/80 backdrop-blur-xl border rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30">
          {/* Main Navigation */}
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "relative flex items-center justify-center size-11 rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="size-5" />
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-foreground" />
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" className="font-medium">
                  {t.nav[item.labelKey]}
                </TooltipContent>
              </Tooltip>
            )
          })}

          {/* Divider */}
          <div className="w-px h-6 bg-border mx-1" />

          {/* Settings Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "size-11 rounded-xl",
                      pathname === "/settings" && "bg-muted"
                    )}
                  >
                    <Settings className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="top" className="font-medium">
                {t.nav.settings}
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="center" side="top" className="w-48 mb-2">
              <DropdownMenuLabel>{t.common.theme}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="size-4 mr-2" />
                {t.common.light}
                {theme === "light" && <span className="ml-auto text-primary">●</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="size-4 mr-2" />
                {t.common.dark}
                {theme === "dark" && <span className="ml-auto text-primary">●</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="size-4 mr-2" />
                {t.common.system}
                {theme === "system" && <span className="ml-auto text-primary">●</span>}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>{t.common.language}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setLanguage("en")}>
                <span className="mr-2">🇬🇧</span>
                English
                {language === "en" && <span className="ml-auto text-primary">●</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("tr")}>
                <span className="mr-2">🇹🇷</span>
                Turkce
                {language === "tr" && <span className="ml-auto text-primary">●</span>}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="size-4 mr-2" />
                  {t.settings.title}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* About */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/about"
                className={cn(
                  "flex items-center justify-center size-11 rounded-xl transition-all duration-200",
                  pathname === "/about"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Info className="size-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top" className="font-medium">
              {t.nav.about}
            </TooltipContent>
          </Tooltip>
        </div>
      </nav>
    </TooltipProvider>
  )
}
