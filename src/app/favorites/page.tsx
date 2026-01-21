"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { 
  Search, Trash2, ArrowRight, Star, Heart, Copy,
  MoreVertical, ExternalLink
} from "lucide-react"
import { toast } from "sonner"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useLanguage } from "@/contexts/language-context"

type TranslationItem = {
  id: string
  sourceText: string
  translatedText: string
  sourceLang: string
  targetLang: string
  timestamp: number
  tone?: string
  isFavorite?: boolean
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<TranslationItem[]>([])
  const [search, setSearch] = useState("")
  const router = useRouter()
  const { t, language } = useLanguage()

  useEffect(() => {
    const saved = localStorage.getItem("translation-favorites")
    if (saved) setFavorites(JSON.parse(saved))
  }, [])

  const removeFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const newFavorites = favorites.filter(item => item.id !== id)
    setFavorites(newFavorites)
    localStorage.setItem("translation-favorites", JSON.stringify(newFavorites))
    toast.info(t.favorites.removed)
  }

  const copyToClipboard = async (e: React.MouseEvent, text: string) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(text)
    toast.success(t.common.copied)
  }

  const clearAllFavorites = () => {
    localStorage.removeItem("translation-favorites")
    setFavorites([])
    toast.success(t.history.cleared)
  }

  const restoreItem = (item: TranslationItem) => {
    const params = new URLSearchParams({
      text: item.sourceText,
      translation: item.translatedText,
      sourceLang: item.sourceLang,
      targetLang: item.targetLang
    })
    router.push(`/?${params.toString()}`)
  }

  const filtered = favorites.filter(item => 
    item.sourceText.toLowerCase().includes(search.toLowerCase()) || 
    item.translatedText.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full min-h-svh bg-background">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/">{t.nav.translator}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-2">
                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                {t.favorites.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="ml-auto flex items-center gap-3">
          <Badge variant="secondary" className="gap-1.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
            <Heart className="size-3 fill-current" />
            {favorites.length} {t.favorites.saved}
          </Badge>
          
          {favorites.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-muted-foreground hover:text-destructive hover:border-destructive">
                  <Trash2 className="size-4" />
                  <span className="hidden sm:inline">{t.history.clearAll}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t.history.clearAllTitle}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t.history.clearAllDesc}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={clearAllFavorites} 
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t.common.delete}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </header>

      {/* Search Bar */}
      <div className="border-b px-4 py-3">
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder={t.common.search + "..."} 
            className="pl-10 bg-muted/50 border-transparent focus:bg-background focus:border-input transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="max-w-3xl mx-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="p-4 rounded-full bg-yellow-500/10 mb-4">
                  <Star className="size-8 text-yellow-500" />
                </div>
                <h3 className="text-lg font-medium mb-1">{t.favorites.noFavorites}</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  {search 
                    ? t.history.tryDifferent 
                    : t.favorites.noFavoritesDesc
                  }
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => router.push("/")}
                >
                  {t.favorites.goToTranslator}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map((item) => (
                  <Card 
                    key={item.id} 
                    className="group hover:shadow-md hover:border-yellow-500/30 transition-all cursor-pointer relative overflow-hidden"
                    onClick={() => restoreItem(item)}
                  >
                    {/* Favorite indicator */}
                    <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                      <div className="absolute top-0 right-0 w-4 h-4 bg-yellow-400 transform rotate-45 translate-x-4 -translate-y-2" />
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Language badges */}
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="font-mono">
                            {item.sourceLang}
                          </Badge>
                          <ArrowRight className="size-3 text-muted-foreground" />
                          <Badge variant="outline" className="font-mono bg-primary/5">
                            {item.targetLang}
                          </Badge>
                        </div>
                        
                        {/* Source text */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{t.favorites.original}</p>
                          <p className="text-sm font-medium line-clamp-2">{item.sourceText}</p>
                        </div>
                        
                        {/* Translation */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{t.translator.translation}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.translatedText}</p>
                        </div>
                        
                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.timestamp).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US')}
                          </p>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => copyToClipboard(e, item.translatedText)}
                            >
                              <Copy className="size-3.5" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreVertical className="size-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  restoreItem(item)
                                }}>
                                  <ExternalLink className="size-4 mr-2" />
                                  {t.history.openInTranslator}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => copyToClipboard(e, item.translatedText)}>
                                  <Copy className="size-4 mr-2" />
                                  {t.history.copyTranslation}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={(e) => removeFavorite(e, item.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Star className="size-4 mr-2" />
                                  {t.favorites.removeFromFavorites}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
