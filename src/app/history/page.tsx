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
        <div className="bg-card/50 backdrop-blur-xl border rounded-3xl shadow-2xl shadow-black/5 dark:shadow-black/20 overflow-hidden flex flex-col min-h-[600px] max-h-[750px]">
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

          {/* Content Island */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Scrollable List */}
            <div className="w-full md:w-1/3 border-r overflow-y-auto custom-scrollbar bg-muted/5">
              {filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
                  <History className="size-12 mb-4 text-muted-foreground/30" />
                  <p className="text-sm">{t.history.noHistory}</p>
                </div>
              ) : (
                <div className="p-3 space-y-6">
                  {Object.entries(groupedHistory).map(([key, items]) => items.length > 0 && (
                    <div key={key} className="space-y-2">
                      <div className="sticky top-0 z-10 py-1 bg-background/95 backdrop-blur flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70">
                          {getGroupLabel(key)}
                        </span>
                        <div className="h-px bg-border flex-1" />
                      </div>
                      
                      <div className="space-y-1">
                        {items.map((item) => (
                          <motion.div
                            key={item.id}
                            layoutId={item.id}
                            onClick={() => setSelectedItem(item)}
                            className={cn(
                              "p-3 rounded-xl cursor-pointer transition-all border group relative",
                              selectedItem?.id === item.id 
                                ? "bg-primary/10 border-primary/20 shadow-sm ring-1 ring-primary/20" 
                                : "hover:bg-muted border-transparent"
                            )}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono font-bold">{item.sourceLang.slice(0, 2).toUpperCase()}</span>
                                <ArrowRight className="size-3 text-muted-foreground" />
                                <span className="text-[10px] font-mono font-bold text-primary">{item.targetLang.slice(0, 2).toUpperCase()}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {formatTime(item.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                              {item.sourceText}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Detail View */}
            <div className="hidden md:flex flex-1 bg-muted/10 relative overflow-hidden">
              <AnimatePresence mode="wait">
                {selectedItem ? (
                  <motion.div
                    key={selectedItem.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="absolute inset-0 flex flex-col p-8"
                  >
                    {/* Detail Header */}
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="px-3 py-1 rounded-full bg-background border text-xs font-mono font-bold">
                          {selectedItem.sourceLang}
                        </div>
                        <ArrowRight className="size-4 text-muted-foreground" />
                        <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold">
                          {selectedItem.targetLang}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className={cn(
                            "size-10 rounded-xl",
                            isFavorite(selectedItem) && "text-yellow-500 border-yellow-500/50 bg-yellow-500/5"
                          )}
                          onClick={() => toggleFavorite(selectedItem)}
                        >
                          <Star className={cn("size-5", isFavorite(selectedItem) && "fill-current")} />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-10 rounded-xl text-destructive hover:bg-destructive/10"
                          onClick={() => deleteItem(selectedItem.id)}
                        >
                          <Trash2 className="size-5" />
                        </Button>
                      </div>
                    </div>

                    {/* Detail Body */}
                    <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-4">
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                          {t.translator.source}
                        </h4>
                        <div className="p-6 rounded-2xl bg-background border shadow-sm">
                          <p className="text-lg leading-relaxed">{selectedItem.sourceText}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-primary/80">
                            {t.translator.translation}
                          </h4>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 rounded-lg gap-2"
                            onClick={() => copyToClipboard(selectedItem.translatedText)}
                          >
                            <Copy className="size-4" />
                            {t.common.copy}
                          </Button>
                        </div>
                        <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm relative group">
                          <p className="text-lg leading-relaxed font-medium text-foreground">
                            {selectedItem.translatedText}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Detail Footer */}
                    <div className="mt-8 pt-6 border-t">
                      <Button
                        className="w-full h-12 rounded-2xl gap-3 text-base font-semibold shadow-lg shadow-primary/20"
                        onClick={() => restoreItem(selectedItem)}
                      >
                        <ExternalLink className="size-5" />
                        {t.history.openInTranslator}
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 opacity-30">
                    <div className="size-20 rounded-full border-4 border-dashed mb-6 flex items-center justify-center">
                      <ArrowRight className="size-8" />
                    </div>
                    <h3 className="text-xl font-bold">{language === 'tr' ? 'Bir Çeviri Seçin' : 'Select a Translation'}</h3>
                    <p className="max-w-xs mt-2">
                      {language === 'tr' 
                        ? 'Detayları ve tam metni görmek için soldaki listeden bir öğeye tıklayın.' 
                        : 'Click on an item from the list on the left to see details and full text.'}
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Detail Modal */}
            <AnimatePresence>
              {selectedItem && (
                <motion.div
                  initial={{ opacity: 0, y: "100%" }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: "100%" }}
                  className="fixed inset-0 z-50 bg-background md:hidden flex flex-col"
                >
                  <div className="p-4 border-b flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedItem(null)}>
                      <X className="size-6" />
                    </Button>
                    <span className="font-bold">{t.history.title}</span>
                    <div className="size-10" />
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-2">
                      <Badge variant="outline">{selectedItem.sourceLang} → {selectedItem.targetLang}</Badge>
                      <div className="p-4 rounded-xl bg-muted/50 border">
                        <p className="text-sm">{selectedItem.sourceText}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-primary">{t.translator.translation}</p>
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <p className="text-base font-medium">{selectedItem.translatedText}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 border-t grid grid-cols-2 gap-3">
                    <Button variant="outline" className="rounded-xl" onClick={() => restoreItem(selectedItem)}>
                      {t.history.openInTranslator}
                    </Button>
                    <Button className="rounded-xl" onClick={() => copyToClipboard(selectedItem.translatedText)}>
                      {t.common.copy}
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