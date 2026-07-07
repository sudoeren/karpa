"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MagnifyingGlass, Trash, CaretRight, Star, Copy, ArrowSquareOut, Heart, X, FileArrowUp
} from "@phosphor-icons/react"
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
import { cn, safeJSONParse, safeSetItem } from "@/lib/utils"

type TranslationItem = {
  id: string
  sourceText: string
  translatedText: string
  sourceLang: string
  targetLang: string
  timestamp: number
  tone?: string
  isFavorite?: boolean
  mode?: 'text' | 'file'
  fileName?: string
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<TranslationItem[]>([])
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const router = useRouter()
  const { t, language } = useLanguage()

  useEffect(() => {
    const saved = localStorage.getItem("translation-favorites")
    if (saved) setFavorites(safeJSONParse(saved, []))
  }, [])

  const removeFavorite = (id: string) => {
    const newFavorites = favorites.filter(item => item.id !== id)
    setFavorites(newFavorites)
    safeSetItem("translation-favorites", JSON.stringify(newFavorites))
    if (selectedId === id) setSelectedId(null)
    toast.info(t.favorites.removed)
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    toast.success(t.common.copied)
  }

  const clearAllFavorites = () => {
    localStorage.removeItem("translation-favorites")
    setFavorites([])
    setSelectedId(null)
    toast.success(t.history.cleared)
  }

  const restoreItem = (item: TranslationItem) => {
    const params = new URLSearchParams({
      text: item.sourceText,
      translation: item.translatedText,
      sourceLang: item.sourceLang,
      targetLang: item.targetLang,
      ...(item.mode === 'file' && item.fileName ? { mode: 'file', fileName: item.fileName } : {}),
    })
    router.push(`/?${params.toString()}`)
  }

  const filtered = favorites.filter(item =>
    item.sourceText.toLowerCase().includes(search.toLowerCase()) ||
    item.translatedText.toLowerCase().includes(search.toLowerCase())
  )

  const selectedItem = favorites.find(f => f.id === selectedId)

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(language, { 
      day: 'numeric',
      month: 'short'
    })
  }

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto w-full px-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <Star className="size-5 md:size-6 text-yellow-500 fill-yellow-500 shrink-0" />
          <h1 className="text-lg md:text-2xl font-bold tracking-tight truncate">{t.favorites.title}</h1>
          <Badge variant="secondary" className="rounded-md font-mono shrink-0">{favorites.length}</Badge>
        </div>

        {favorites.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-4 text-muted-foreground hover:text-destructive transition-colors rounded-lg">
                <Trash className="size-4 mr-2" />
                {t.history.clearAll}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>{t.history.clearAllTitle}</AlertDialogTitle>
                <AlertDialogDescription>{t.history.clearAllDesc}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">{t.common.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={clearAllFavorites} className="bg-destructive text-destructive-foreground rounded-xl">
                  {t.common.delete}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Main Container */}
      <LayoutGroup>
        <div className="bg-card border rounded-2xl flex flex-col flex-1 min-h-0 overflow-hidden shadow-sm">
          {/* Search */}
          <div className="p-3 border-b bg-muted/20 shrink-0">
            <div className="relative group">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-yellow-500 transition-colors" />
              <Input
                placeholder={t.common.search}
                className="pl-9 h-10 rounded-lg bg-background border-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* List */}
            <motion.div 
              layout
              className={cn(
                "h-full overflow-y-auto custom-scrollbar transition-all duration-300",
                selectedId ? "w-full md:w-[350px] border-r" : "w-full"
              )}
            >
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-12 opacity-50">
                  <Heart className="size-10 mb-4" />
                  <p className="text-sm font-medium">{t.favorites.noFavorites}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filtered.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={cn(
                        "p-4 cursor-pointer transition-colors relative group",
                        selectedId === item.id 
                          ? "bg-yellow-500/[0.03] shadow-[inset_3px_0_0_0_hsl(var(--yellow-500))]" 
                          : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          {item.mode === 'file' && <FileArrowUp className="size-3 text-muted-foreground/50 shrink-0" />}
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {item.sourceLang === "Auto Detect" ? "AUTO" : item.sourceLang.slice(0, 2).toUpperCase()}
                          </span>
                          <CaretRight className="size-3 text-muted-foreground/30" />
                          <span className="text-[10px] font-bold text-primary">
                            {item.targetLang.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[10px] tabular-nums text-muted-foreground/50">
                          {formatTime(item.timestamp)}
                        </span>
                      </div>
                      <p className={cn(
                        "text-sm",
                        item.mode === 'file' ? "line-clamp-1 font-medium text-muted-foreground" : "line-clamp-2",
                        selectedId === item.id ? "font-semibold text-foreground" : "text-foreground/80"
                      )}>
                        {item.mode === 'file' && item.fileName ? item.fileName : item.sourceText}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Detail */}
            <AnimatePresence mode="wait">
              {selectedId && selectedItem && (
                <motion.div
                  key={selectedId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="hidden md:flex flex-1 flex-col h-full bg-background/50"
                >
                  {/* Header */}
                  <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-md">{selectedItem.sourceLang}</Badge>
                      <CaretRight className="size-4 text-muted-foreground" />
                      <Badge className="rounded-md bg-yellow-500 hover:bg-yellow-600 border-none text-white">{selectedItem.targetLang}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 rounded-lg text-destructive"
                        onClick={() => removeFavorite(selectedId)}
                      >
                        <Trash className="size-4" />
                      </Button>
                      <div className="w-px h-4 bg-border mx-2" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 rounded-lg"
                        onClick={() => setSelectedId(null)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-8 space-y-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t.history.source}</label>
                        {selectedItem.mode === 'file' && selectedItem.fileName && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <FileArrowUp className="size-3.5" />
                            <span className="font-medium">{selectedItem.fileName}</span>
                          </div>
                        )}
                        <div className="text-lg leading-relaxed text-foreground/70 break-words">
                          {selectedItem.sourceText}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-yellow-600">{t.history.target}</label>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-[10px] font-bold rounded-md px-2"
                            onClick={() => copyToClipboard(selectedItem.translatedText)}
                          >
                            <Copy className="size-3 mr-1.5" />
                            {t.common.copy}
                          </Button>
                        </div>
                        <div className="text-3xl font-bold leading-tight text-foreground break-words tracking-tight">
                          {selectedItem.translatedText}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="p-6 border-t shrink-0">
                    <Button
                      onClick={() => restoreItem(selectedItem)}
                      className="w-full h-12 rounded-xl gap-2 font-bold bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20 transition-all group border-none"
                    >
                      <ArrowSquareOut className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      {t.history.openInTranslator}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile View */}
            <AnimatePresence>
              {selectedId && selectedItem && (
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  className="fixed inset-0 z-50 bg-background md:hidden flex flex-col"
                >
                  <div className="p-4 border-b flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)}>
                      <X className="size-5" />
                    </Button>
                    <span className="font-bold text-sm">{formatTime(selectedItem.timestamp)}</span>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeFavorite(selectedId)}>
                      <Trash className="size-5" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <div className="space-y-2">
                      <Badge variant="outline">{selectedItem.sourceLang} → {selectedItem.targetLang}</Badge>
                      {selectedItem.mode === 'file' && selectedItem.fileName && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <FileArrowUp className="size-3.5" />
                          <span className="font-medium">{selectedItem.fileName}</span>
                        </div>
                      )}
                      <p className="text-lg text-foreground/60 leading-relaxed">{selectedItem.sourceText}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-600">{t.history.target}</p>
                      <p className="text-3xl font-bold leading-tight">{selectedItem.translatedText}</p>
                    </div>
                  </div>
                  <div className="p-4 border-t grid grid-cols-2 gap-3 pb-safe">
                    <Button variant="outline" className="h-12 rounded-xl" onClick={() => restoreItem(selectedItem)}>
                      {t.history.openInTranslator}
                    </Button>
                    <Button className="h-12 rounded-xl bg-yellow-500 text-white border-none" onClick={() => copyToClipboard(selectedItem.translatedText)}>
                      {t.common.copy}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </LayoutGroup>
    </div>
  )
}
