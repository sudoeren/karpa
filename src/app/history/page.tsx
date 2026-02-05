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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6 shrink-0"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
            <History className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.history.title}</h1>
            <p className="text-sm text-muted-foreground">{history.length} {t.history.items}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasHistory && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-xl gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5">
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
                  <AlertDialogCancel className="rounded-xl">{t.common.cancel}</AlertDialogCancel>
                  <AlertDialogAction onClick={clearHistory} className="bg-destructive text-destructive-foreground rounded-xl">
                    {t.common.delete}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </motion.div>

      {/* Island Container */}
      <LayoutGroup>
        <motion.div
          layout
          className="bg-card/50 backdrop-blur-xl border rounded-[32px] overflow-hidden flex flex-col flex-1 min-h-0"
        >
          {/* Search & Filters Bar */}
          <div className="p-4 border-b bg-muted/30 flex flex-col sm:flex-row gap-4 shrink-0">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={t.common.search + "..."}
                className="pl-10 h-11 rounded-2xl bg-background/50 border-transparent focus:bg-background transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="h-11 w-[160px] rounded-2xl bg-background/50 border-transparent">
                  <SelectValue placeholder={t.history.allSources} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.history.allSources}</SelectItem>
                  {sourceLanguages.map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ArrowRight className="size-4 text-muted-foreground shrink-0 mx-1" />
              <Select value={filterTarget} onValueChange={setFilterTarget}>
                <SelectTrigger className="h-11 w-[160px] rounded-2xl bg-background/50 border-transparent">
                  <SelectValue placeholder={t.history.allTargets} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.history.allTargets}</SelectItem>
                  {targetLanguages.map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content Island */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left: History List */}
            <motion.div 
              layout
              className={cn(
                "h-full overflow-y-auto custom-scrollbar transition-all duration-500 ease-in-out",
                selectedId ? "w-full md:w-[400px] border-r bg-muted/5" : "w-full"
              )}
            >
              {filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-12 opacity-40">
                  <div className="size-20 rounded-full bg-muted flex items-center justify-center mb-6">
                    <History className="size-10" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t.history.noHistory}</h3>
                  <p className="max-w-xs">{search ? t.history.tryDifferent : t.history.noHistoryDesc}</p>
                </div>
              ) : (
                <div className="p-4 space-y-8">
                  {Object.entries(groupedHistory).map(([key, items]) => items.length > 0 && (
                    <div key={key} className="space-y-3">
                      <div className="sticky top-0 z-10 py-2 bg-background/80 backdrop-blur-md flex items-center gap-3">
                        <span className="text-[11px] uppercase tracking-[0.2em] font-black text-muted-foreground/50">
                          {getGroupLabel(key)}
                        </span>
                        <div className="h-px bg-border/50 flex-1" />
                      </div>
                      
                      <div className="space-y-2">
                        {items.map((item) => (
                          <motion.div
                            key={item.id}
                            layoutId={`card-${item.id}`}
                            onClick={() => setSelectedId(item.id)}
                            className={cn(
                              "p-4 rounded-2xl cursor-pointer transition-all border group relative",
                              selectedId === item.id 
                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[0.98]" 
                                : "bg-background hover:bg-muted/50 border-border/50 hover:border-border"
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border",
                                  selectedId === item.id ? "bg-white/20 border-white/30" : "bg-muted border-border"
                                )}>
                                  {item.sourceLang === "Auto Detect" ? "AUTO" : item.sourceLang.slice(0, 2).toUpperCase()}
                                </div>
                                <ArrowRight className="size-3 opacity-50" />
                                <div className={cn(
                                  "px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border",
                                  selectedId === item.id ? "bg-white/20 border-white/30" : "bg-primary/10 border-primary/20 text-primary"
                                )}>
                                  {item.targetLang.slice(0, 2).toUpperCase()}
                                </div>
                              </div>
                              <span className={cn(
                                "text-[10px] font-medium opacity-60",
                                selectedId === item.id ? "text-white" : ""
                              )}>
                                {formatTime(item.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm font-medium line-clamp-2 leading-relaxed">
                              {item.sourceText}
                            </p>
                            {selectedId !== item.id && (
                              <p className="text-xs mt-1 text-muted-foreground line-clamp-1 italic">
                                {item.translatedText}
                              </p>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Right: Detail View */}
            <AnimatePresence mode="wait">
              {selectedId && selectedItem && (
                <motion.div
                  key={selectedId}
                  initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, x: 20, filter: "blur(10px)" }}
                  transition={{ type: "spring", damping: 25, stiffness: 120 }}
                  className="hidden md:flex flex-1 bg-background/50 flex-col h-full overflow-hidden"
                >
                  {/* Detail Header */}
                  <div className="p-6 border-b flex items-center justify-between bg-muted/10 shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest leading-none mb-1">Source</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {selectedItem.sourceLang === "Auto Detect" ? (
                            <span className="flex items-center gap-1"><Sparkles className="size-3" /> Auto</span>
                          ) : selectedItem.sourceLang}
                        </Badge>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground" />
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] uppercase font-black text-primary tracking-widest leading-none mb-1">Target</span>
                        <Badge variant="outline" className="font-mono text-xs bg-primary/5 border-primary/20 text-primary">{selectedItem.targetLang}</Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                          "size-10 rounded-2xl transition-all",
                          isFavorite(selectedItem) && "text-yellow-500 border-yellow-500/50 bg-yellow-500/5 shadow-sm"
                        )}
                        onClick={() => toggleFavorite(selectedItem)}
                      >
                        <Star className={cn("size-5", isFavorite(selectedItem) && "fill-current")} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-10 rounded-2xl text-destructive hover:bg-destructive/10 hover:border-destructive/20"
                        onClick={() => deleteItem(selectedId)}
                      >
                        <Trash2 className="size-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-10 rounded-2xl ml-2"
                        onClick={() => setSelectedId(null)}
                      >
                        <X className="size-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Detail Body */}
                  <div className="flex-1 p-8 space-y-10 overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                          {t.translator.source}
                        </h4>
                        <div className="h-px flex-1 bg-border/30" />
                      </div>
                      <div className="p-6 rounded-3xl bg-muted/20 border border-border/50 text-xl leading-relaxed tracking-tight break-words">
                        {selectedItem.sourceText}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/60">
                          {t.translator.translation}
                        </h4>
                        <div className="h-px flex-1 bg-primary/10" />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 rounded-xl gap-2 text-xs"
                          onClick={() => copyToClipboard(selectedItem.translatedText)}
                        >
                          <Copy className="size-3.5" />
                          {t.common.copy}
                        </Button>
                      </div>
                      <div className="p-8 rounded-[32px] bg-primary/5 border border-primary/10 shadow-inner text-2xl font-semibold leading-relaxed tracking-tight text-foreground selection:bg-primary selection:text-primary-foreground break-words">
                        {selectedItem.translatedText}
                      </div>
                    </div>
                  </div>

                  {/* Detail Footer - Premium Restore Action */}
                  <div className="p-6 bg-muted/5 border-t shrink-0">
                    <Button
                      size="lg"
                      className="w-full h-16 rounded-[24px] gap-4 text-lg font-black tracking-tight bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_20px_40px_-12px_rgba(var(--primary),0.3)] hover:shadow-[0_20px_40px_-8px_rgba(var(--primary),0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 group"
                      onClick={() => restoreItem(selectedItem)}
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

            {/* Mobile Detail Overlay */}
            <AnimatePresence>
              {selectedId && selectedItem && (
                <motion.div
                  initial={{ opacity: 0, y: "100%" }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: "100%" }}
                  className="fixed inset-0 z-[60] bg-background md:hidden flex flex-col"
                >
                  <div className="p-4 border-b flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)}>
                      <X className="size-6" />
                    </Button>
                    <span className="font-bold">{formatTime(selectedItem.timestamp)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => deleteItem(selectedId)}
                    >
                      <Trash2 className="size-5" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{selectedItem.sourceLang}</Badge>
                        <ArrowRight className="size-4" />
                        <Badge variant="outline" className="text-primary border-primary/20">{selectedItem.targetLang}</Badge>
                      </div>
                      <div className="p-5 rounded-2xl bg-muted/50 border">
                        <p className="text-base leading-relaxed break-words">{selectedItem.sourceText}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-black uppercase tracking-widest text-primary">{t.translator.translation}</p>
                      <div className="p-6 rounded-[24px] bg-primary/5 border border-primary/10">
                        <p className="text-xl font-bold leading-tight break-words">{selectedItem.translatedText}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 border-t grid grid-cols-2 gap-3 pb-safe">
                    <Button variant="outline" className="h-12 rounded-xl" onClick={() => restoreItem(selectedItem)}>
                      {t.history.openInTranslator}
                    </Button>
                    <Button className="h-12 rounded-xl font-bold" onClick={() => copyToClipboard(selectedItem.translatedText)}>
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