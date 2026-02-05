"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search, Trash2, ArrowRight, History, Copy,
  ExternalLink, X, Filter, Calendar, Star
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
import { useLanguage } from "@/contexts/language-context"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

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

export default function HistoryPage() {
  const [history, setHistory] = useState<TranslationItem[]>([])
  const [favorites, setFavorites] = useState<TranslationItem[]>([])
  const [search, setSearch] = useState("")
  const [selectedItem, setSelectedItem] = useState<TranslationItem | null>(null)
  const [filterSource, setFilterSource] = useState<string>("all")
  const [filterTarget, setFilterTarget] = useState<string>("all")
  
  const router = useRouter()
  const { t, language } = useLanguage()

  useEffect(() => {
    const saved = localStorage.getItem("translation-history")
    if (saved) setHistory(JSON.parse(saved))
    
    const savedF = localStorage.getItem("translation-favorites")
    if (savedF) setFavorites(JSON.parse(savedF))
  }, [])

  const clearHistory = () => {
    localStorage.removeItem("translation-history")
    setHistory([])
    toast.success(t.history.cleared)
  }

  const deleteItem = (id: string) => {
    const newHistory = history.filter(item => item.id !== id)
    setHistory(newHistory)
    localStorage.setItem("translation-history", JSON.stringify(newHistory))
    if (selectedItem?.id === id) setSelectedItem(null)
    toast.info(t.history.deleted)
  }

  const toggleFavorite = (item: TranslationItem) => {
    const isFav = favorites.some(f => f.translatedText === item.translatedText)
    let newFavorites: TranslationItem[]
    
    if (isFav) {
      newFavorites = favorites.filter(f => f.translatedText !== item.translatedText)
      toast.info(t.favorites.removed)
    } else {
      newFavorites = [{ ...item, timestamp: Date.now() }, ...favorites]
      toast.success(t.favorites.added)
    }
    
    setFavorites(newFavorites)
    localStorage.setItem("translation-favorites", JSON.stringify(newFavorites))
  }

  const isFavorite = (item: TranslationItem) => {
    return favorites.some(f => f.translatedText === item.translatedText)
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    toast.success(t.common.copied)
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

  // Get unique languages for filters
  const sourceLanguages = Array.from(new Set(history.map(item => item.sourceLang)))
  const targetLanguages = Array.from(new Set(history.map(item => item.targetLang)))

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.sourceText.toLowerCase().includes(search.toLowerCase()) ||
      item.translatedText.toLowerCase().includes(search.toLowerCase())
    const matchesSource = filterSource === "all" || item.sourceLang === filterSource
    const matchesTarget = filterTarget === "all" || item.targetLang === filterTarget
    return matchesSearch && matchesSource && matchesTarget
  })

  const groupHistoryByDate = (items: TranslationItem[]) => {
    const groups: Record<string, TranslationItem[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const yesterday = new Date(today - 86400000).getTime()
    const lastWeek = new Date(today - 6 * 86400000).getTime()

    items.forEach(item => {
      if (item.timestamp >= today) groups.today.push(item)
      else if (item.timestamp >= yesterday) groups.yesterday.push(item)
      else if (item.timestamp >= lastWeek) groups.thisWeek.push(item)
      else groups.older.push(item)
    })

    return groups
  }

  const groupedHistory = groupHistoryByDate(filteredHistory)
  const hasHistory = history.length > 0

  const getGroupLabel = (key: string) => {
    switch(key) {
      case 'today': return language === 'tr' ? 'Bugün' : 'Today'
      case 'yesterday': return language === 'tr' ? 'Dün' : 'Yesterday'
      case 'thisWeek': return language === 'tr' ? 'Bu Hafta' : 'This Week'
      case 'older': return language === 'tr' ? 'Daha Eski' : 'Older'
      default: return key
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-card/50 backdrop-blur-xl border rounded-full mb-2">
          <History className="size-4 text-primary" />
          <span className="text-sm font-medium">{t.history.title}</span>
          <Badge variant="secondary" className="ml-1">{history.length}</Badge>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 max-w-5xl mx-auto w-full min-h-0"
      >
        <div className="h-full bg-card/50 backdrop-blur-xl border rounded-3xl shadow-2xl shadow-black/5 dark:shadow-black/20 overflow-hidden flex flex-col">
          {/* Search & Actions */}
          <div className="flex flex-col gap-3 p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder={t.common.search + "..."}
                  className="pl-10 h-10 rounded-xl bg-muted/50 border-transparent"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {hasHistory && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-xl gap-2 text-muted-foreground hover:text-destructive shrink-0">
                      <Trash2 className="size-4" />
                      <span className="hidden sm:inline">{t.history.clearAll}</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t.history.clearAllTitle}</AlertDialogTitle>
                      <AlertDialogDescription>{t.history.clearAllDesc}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                      <AlertDialogAction onClick={clearHistory} className="bg-destructive text-destructive-foreground">
                        {t.common.delete}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Filter className="size-4 text-muted-foreground shrink-0" />
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="h-8 w-[130px] rounded-lg text-xs bg-muted/30 border-transparent">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {sourceLanguages.map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ArrowRight className="size-3 text-muted-foreground shrink-0" />
              <Select value={filterTarget} onValueChange={setFilterTarget}>
                <SelectTrigger className="h-8 w-[130px] rounded-lg text-xs bg-muted/30 border-transparent">
                  <SelectValue placeholder="Target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Targets</SelectItem>
                  {targetLanguages.map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* List */}
            <div className={cn(
              "flex-1 overflow-y-auto custom-scrollbar",
              selectedItem && "hidden md:block md:w-1/2 md:border-r"
            )}>
              {filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <History className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">{t.history.noHistory}</h3>
                  <p className="text-sm text-muted-foreground">
                    {search ? t.history.tryDifferent : t.history.noHistoryDesc}
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-4">
                  {Object.entries(groupedHistory).map(([key, items]) => items.length > 0 && (
                    <div key={key}>
                      <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/20 rounded-lg mb-2">
                        <Calendar className="size-3" />
                        {getGroupLabel(key)}
                      </div>
                      <div className="space-y-1">
                        <AnimatePresence>
                          {items.map((item, index) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ delay: index * 0.02 }}
                              onClick={() => setSelectedItem(item)}
                              className={cn(
                                "p-3 rounded-xl cursor-pointer transition-all border border-transparent group relative",
                                "hover:bg-muted/50 hover:border-border/50",
                                selectedItem?.id === item.id && "bg-primary/10 border-primary/20 shadow-sm"
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 h-5">
                                      {item.sourceLang.slice(0, 2).toUpperCase()}
                                    </Badge>
                                    <ArrowRight className="size-3 text-muted-foreground" />
                                    <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 h-5 bg-primary/5">
                                      {item.targetLang.slice(0, 2).toUpperCase()}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground ml-auto">
                                      {formatTime(item.timestamp)}
                                    </span>
                                  </div>
                                  <p className="text-sm line-clamp-2 mb-0.5 text-foreground/90">{item.sourceText}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-2">{item.translatedText}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "size-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
                                    isFavorite(item) && "opacity-100 text-yellow-500 hover:text-yellow-600"
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleFavorite(item)
                                  }}
                                >
                                  <Star className={cn("size-4", isFavorite(item) && "fill-current")} />
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detail Panel */}
            <AnimatePresence>
              {selectedItem && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={cn(
                    "w-full md:w-1/2 flex flex-col bg-muted/20",
                    !selectedItem && "hidden"
                  )}
                >
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">{selectedItem.sourceLang}</Badge>
                      <ArrowRight className="size-4 text-muted-foreground" />
                      <Badge variant="outline" className="font-mono bg-primary/5">{selectedItem.targetLang}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg md:hidden"
                      onClick={() => setSelectedItem(null)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">{t.translator.source}</p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedItem.sourceText}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">{t.translator.translation}</p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedItem.translatedText}</p>
                    </div>
                  </div>

                  <div className="p-4 border-t flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "rounded-xl transition-colors",
                        isFavorite(selectedItem) && "text-yellow-500 hover:text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10"
                      )}
                      onClick={() => toggleFavorite(selectedItem)}
                    >
                      <Star className={cn("size-4", isFavorite(selectedItem) && "fill-current")} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-xl gap-2"
                      onClick={() => copyToClipboard(selectedItem.translatedText)}
                    >
                      <Copy className="size-4" />
                      {t.common.copy}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-xl gap-2"
                      onClick={() => restoreItem(selectedItem)}
                    >
                      <ExternalLink className="size-4" />
                      {t.history.openInTranslator}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl text-destructive hover:text-destructive"
                      onClick={() => deleteItem(selectedItem.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
