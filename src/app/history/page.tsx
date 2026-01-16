"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Trash2, ArrowRight, ArrowLeft } from "lucide-react"
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
    toast.info("Item deleted")
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

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6 bg-background sticky top-0 z-10">
          <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => router.back()} className="md:hidden">
                  <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-lg font-semibold">History</h1>
              <Badge variant="secondary" className="ml-2">{history.length}</Badge>
          </div>
          <div className="flex-1 max-w-xl mx-auto px-4">
              <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search history..." 
                    className="pl-9 bg-muted/50 border-transparent focus:bg-background focus:border-input transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
              </div>
          </div>
          <div>
              {history.length > 0 && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" /> Clear All
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your translation history.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={clearHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete History
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              )}
          </div>
      </header>

      <main className="flex-1 overflow-auto p-6 bg-muted/10">
          <div className="max-w-4xl mx-auto space-y-4">
              {filteredHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                      <p>No history found.</p>
                  </div>
              ) : (
                  filteredHistory.map((item) => (
                      <Card key={item.id} className="group hover:shadow-md transition-all cursor-pointer border-transparent hover:border-border" onClick={() => restoreItem(item)}>
                          <CardContent className="p-5 flex flex-col gap-3">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="font-mono">{item.sourceLang}</Badge>
                                      <ArrowRight className="w-3 h-3" />
                                      <Badge variant="outline" className="font-mono text-primary">{item.targetLang}</Badge>
                                      {item.tone && <span className="ml-2 px-2 py-0.5 bg-muted rounded-full capitalize">{item.tone}</span>}
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <span>{new Date(item.timestamp).toLocaleString()}</span>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive" onClick={(e) => deleteItem(e, item.id)}>
                                          <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                  </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                  <p className="text-sm leading-relaxed">{item.sourceText}</p>
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
