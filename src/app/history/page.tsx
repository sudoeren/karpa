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
    <div className="flex flex-col min-h-full">
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
        className="flex-1 max-w-5xl mx-auto w-full"
      >
        <div className="bg-card/50 backdrop-blur-xl border rounded-3xl shadow-2xl shadow-black/5 dark:shadow-black/20 overflow-hidden flex flex-col min-h-[500px]">
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

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4">

                      {filteredHistory.length === 0 ? (

                        <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">

                          <History className="size-16 mb-4 text-muted-foreground/50" />

                          <h3 className="text-lg font-semibold mb-2">{t.history.noHistory}</h3>

                          <p className="text-muted-foreground">

                            {search ? t.history.tryDifferent : t.history.noHistoryDesc}

                          </p>

                        </div>

                      ) : (

                        <div className="max-w-3xl mx-auto space-y-8">

                          {Object.entries(groupedHistory).map(([key, items]) => items.length > 0 && (

                            <div key={key} className="space-y-4">

                              <div className="sticky top-0 z-10 flex items-center gap-2 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">

                                <div className="px-3 py-1 rounded-full bg-muted text-xs font-medium flex items-center gap-2 border">

                                  <Calendar className="size-3" />

                                  {getGroupLabel(key)}

                                </div>

                                <div className="h-px bg-border flex-1" />

                              </div>

                              

                              <div className="grid gap-4">

                                <AnimatePresence>

                                  {items.map((item, index) => (

                                    <motion.div

                                      key={item.id}

                                      initial={{ opacity: 0, y: 10 }}

                                      animate={{ opacity: 1, y: 0 }}

                                      exit={{ opacity: 0, scale: 0.95 }}

                                      transition={{ delay: index * 0.05 }}

                                      className="group relative bg-card hover:bg-muted/30 border rounded-2xl p-5 transition-all shadow-sm hover:shadow-md"

                                    >

                                      {/* Header */}

                                      <div className="flex items-center justify-between mb-4">

                                        <div className="flex items-center gap-2">

                                          <Badge variant="outline" className="font-mono">{item.sourceLang}</Badge>

                                          <ArrowRight className="size-3 text-muted-foreground" />

                                          <Badge variant="outline" className="font-mono bg-primary/5 text-primary">{item.targetLang}</Badge>

                                          <span className="text-xs text-muted-foreground ml-2">

                                            {formatTime(item.timestamp)}

                                          </span>

                                        </div>

                                        

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">

                                          <Button

                                            variant="ghost"

                                            size="icon"

                                            className={cn(

                                              "size-8 rounded-lg",

                                              isFavorite(item) && "text-yellow-500 hover:text-yellow-600"

                                            )}

                                            onClick={() => toggleFavorite(item)}

                                          >

                                            <Star className={cn("size-4", isFavorite(item) && "fill-current")} />

                                          </Button>

                                          <Button

                                            variant="ghost"

                                            size="icon"

                                            className="size-8 rounded-lg"

                                            onClick={() => copyToClipboard(item.translatedText)}

                                          >

                                            <Copy className="size-4" />

                                          </Button>

                                          <Button

                                            variant="ghost"

                                            size="icon"

                                            className="size-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"

                                            onClick={() => deleteItem(item.id)}

                                          >

                                            <Trash2 className="size-4" />

                                          </Button>

                                        </div>

                                      </div>

          

                                      {/* Content */}

                                      <div className="grid md:grid-cols-2 gap-4 mb-4">

                                        <div className="space-y-1">

                                          <p className="text-xs font-medium text-muted-foreground">{t.translator.source}</p>

                                          <p className="text-sm leading-relaxed text-foreground/80 break-words">{item.sourceText}</p>

                                        </div>

                                        <div className="space-y-1">

                                          <p className="text-xs font-medium text-muted-foreground">{t.translator.translation}</p>

                                          <p className="text-sm leading-relaxed font-medium break-words">{item.translatedText}</p>

                                        </div>

                                      </div>

          

                                      {/* Footer */}

                                      <div className="pt-3 border-t flex justify-end">

                                        <Button

                                          variant="outline"

                                          size="sm"

                                          className="rounded-lg gap-2 text-xs h-8"

                                          onClick={() => restoreItem(item)}

                                        >

                                          <ExternalLink className="size-3" />

                                          {t.history.openInTranslator}

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

                  </div>

                </motion.div>

              </div>

            )

          }
