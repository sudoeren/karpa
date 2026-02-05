"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Search, Trash2, ArrowRight, Star, Copy, ExternalLink, Heart
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
  const { t } = useLanguage()

  useEffect(() => {
    const saved = localStorage.getItem("translation-favorites")
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setFavorites(JSON.parse(saved))
  }, [])

  const removeFavorite = (id: string) => {
    const newFavorites = favorites.filter(item => item.id !== id)
    setFavorites(newFavorites)
    localStorage.setItem("translation-favorites", JSON.stringify(newFavorites))
    toast.info(t.favorites.removed)
  }

  const copyToClipboard = async (text: string) => {
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 backdrop-blur-xl border border-yellow-500/20 rounded-full mb-2">
          <Star className="size-4 text-yellow-500 fill-yellow-500" />
          <span className="text-sm font-medium">{t.favorites.title}</span>
          <Badge variant="secondary" className="ml-1 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
            {favorites.length}
          </Badge>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 max-w-4xl mx-auto w-full min-h-0"
      >
        <div className="h-full bg-card/50 backdrop-blur-xl border rounded-3xl overflow-hidden flex flex-col">
          {/* Search & Actions */}
          <div className="flex items-center gap-3 p-4 border-b">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={t.common.search + "..."}
                className="pl-10 h-10 rounded-xl bg-muted/50 border-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {favorites.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl gap-2 text-muted-foreground hover:text-destructive">
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
                    <AlertDialogAction onClick={clearAllFavorites} className="bg-destructive text-destructive-foreground">
                      {t.common.delete}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="p-4 rounded-full bg-yellow-500/10 mb-4">
                  <Heart className="size-8 text-yellow-500" />
                </div>
                <h3 className="font-medium mb-1">{t.favorites.noFavorites}</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {search ? t.history.tryDifferent : t.favorites.noFavoritesDesc}
                </p>
                <Button
                  variant="outline"
                  className="mt-4 rounded-xl"
                  onClick={() => router.push("/")}
                >
                  {t.favorites.goToTranslator}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <AnimatePresence>
                  {filtered.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative bg-gradient-to-br from-card to-muted/30 border rounded-2xl p-4 hover:shadow-lg hover:border-yellow-500/30 transition-all"
                    >
                      {/* Star indicator */}
                      <div className="absolute top-3 right-3">
                        <Star className="size-4 text-yellow-500 fill-yellow-500" />
                      </div>

                      {/* Language badges */}
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                          {item.sourceLang.slice(0, 2).toUpperCase()}
                        </Badge>
                        <ArrowRight className="size-3 text-muted-foreground" />
                        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 bg-primary/5">
                          {item.targetLang.slice(0, 2).toUpperCase()}
                        </Badge>
                      </div>

                      {/* Content */}
                      <div className="space-y-3 mb-4 flex-1 overflow-hidden">
                        <div className="max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                            {t.favorites.original}
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{item.sourceText}</p>
                        </div>
                        <div className="max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                            {t.translator.translation}
                          </p>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.translatedText}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-3 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 h-8 rounded-lg text-xs gap-1.5"
                          onClick={() => copyToClipboard(item.translatedText)}
                        >
                          <Copy className="size-3" />
                          {t.common.copy}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 h-8 rounded-lg text-xs gap-1.5"
                          onClick={() => restoreItem(item)}
                        >
                          <ExternalLink className="size-3" />
                          {t.common.open}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg text-muted-foreground hover:text-destructive"
                          onClick={() => removeFavorite(item.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
