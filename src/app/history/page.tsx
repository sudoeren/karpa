"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search, Trash2, ArrowRight, History, Copy,
  ExternalLink, X, Filter, Calendar, Star, Sparkles
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
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
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
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filterSource, setFilterSource] = useState<string>("all")
  const [filterTarget, setFilterTarget] = useState<string>("all")
  
  const router = useRouter()
  const { t, language } = useLanguage()

  useEffect(() => {
    const saved = localStorage.getItem("translation-history")
    if (saved) {
      const historyData = JSON.parse(saved)
      setHistory(historyData)
      
      const hash = window.location.hash.replace('#', '')
      if (hash && historyData.some((item: TranslationItem) => item.id === hash)) {
        setSelectedId(hash)
      }
    }
    
    const savedF = localStorage.getItem("translation-favorites")
    if (savedF) setFavorites(JSON.parse(savedF))
  }, [])

  useEffect(() => {
    if (selectedId) {
      window.location.hash = selectedId
    } else {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [selectedId])

  const selectedItem = history.find(item => item.id === selectedId) || null

  const clearHistory = () => {
    localStorage.removeItem("translation-history")
    setHistory([])
    setSelectedId(null)
    toast.success(t.history.cleared)
  }

  const deleteItem = (id: string) => {
    const newHistory = history.filter(item => item.id !== id)
    setHistory(newHistory)
    localStorage.setItem("translation-history", JSON.stringify(newHistory))
    if (selectedId === id) setSelectedId(null)
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
    <div className="h-full flex flex-col max-w-7xl mx-auto w-full px-4 overflow-hidden">
      {/* Header Area */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6 shrink-0"
      >
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shadow-sm">
            <History className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.history.title}</h1>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{history.length} {t.history.items}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasHistory && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-xl h-10 px-4 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors">
                  <Trash2 className="size-4 mr-2" />
                  <span className="text-xs font-bold uppercase tracking-wider">{t.history.clearAll}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[32px] border-none shadow-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold">{t.history.clearAllTitle}</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">{t.history.clearAllDesc}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-3">
                  <AlertDialogCancel className="rounded-2xl border-none bg-muted/50 hover:bg-muted font-bold transition-colors">{t.common.cancel}</AlertDialogCancel>
                  <AlertDialogAction onClick={clearHistory} className="bg-destructive text-destructive-foreground rounded-2xl font-bold hover:bg-destructive/90 transition-colors">
                    {t.common.delete}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </motion.div>

      {/* Main Island */}
      <LayoutGroup>
        <motion.div
          layout
          className="bg-card/30 backdrop-blur-3xl border border-white/10 dark:border-white/5 rounded-[40px] flex flex-col flex-1 min-h-0 overflow-hidden shadow-2xl shadow-black/5"
        >
          {/* Top Search Bar */}
          <div className="p-6 border-b border-white/5 flex flex-col lg:flex-row gap-6 shrink-0">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder={t.common.search + "..."}
                className="pl-12 h-12 rounded-2xl bg-muted/20 border-white/5 focus:border-primary/20 focus:bg-muted/30 focus:ring-0 transition-all text-base"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-muted/20 rounded-2xl p-1 border border-white/5">
                <Select value={filterSource} onValueChange={setFilterSource}>
                  <SelectTrigger className="h-10 w-[160px] rounded-xl border-none bg-transparent hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-wider">
                    <SelectValue placeholder={t.history.allSources} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-white/5">
                    <SelectItem value="all" className="text-xs font-bold uppercase">{t.history.allSources}</SelectItem>
                    {sourceLanguages.map(l => (
                      <SelectItem key={l} value={l} className="text-xs font-bold uppercase">{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <Select value={filterTarget} onValueChange={setFilterTarget}>
                  <SelectTrigger className="h-10 w-[160px] rounded-xl border-none bg-transparent hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-wider">
                    <SelectValue placeholder={t.history.allTargets} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-white/5">
                    <SelectItem value="all" className="text-xs font-bold uppercase">{t.history.allTargets}</SelectItem>
                    {targetLanguages.map(l => (
                      <SelectItem key={l} value={l} className="text-xs font-bold uppercase">{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* List Side */}
            <motion.div 
              layout
              className={cn(
                "h-full overflow-y-auto custom-scrollbar transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                selectedId ? "w-full md:w-[450px] border-r border-white/5 bg-muted/5" : "w-full"
              )}
            >
              {filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-12">
                  <div className="size-24 rounded-[40px] bg-muted/10 flex items-center justify-center mb-8 border border-white/5">
                    <History className="size-10 text-muted-foreground/20" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 opacity-40">{t.history.noHistory}</h3>
                  <p className="max-w-xs text-sm text-muted-foreground/40 font-medium">{search ? t.history.tryDifferent : t.history.noHistoryDesc}</p>
                </div>
              ) : (
                <div className="p-6 space-y-12">
                  {Object.entries(groupedHistory).map(([key, items]) => items.length > 0 && (
                    <div key={key} className="space-y-4">
                      <div className="sticky top-0 z-10 py-2 bg-transparent flex items-center gap-4">
                        <span className="text-[10px] uppercase tracking-[0.3em] font-black text-primary/40">
                          {getGroupLabel(key)}
                        </span>
                        <div className="h-px bg-white/5 flex-1" />
                      </div>
                      
                      <div className="grid gap-2">
                        {items.map((item) => (
                          <motion.div
                            key={item.id}
                            layoutId={`item-${item.id}`}
                            onClick={() => setSelectedId(item.id)}
                            className={cn(
                              "p-5 rounded-3xl cursor-pointer transition-all border relative overflow-hidden group",
                              selectedId === item.id 
                                ? "bg-primary/[0.08] border-primary/20" 
                                : "bg-transparent border-transparent hover:bg-white/[0.03] hover:border-white/5"
                            )}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "px-2 py-0.5 rounded-lg text-[9px] font-black border",
                                  selectedId === item.id ? "bg-primary/20 border-primary/30 text-primary" : "bg-muted/30 border-white/5 text-muted-foreground"
                                )}>
                                  {item.sourceLang === "Auto Detect" ? "AUTO" : item.sourceLang.slice(0, 2).toUpperCase()}
                                </div>
                                <ArrowRight className={cn("size-3 opacity-20", selectedId === item.id && "opacity-40")} />
                                <div className={cn(
                                  "px-2 py-0.5 rounded-lg text-[9px] font-black border",
                                  selectedId === item.id ? "bg-primary text-primary-foreground border-primary" : "bg-primary/10 border-primary/10 text-primary"
                                )}>
                                  {item.targetLang.slice(0, 2).toUpperCase()}
                                </div>
                              </div>
                              <span className="text-[10px] font-bold tabular-nums opacity-30">
                                {formatTime(item.timestamp)}
                              </span>
                            </div>
                            <p className={cn(
                              "text-sm font-semibold line-clamp-2 leading-relaxed transition-colors",
                              selectedId === item.id ? "text-primary" : "text-foreground/70"
                            )}>
                              {item.sourceText}
                            </p>
                            
                            {selectedId === item.id && (
                              <motion.div 
                                layoutId="dot"
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-primary"
                              />
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Detail Side */}
            <AnimatePresence mode="wait">
              {selectedId && selectedItem && (
                <motion.div
                  key={selectedId}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ type: "spring", damping: 30, stiffness: 150 }}
                  className="hidden md:flex flex-1 bg-white/[0.01] flex-col h-full overflow-hidden"
                >
                  {/* Detail Header */}
                  <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-8">
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase font-black text-muted-foreground tracking-[0.2em] leading-none">{t.history.source}</p>
                        <p className="text-base font-bold">{selectedItem.sourceLang}</p>
                      </div>
                      <div className="size-10 rounded-2xl bg-muted/20 flex items-center justify-center shrink-0">
                        <ArrowRight className="size-5 text-muted-foreground/50" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase font-black text-primary tracking-[0.2em] leading-none">{t.history.target}</p>
                        <p className="text-base font-bold text-primary">{selectedItem.targetLang}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "size-12 rounded-2xl transition-all",
                          isFavorite(selectedItem) && "text-yellow-500 bg-yellow-500/10"
                        )}
                        onClick={() => toggleFavorite(selectedItem)}
                      >
                        <Star className={cn("size-5", isFavorite(selectedItem) && "fill-current")} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-12 rounded-2xl text-destructive hover:bg-destructive/10"
                        onClick={() => deleteItem(selectedId)}
                      >
                        <Trash2 className="size-5" />
                      </Button>
                      <div className="w-px h-10 bg-white/5 mx-2" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-12 rounded-2xl hover:bg-muted"
                        onClick={() => setSelectedId(null)}
                      >
                        <X className="size-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 p-10 space-y-12 overflow-y-auto custom-scrollbar">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">{t.history.source}</span>
                        <div className="h-px flex-1 bg-white/5" />
                      </div>
                      <div className="text-xl leading-relaxed text-foreground/60 font-medium break-words">
                        {selectedItem.sourceText}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40">{t.history.target}</span>
                        <div className="h-px flex-1 bg-primary/10" />
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="h-9 rounded-xl gap-2 font-bold px-4"
                          onClick={() => copyToClipboard(selectedItem.translatedText)}
                        >
                          <Copy className="size-4" />
                          <span className="text-[10px] uppercase tracking-wider">{t.common.copy}</span>
                        </Button>
                      </div>
                      <div className="text-3xl font-bold leading-tight tracking-tight text-foreground break-words">
                        {selectedItem.translatedText}
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="p-8 border-t border-white/5 shrink-0">
                    <Button
                      onClick={() => restoreItem(selectedItem)}
                      className="w-full h-16 rounded-3xl gap-4 text-lg font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/20 transition-all active:scale-[0.98] group"
                    >
                      <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center transition-transform group-hover:rotate-12 group-hover:scale-110">
                        <ExternalLink className="size-5" />
                      </div>
                      <span className="flex-1 text-left font-bold">{t.history.openInTranslator}</span>
                      <ArrowRight className="size-5 opacity-50 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile View */}
            <AnimatePresence>
              {selectedId && selectedItem && (
                <motion.div
                  initial={{ opacity: 0, y: "100%" }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 200 }}
                  className="fixed inset-0 z-[60] bg-background md:hidden flex flex-col"
                >
                  <div className="p-6 border-b flex items-center justify-between">
                    <Button variant="ghost" size="icon" className="rounded-2xl" onClick={() => setSelectedId(null)}>
                      <X className="size-6" />
                    </Button>
                    <span className="text-xs font-black uppercase tracking-widest opacity-40">{formatTime(selectedItem.timestamp)}</span>
                    <Button variant="ghost" size="icon" className="rounded-2xl text-destructive" onClick={() => deleteItem(selectedId)}>
                      <Trash2 className="size-5" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 space-y-10">
                    <div className="space-y-4">
                      <Badge variant="outline" className="rounded-lg">{selectedItem.sourceLang} → {selectedItem.targetLang}</Badge>
                      <p className="text-lg font-medium text-foreground/60 leading-relaxed break-words">{selectedItem.sourceText}</p>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">{t.history.target}</p>
                      <p className="text-2xl font-bold leading-tight break-words">{selectedItem.translatedText}</p>
                    </div>
                  </div>
                  <div className="p-6 border-t grid grid-cols-2 gap-4 pb-safe">
                    <Button variant="outline" className="h-14 rounded-2xl font-bold uppercase tracking-wider text-xs" onClick={() => restoreItem(selectedItem)}>
                      {t.history.openInTranslator}
                    </Button>
                    <Button className="h-14 rounded-2xl font-bold uppercase tracking-wider text-xs bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-none" onClick={() => copyToClipboard(selectedItem.translatedText)}>
                      {t.common.copy}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </LayoutGroup>
    </div>
  )
}
