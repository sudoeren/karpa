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
  Search, Trash2, ArrowRight, History, Clock, Languages,
  MoreVertical, ExternalLink, Copy
} from "lucide-react"
import { toast } from "sonner"
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

type TranslationItem = {
  id: string
  sourceText: string
  translatedText: string
  sourceLang: string
  targetLang: string
  timestamp: number
  tone?: string
}

export default function HistoryPage() {
  const [history, setHistory] = useState<TranslationItem[]>([])
  const [search, setSearch] = useState("")
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem("translation-history")
    if (saved) setHistory(JSON.parse(saved))
  }, [])

  const clearHistory = () => {
    localStorage.removeItem("translation-history")
    setHistory([])
    toast.success("History cleared")
  }

  const deleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const newHistory = history.filter(item => item.id !== id)
    setHistory(newHistory)
    localStorage.setItem("translation-history", JSON.stringify(newHistory))
    toast.info("Item removed")
  }

  const copyToClipboard = async (e: React.MouseEvent, text: string) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
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

  const filteredHistory = history.filter(item => 
    item.sourceText.toLowerCase().includes(search.toLowerCase()) || 
    item.translatedText.toLowerCase().includes(search.toLowerCase())
  )

  // Group by date
  const groupedHistory = filteredHistory.reduce((groups: Record<string, TranslationItem[]>, item) => {
    const date = new Date(item.timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    if (!groups[date]) groups[date] = []
    groups[date].push(item)
    return groups
  }, {})

  return (
    <div className="flex flex-col h-full min-h-svh bg-background">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/">Translator</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-2">
                <History className="size-4" />
                History
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="ml-auto flex items-center gap-3">
          <Badge variant="secondary" className="gap-1.5">
            <Clock className="size-3" />
            {history.length} items
          </Badge>
          
          {history.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-muted-foreground hover:text-destructive hover:border-destructive">
                  <Trash2 className="size-4" />
                  <span className="hidden sm:inline">Clear All</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. All {history.length} translation records will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={clearHistory} 
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete All
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
            placeholder="Search translations..." 
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
            {filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <History className="size-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">No history found</h3>
                <p className="text-sm text-muted-foreground">
                  {search ? "Try a different search term" : "Your translations will appear here"}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedHistory).map(([date, items]) => (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="size-4 text-muted-foreground" />
                      <h3 className="text-sm font-medium text-muted-foreground">{date}</h3>
                      <Badge variant="outline" className="text-xs">{items.length}</Badge>
                    </div>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <Card 
                          key={item.id} 
                          className="group hover:shadow-md hover:border-primary/20 transition-all cursor-pointer"
                          onClick={() => restoreItem(item)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0 space-y-3">
                                {/* Language badges */}
                                <div className="flex items-center gap-2 text-xs">
                                  <Badge variant="outline" className="font-mono">
                                    {item.sourceLang}
                                  </Badge>
                                  <ArrowRight className="size-3 text-muted-foreground" />
                                  <Badge variant="outline" className="font-mono bg-primary/5">
                                    {item.targetLang}
                                  </Badge>
                                  {item.tone && item.tone !== "standard" && (
                                    <Badge variant="secondary" className="capitalize">
                                      {item.tone}
                                    </Badge>
                                  )}
                                </div>
                                
                                {/* Text preview */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <p className="text-sm line-clamp-2">{item.sourceText}</p>
                                  <p className="text-sm text-muted-foreground line-clamp-2">{item.translatedText}</p>
                                </div>
                                
                                {/* Time */}
                                <p className="text-xs text-muted-foreground">
                                  {new Date(item.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                              
                              {/* Actions */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreVertical className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation()
                                    restoreItem(item)
                                  }}>
                                    <ExternalLink className="size-4 mr-2" />
                                    Open in Translator
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => copyToClipboard(e, item.translatedText)}>
                                    <Copy className="size-4 mr-2" />
                                    Copy Translation
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={(e) => deleteItem(e, item.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="size-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
