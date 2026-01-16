"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { ModeToggle } from "@/components/mode-toggle"
import { 
  ArrowRightLeft, 
  Loader2, 
  History, 
  Copy, 
  Check, 
  Volume2, 
  Trash2, 
  X,
  Sparkles,
  Keyboard,
  Search,
  ArrowRight,
  CornerDownLeft
} from "lucide-react"

type TranslationHistory = {
  id: string
  sourceText: string
  translatedText: string
  sourceLang: string
  targetLang: string
  timestamp: number
}

// Helper to get short code (English -> EN)
const getLangCode = (lang: string) => {
    if (lang === "Auto Detect") return "AUTO"
    return lang.substring(0, 2).toUpperCase()
}

export default function Home() {
  const [sourceText, setSourceText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [sourceLanguage, setSourceLanguage] = useState("Auto Detect")
  const [targetLanguage, setTargetLanguage] = useState("English")
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<TranslationHistory[]>([])
  const [historySearch, setHistorySearch] = useState("")
  const [isCopied, setIsCopied] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  
  const sourceInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("translation-history")
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse history", e)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("translation-history", JSON.stringify(history))
  }, [history])

  // Keyboard shortcut: Ctrl + Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (sourceText.trim() && !loading) {
          handleTranslate();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sourceText, loading]);

  const languages = [
    "English", "Turkish", "Spanish", "French", "German", 
    "Italian", "Portuguese", "Russian", "Japanese", 
    "Chinese", "Korean", "Arabic", "Hindi"
  ]

  const handleTranslate = async () => {
    if (!sourceText.trim()) return
    
    setLoading(true)
    if (!translatedText) setTranslatedText("") 

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: sourceText,
          targetLanguage: targetLanguage,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to translate")
      }

      setTranslatedText(data.translation)

      const newEntry: TranslationHistory = {
        id: Date.now().toString(),
        sourceText: sourceText, 
        translatedText: data.translation,
        sourceLang: sourceLanguage,
        targetLang: targetLanguage,
        timestamp: Date.now(),
      }
      
      setHistory(prev => {
          const filtered = prev.filter(item => item.sourceText !== sourceText || item.targetLang !== targetLanguage)
          return [newEntry, ...filtered].slice(0, 100)
      })

    } catch (err: any) {
      toast.error(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleSwapLanguages = () => {
    if (sourceLanguage === "Auto Detect") {
       toast.warning("Select a specific source language to swap")
       return
    }
    setSourceLanguage(targetLanguage)
    setTargetLanguage(sourceLanguage)
    setSourceText(translatedText)
    setTranslatedText(sourceText)
  }

  const copyToClipboard = async (text: string) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      toast.success("Copied")
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      toast.error("Failed to copy")
    }
  }

  const handleSpeak = (text: string, lang: string) => {
    if (!text) return
    const utterance = new SpeechSynthesisUtterance(text)
    const langMap: Record<string, string> = {
        "English": "en-US", "Turkish": "tr-TR", "Spanish": "es-ES",
        "French": "fr-FR", "German": "de-DE", "Italian": "it-IT",
        "Japanese": "ja-JP", "Chinese": "zh-CN", "Russian": "ru-RU"
    }
    utterance.lang = langMap[lang] || "en-US"
    window.speechSynthesis.speak(utterance)
  }

  const clearHistory = () => {
      setHistory([])
      localStorage.removeItem("translation-history")
      toast.success("History cleared")
  }

  const restoreHistoryItem = (item: TranslationHistory) => {
      setSourceText(item.sourceText)
      setTranslatedText(item.translatedText)
      setSourceLanguage(item.sourceLang)
      setTargetLanguage(item.targetLang)
      setIsSheetOpen(false)
      toast.info("Translation restored")
  }

  // Filter history
  const filteredHistory = history.filter(item => 
      item.sourceText.toLowerCase().includes(historySearch.toLowerCase()) || 
      item.translatedText.toLowerCase().includes(historySearch.toLowerCase())
  )

  return (
    <div className="h-screen bg-background text-foreground font-sans flex flex-col overflow-hidden">
      
      {/* Top Navbar */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-background/50 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-md text-primary">
                <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight">localce</span>
        </div>
        
        <div className="flex items-center gap-2">
             <ModeToggle />
             <div className="h-4 w-px bg-border mx-1 hidden sm:block"></div>
             <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                        <History className="w-4 h-4 mr-2" /> History
                    </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[500px] flex flex-col p-0 gap-0 border-l border-border bg-background">
                    
                    {/* History Header */}
                    <div className="p-6 border-b border-border">
                        <SheetHeader className="mb-4">
                            <SheetTitle className="flex items-center justify-between">
                                <span className="text-xl">History</span>
                                {history.length > 0 && (
                                    <Button variant="ghost" size="icon" onClick={clearHistory} className="text-muted-foreground hover:text-destructive h-8 w-8">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </SheetTitle>
                            <SheetDescription>
                                Your recent translations. Click to restore.
                            </SheetDescription>
                        </SheetHeader>
                        
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search history..." 
                                className="pl-9 bg-muted/30 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/20"
                                value={historySearch}
                                onChange={(e) => setHistorySearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* History List */}
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-3">
                            {filteredHistory.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-50">
                                    <History className="w-12 h-12 text-muted-foreground/30" />
                                    <p className="text-sm text-muted-foreground">
                                        {history.length === 0 ? "No translations yet." : "No results found."}
                                    </p>
                                </div>
                            ) : (
                                filteredHistory.map((item) => (
                                    <div 
                                        key={item.id} 
                                        className="group relative p-4 rounded-xl border border-border/40 bg-card hover:bg-muted/40 hover:border-primary/20 transition-all cursor-pointer shadow-sm hover:shadow-md"
                                        onClick={() => restoreHistoryItem(item)}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-1.5">
                                                <Badge variant="outline" className="text-[10px] font-mono font-normal h-5 px-1.5 bg-background/50 text-muted-foreground">
                                                    {getLangCode(item.sourceLang)}
                                                </Badge>
                                                <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                                                <Badge variant="outline" className="text-[10px] font-mono font-normal h-5 px-1.5 bg-primary/5 text-primary border-primary/20">
                                                    {getLangCode(item.targetLang)}
                                                </Badge>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground/60 font-medium">
                                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <p className="text-sm text-foreground/90 leading-snug line-clamp-2 font-medium">
                                                {item.sourceText}
                                            </p>
                                            <p className="text-sm text-muted-foreground leading-snug line-clamp-2">
                                                {item.translatedText}
                                            </p>
                                        </div>

                                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="bg-primary text-primary-foreground p-1.5 rounded-md shadow-sm">
                                                <CornerDownLeft className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:max-w-7xl md:mx-auto w-full">
        
        {/* Toolbar (Language Selection) */}
        <div className="p-4 md:px-6 md:py-4 flex flex-col md:flex-row items-center gap-4 bg-background shrink-0">
             
             {/* Source Lang */}
             <div className="w-full md:w-auto flex-1 md:max-w-[250px]">
                <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                    <SelectTrigger className="h-10 text-base font-medium border-border/60 hover:border-border hover:bg-muted/30 focus:ring-0">
                        <SelectValue placeholder="Detect Language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Auto Detect">Auto Detect</SelectItem>
                        {languages.map(lang => (
                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
             </div>

             {/* Swap Button */}
             <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSwapLanguages}
                className="shrink-0 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground hidden md:flex"
             >
                <ArrowRightLeft className="w-5 h-5" />
             </Button>
             
             {/* Mobile Swap */}
             <div className="flex md:hidden w-full justify-center -my-2 z-10">
                 <Button variant="ghost" size="sm" onClick={handleSwapLanguages}>
                     <ArrowRightLeft className="w-4 h-4" />
                 </Button>
             </div>

             {/* Target Lang */}
             <div className="w-full md:w-auto flex-1 md:max-w-[250px]">
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger className="h-10 text-base font-medium border-border/60 hover:border-border hover:bg-muted/30 focus:ring-0 text-primary">
                        <SelectValue placeholder="Target Language" />
                    </SelectTrigger>
                    <SelectContent>
                        {languages.map(lang => (
                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
             </div>

             {/* Translate Button (Desktop) */}
             <div className="ml-auto hidden md:block">
                 <Button 
                    size="lg" 
                    onClick={handleTranslate} 
                    disabled={loading || !sourceText.trim()}
                    className="h-10 px-6 font-semibold shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
                 >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Translate
                 </Button>
             </div>
        </div>

        {/* Editor Area (Split Pane) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden border-t border-border">
            
            {/* Source Pane */}
            <div className="flex-1 flex flex-col relative group border-b md:border-b-0 md:border-r border-border">
                <Textarea 
                    ref={sourceInputRef}
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Type to translate..."
                    className="flex-1 w-full resize-none border-none focus-visible:ring-0 p-6 text-xl md:text-2xl leading-relaxed bg-background"
                    spellCheck={false}
                />
                
                {/* Source Actions */}
                <div className="absolute bottom-3 left-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleSpeak(sourceText, sourceLanguage)} disabled={!sourceText}>
                        <Volume2 className="w-4 h-4" />
                    </Button>
                    {sourceText && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setSourceText("")}>
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
                
                <div className="absolute bottom-4 right-4 text-xs text-muted-foreground pointer-events-none hidden md:block">
                    {sourceText.length} chars
                </div>
            </div>

            {/* Target Pane */}
            <div className="flex-1 flex flex-col relative group bg-muted/20">
                {loading && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-muted overflow-hidden z-20">
                        <div className="h-full bg-primary animate-progress-indeterminate origin-left"></div>
                    </div>
                )}
                
                <Textarea 
                    value={translatedText}
                    readOnly
                    placeholder="Translation"
                    className="flex-1 w-full resize-none border-none focus-visible:ring-0 p-6 text-xl md:text-2xl leading-relaxed bg-transparent"
                />

                {/* Target Actions */}
                <div className="absolute bottom-3 left-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleSpeak(translatedText, targetLanguage)} disabled={!translatedText}>
                        <Volume2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-green-600" onClick={() => copyToClipboard(translatedText)} disabled={!translatedText}>
                         {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                </div>
            </div>
        </div>

        {/* Mobile Translate Button (Sticky Bottom) */}
        <div className="md:hidden p-4 border-t border-border bg-background">
            <Button 
                size="lg" 
                className="w-full h-12 text-lg"
                onClick={handleTranslate}
                disabled={loading || !sourceText.trim()}
            >
                {loading ? "Translating..." : "Translate"}
            </Button>
        </div>

      </div>

        {/* Footer Info */}
        <div className="h-8 bg-background border-t border-border flex items-center justify-between px-4 text-[10px] text-muted-foreground shrink-0">
            <div className="flex items-center gap-2">
                <span>Model: hy-mt1.5-7b</span>
                <span className="hidden md:inline">•</span>
                <span className="hidden md:inline flex items-center gap-1"><Keyboard className="w-3 h-3" /> Ctrl+Enter to translate</span>
            </div>
            <div>
                 Local • Private • Fast
            </div>
        </div>

    </div>
  )
}
