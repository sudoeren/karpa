"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  ArrowRightLeft, Loader2, Copy, Check, Volume2, X, Star,
  UploadCloud, Download, FileText, Trash, Languages
}
from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { SidebarTrigger } from "@/components/ui/sidebar"
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

const languages = ["English", "Turkish", "Spanish", "French", "German", "Italian", "Portuguese", "Russian", "Japanese", "Chinese", "Korean", "Arabic"]

function TranslatorWorkspace() {
  const searchParams = useSearchParams()
  
  const [view, setView] = useState<"text" | "file">("text")
  
  // Text Mode State
  const [sourceText, setSourceText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  
  // File Mode State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState("")
  const [translatedFileContent, setTranslatedFileContent] = useState("")
  
  // Shared State
  const [sourceLanguage, setSourceLanguage] = useState("Auto Detect")
  const [targetLanguage, setTargetLanguage] = useState("English")
  const [tone, setTone] = useState("standard")
  const [loading, setLoading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  
  const sourceInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore from URL params if available
  useEffect(() => {
    const text = searchParams.get("text")
    const translation = searchParams.get("translation")
    const src = searchParams.get("sourceLang")
    const tgt = searchParams.get("targetLang")

    if (text) setSourceText(decodeURIComponent(text))
    if (translation) setTranslatedText(decodeURIComponent(translation))
    if (src) setSourceLanguage(src)
    if (tgt) setTargetLanguage(tgt)
  }, [searchParams])

  // Save to History Logic (Simplified access to localStorage)
  const addToHistory = (item: TranslationItem) => {
      const savedH = localStorage.getItem("translation-history")
      let history: TranslationItem[] = savedH ? JSON.parse(savedH) : []
      history = [item, ...history].slice(0, 100)
      localStorage.setItem("translation-history", JSON.stringify(history))
  }
  
  const addToFavorites = (item: TranslationItem) => {
      const savedF = localStorage.getItem("translation-favorites")
      let favorites: TranslationItem[] = savedF ? JSON.parse(savedF) : []
      
      if (!favorites.some(f => f.translatedText === item.translatedText)) {
          favorites = [{...item, isFavorite: true}, ...favorites]
          localStorage.setItem("translation-favorites", JSON.stringify(favorites))
          toast.success("Saved to favorites")
      } else {
          toast.info("Already in favorites")
      }
  }

  // Ctrl+Enter Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!loading) {
            if (view === "text" && sourceText.trim()) handleTranslate();
            if (view === "file" && selectedFile) handleTranslate();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sourceText, selectedFile, loading, tone, view]);

  const handleTranslate = async () => {
    const textToTranslate = view === "text" ? sourceText : fileContent;
    
    if (!textToTranslate.trim()) return
    setLoading(true)
    
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToTranslate,
          targetLanguage: targetLanguage,
          tone: tone !== "standard" ? tone : undefined
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed")

      if (view === "text") {
          setTranslatedText(data.translation)
      } else {
          setTranslatedFileContent(data.translation)
      }

      const previewText = textToTranslate.substring(0, 150) + (textToTranslate.length > 150 ? "..." : "")
      const newEntry: TranslationItem = {
        id: Date.now().toString(),
        sourceText: previewText, 
        translatedText: data.translation.substring(0, 150) + "...", 
        sourceLang: sourceLanguage, 
        targetLang: targetLanguage, 
        timestamp: Date.now(), 
        tone
      }
      addToHistory(newEntry)
      
      if (view === "file") {
          toast.success("File translated")
      }

    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const validExtensions = ['.txt', '.md', '.json', '.csv', '.srt', '.js', '.ts', '.py', '.html', '.css', '.xml']
      const isExtensionValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))

      if (!isExtensionValid && !file.type.startsWith('text/')) {
          toast.error("Text files only")
          return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
          const content = event.target?.result as string
          setFileContent(content)
          setSelectedFile(file)
          setTranslatedFileContent("") 
      }
      reader.readAsText(file)
  }

  const handleDownload = () => {
      if (!translatedFileContent || !selectedFile) return
      
      const blob = new Blob([translatedFileContent], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      
      const nameParts = selectedFile.name.split('.')
      const ext = nameParts.pop()
      const name = nameParts.join('.')
      const targetCode = targetLanguage === "English" ? "en" : targetLanguage.substring(0, 2).toLowerCase()
      
      a.href = url
      a.download = `${name}_${targetCode}.${ext}`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success("Downloaded")
  }

  const copyToClipboard = async (text: string) => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
    toast.success("Copied")
  }

  const handleSpeak = (text: string, lang: string) => {
    if (!text) return
    const u = new SpeechSynthesisUtterance(text)
    const m: any = { "English": "en-US", "Turkish": "tr-TR", "Spanish": "es-ES", "French": "fr-FR", "German": "de-DE" }
    u.lang = m[lang] || "en-US"
    window.speechSynthesis.speak(u)
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
        
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            
            <div className="flex flex-1 items-center justify-between">
                
                {/* Mode Switcher */}
                <div className="flex bg-muted/50 p-1 rounded-lg">
                    <button 
                        onClick={() => setView("text")}
                        className={cn("px-3 py-1 rounded-md text-sm font-medium transition-all", view === "text" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
                    >
                        Text
                    </button>
                    <button 
                        onClick={() => setView("file")}
                        className={cn("px-3 py-1 rounded-md text-sm font-medium transition-all", view === "file" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
                    >
                        File
                    </button>
                </div>

                {/* Translate Controls */}
                <div className="flex items-center gap-2">
                    <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger className="w-[120px] text-xs h-9">
                            <span className="text-muted-foreground mr-1">Tone:</span>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="formal">Formal</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="technical">Technical</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    <Button 
                        onClick={handleTranslate} 
                        disabled={loading || (!sourceText.trim() && !selectedFile)}
                        className="h-9 px-4"
                    >
                        {loading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                        Translate
                    </Button>
                </div>
            </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 overflow-hidden p-4 md:p-6 bg-muted/10">
            
            {/* TEXT MODE */}
            {view === "text" && (
                <div className="h-full flex flex-col gap-4">
                    {/* Language Bar */}
                    <div className="flex items-center justify-between gap-4 px-2">
                        <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                            <SelectTrigger className="w-[180px] font-semibold h-10 bg-background border-border">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Auto Detect">Auto Detect</SelectItem>
                                {languages.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => {
                                if(sourceLanguage !== "Auto Detect") {
                                setSourceLanguage(targetLanguage); setTargetLanguage(sourceLanguage);
                                setSourceText(translatedText); setTranslatedText(sourceText);
                            }
                        }}>
                            <ArrowRightLeft className="w-4 h-4" />
                        </Button>

                        <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                            <SelectTrigger className="w-[180px] font-semibold h-10 bg-background border-border">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {languages.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
                         {/* Source */}
                         <div className="flex flex-col rounded-xl border bg-background shadow-sm overflow-hidden relative group">
                              <Textarea 
                                  ref={sourceInputRef}
                                  value={sourceText}
                                  onChange={(e) => setSourceText(e.target.value)}
                                  placeholder="Enter text..."
                                  className="flex-1 w-full resize-none border-none focus-visible:ring-0 p-6 text-lg leading-relaxed"
                                  spellCheck={false}
                              />
                              <div className="p-2 flex justify-between items-center bg-muted/5 border-t">
                                  <span className="text-xs text-muted-foreground px-2">{sourceText.length} chars</span>
                                  <div className="flex gap-1">
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSpeak(sourceText, sourceLanguage)}><Volume2 className="w-4 h-4" /></Button>
                                      {sourceText && <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => setSourceText("")}><X className="w-4 h-4" /></Button>}
                                  </div>
                              </div>
                         </div>

                         {/* Target */}
                         <div className="flex flex-col rounded-xl border bg-muted/20 shadow-sm overflow-hidden relative">
                              {loading && (
                                    <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                        <div className="flex items-center gap-2 bg-background px-4 py-2 rounded-full shadow border animate-in fade-in zoom-in">
                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                            <span className="text-sm font-medium">Translating...</span>
                                        </div>
                                    </div>
                              )}
                              <Textarea 
                                  value={translatedText}
                                  readOnly
                                  placeholder="Translation..."
                                  className="flex-1 w-full resize-none border-none focus-visible:ring-0 p-6 text-lg leading-relaxed bg-transparent"
                              />
                              <div className="p-2 flex justify-end items-center bg-muted/5 border-t">
                                  <div className="flex gap-1">
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSpeak(translatedText, targetLanguage)}><Volume2 className="w-4 h-4" /></Button>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(translatedText)}>
                                          {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                      </Button>
                                      {translatedText && (
                                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-yellow-500" onClick={() => addToFavorites({
                                              id: Date.now().toString(), sourceText, translatedText, sourceLang: sourceLanguage, targetLang: targetLanguage, timestamp: Date.now(), tone
                                          })}>
                                              <Star className="w-4 h-4" />
                                          </Button>
                                      )}
                                  </div>
                              </div>
                         </div>
                    </div>
                </div>
            )}

            {/* FILE MODE */}
            {view === "file" && (
                <div className="flex-1 flex flex-col items-center justify-center">
                     {!selectedFile ? (
                        <div 
                            className="w-full max-w-lg border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-muted/50 hover:border-primary transition-colors bg-background"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="p-4 bg-muted rounded-full">
                                <UploadCloud className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-semibold">Upload a file</h3>
                                <p className="text-sm text-muted-foreground">Drag and drop or click to browse</p>
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.md,.json,.csv,.srt,.js,.ts,.py,.html,.css,.xml" onChange={handleFileUpload} />
                        </div>
                     ) : (
                        <div className="w-full max-w-5xl grid grid-cols-2 gap-6 h-full">
                            <div className="bg-background rounded-xl border shadow-sm flex flex-col overflow-hidden">
                                <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded"><FileText className="w-4 h-4 text-primary" /></div>
                                        <div>
                                            <p className="text-sm font-medium">{selectedFile.name}</p>
                                            <p className="text-xs text-muted-foreground">{fileContent.length} chars</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => {setSelectedFile(null); setFileContent(""); setTranslatedFileContent("")}}><Trash className="w-4 h-4" /></Button>
                                </div>
                                <div className="flex-1 p-4 overflow-auto font-mono text-xs bg-muted/5">
                                    {fileContent.substring(0, 5000)}...
                                </div>
                            </div>

                            <div className="bg-background rounded-xl border shadow-sm flex flex-col overflow-hidden relative">
                                {loading && (
                                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    </div>
                                )}
                                <div className="p-4 border-b flex items-center justify-between bg-green-500/5">
                                    <p className="text-sm font-medium text-green-700">Translated File</p>
                                    {translatedFileContent && (
                                        <Button size="sm" onClick={handleDownload} className="h-8 text-xs bg-green-600 hover:bg-green-500 text-white">
                                            <Download className="w-3 h-3 mr-2" /> Download
                                        </Button>
                                    )}
                                </div>
                                <div className="flex-1 p-4 overflow-auto font-mono text-xs bg-green-500/5">
                                    {translatedFileContent || <span className="text-muted-foreground italic">Ready to translate...</span>}
                                </div>
                            </div>
                        </div>
                     )}
                </div>
            )}
        </div>
    </div>
  )
}

export default function Home() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <TranslatorWorkspace />
        </Suspense>
    )
}