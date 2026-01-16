"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Trash2, ArrowRight, ArrowLeft, Star } from "lucide-react"
import { toast } from "sonner"

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

  useEffect(() => {
    const saved = localStorage.getItem("translation-favorites")
    if (saved) setFavorites(JSON.parse(saved))
  }, [])

  const removeFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const newFavorites = favorites.filter(item => item.id !== id)
    setFavorites(newFavorites)
    localStorage.setItem("translation-favorites", JSON.stringify(newFavorites))
    toast.info("Removed from favorites")
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
    <div className="flex flex-col h-full bg-background text-foreground">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-background sticky top-0 z-10">
          <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => router.back()} className="md:hidden">
                  <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-lg font-semibold flex items-center gap-2">Favorites <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /></h1>
              <Badge variant="secondary" className="ml-2">{favorites.length}</Badge>
          </div>
          <div className="flex-1 max-w-xl mx-auto px-4">
              <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search favorites..." 
                    className="pl-9 bg-muted/50 border-transparent focus:bg-background focus:border-input transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
              </div>
          </div>
      </header>

      <main className="flex-1 overflow-auto p-6 bg-muted/10">
          <div className="max-w-4xl mx-auto space-y-4">
              {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                      <p>No favorites yet.</p>
                  </div>
              ) : (
                  filtered.map((item) => (
                      <Card key={item.id} className="group hover:shadow-md transition-all cursor-pointer border-transparent hover:border-border" onClick={() => restoreItem(item)}>
                          <CardContent className="p-5 flex flex-col gap-3">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="font-mono">{item.sourceLang}</Badge>
                                      <ArrowRight className="w-3 h-3" />
                                      <Badge variant="outline" className="font-mono text-primary">{item.targetLang}</Badge>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-yellow-500 hover:text-destructive hover:bg-destructive/10" onClick={(e) => removeFavorite(e, item.id)}>
                                          <Star className="w-3.5 h-3.5 fill-current" />
                                      </Button>
                                  </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                  <p className="text-sm leading-relaxed font-medium">{item.sourceText}</p>
                                  <p className="text-sm leading-relaxed text-muted-foreground">{item.translatedText}</p>
                              </div>
                          </CardContent>
                      </Card>
                  ))
              )}
          </div>
      </main>
    </div>
  )
}
