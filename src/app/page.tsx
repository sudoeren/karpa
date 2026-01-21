"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  ArrowRightLeft, Loader2, Copy, Check, Volume2, X, Star,
  UploadCloud, Download, FileText, Trash, Languages, Sparkles,
  Wand2, FileUp, RefreshCw
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"

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

const languages = [
  { code: "en", name: "English", flag: "GB" },
  { code: "tr", name: "Turkish", flag: "TR" },
  { code: "es", name: "Spanish", flag: "ES" },
  { code: "fr", name: "French", flag: "FR" },
  { code: "de", name: "German", flag: "DE" },
  { code: "it", name: "Italian", flag: "IT" },
  { code: "pt", name: "Portuguese", flag: "PT" },
  { code: "ru", name: "Russian", flag: "RU" },
  { code: "ja", name: "Japanese", flag: "JP" },
  { code: "zh", name: "Chinese", flag: "CN" },
  { code: "ko", name: "Korean", flag: "KR" },
  { code: "ar", name: "Arabic", flag: "SA" },
]

const tones = [
  { value: "standard", label: "Standard", icon: Languages },
  { value: "formal", label: "Formal", icon: FileText },
  { value: "casual", label: "Casual", icon: Sparkles },
  { value: "technical", label: "Technical", icon: Wand2 },
]

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

  // Save to History Logic
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
      toast.success("Added to favorites")
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
        toast.success("File translated successfully")
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
      toast.error("Please upload a text file")
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
    toast.success("File downloaded")
  }

  const copyToClipboard = async (text: string) => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
    toast.success("Copied to clipboard")
  }

  const handleSpeak = (text: string, lang: string) => {
    if (!text) return
    const u = new SpeechSynthesisUtterance(text)
    const m: any = { "English": "en-US", "Turkish": "tr-TR", "Spanish": "es-ES", "French": "fr-FR", "German": "de-DE" }
    u.lang = m[lang] || "en-US"
    window.speechSynthesis.speak(u)
  }

  const swapLanguages = () => {
    if (sourceLanguage !== "Auto Detect") {
      setSourceLanguage(targetLanguage)
      setTargetLanguage(sourceLanguage)
      setSourceText(translatedText)
      setTranslatedText(sourceText)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-svh bg-background">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-2">
                <Languages className="size-4" />
                AI Translator
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="ml-auto flex items-center gap-2">
          {/* Mode Toggle */}
          <div className="flex bg-muted p-1 rounded-lg">
            <button 
              onClick={() => setView("text")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                view === "text" 
                  ? "bg-background shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Languages className="size-4" />
              <span className="hidden sm:inline">Text</span>
            </button>
            <button 
              onClick={() => setView("file")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                view === "file" 
                  ? "bg-background shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileUp className="size-4" />
              <span className="hidden sm:inline">File</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4 p-4 pt-0">
        
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 border-b">
          {/* Language Selection */}
          <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
            <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
              <SelectTrigger className="w-full sm:w-[160px] h-10">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Auto Detect">
                  <span className="flex items-center gap-2">
                    <Sparkles className="size-4" />
                    Auto Detect
                  </span>
                </SelectItem>
                {languages.map(l => (
                  <SelectItem key={l.code} value={l.name}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0 rounded-full"
              onClick={swapLanguages}
              disabled={sourceLanguage === "Auto Detect"}
            >
              <ArrowRightLeft className="size-4" />
            </Button>

            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger className="w-full sm:w-[160px] h-10">
                <SelectValue placeholder="Target" />
              </SelectTrigger>
              <SelectContent>
                {languages.map(l => (
                  <SelectItem key={l.code} value={l.name}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tone & Translate */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="w-full sm:w-[140px] h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tones.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-2">
                      <t.icon className="size-4" />
                      {t.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleTranslate} 
              disabled={loading || (!sourceText.trim() && !selectedFile)}
              className="h-10 px-6 gap-2"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Wand2 className="size-4" />
              )}
              <span className="hidden sm:inline">Translate</span>
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0">
          
          {/* TEXT MODE */}
          {view === "text" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
              {/* Source Panel */}
              <Card className="flex flex-col overflow-hidden border-2 border-transparent focus-within:border-primary/20 transition-colors">
                <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                  <span className="text-sm font-medium text-muted-foreground">Source</span>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-8" 
                      onClick={() => handleSpeak(sourceText, sourceLanguage)}
                      disabled={!sourceText}
                    >
                      <Volume2 className="size-4" />
                    </Button>
                    {sourceText && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-8 hover:text-destructive" 
                        onClick={() => setSourceText("")}
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <CardContent className="flex-1 p-0 relative">
                  <Textarea 
                    ref={sourceInputRef}
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Enter text to translate..."
                    className="absolute inset-0 resize-none border-none focus-visible:ring-0 rounded-none p-4 text-base"
                    spellCheck={false}
                  />
                </CardContent>
                <div className="flex items-center justify-between p-2 border-t bg-muted/20">
                  <span className="text-xs text-muted-foreground px-2">
                    {sourceText.length} characters
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Ctrl+Enter to translate
                  </Badge>
                </div>
              </Card>

              {/* Target Panel */}
              <Card className="flex flex-col overflow-hidden bg-muted/20 relative">
                {loading && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="flex items-center gap-3 bg-background px-4 py-3 rounded-full shadow-lg border">
                      <Loader2 className="size-5 animate-spin text-primary" />
                      <span className="text-sm font-medium">Translating...</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                  <span className="text-sm font-medium text-muted-foreground">Translation</span>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-8" 
                      onClick={() => handleSpeak(translatedText, targetLanguage)}
                      disabled={!translatedText}
                    >
                      <Volume2 className="size-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-8" 
                      onClick={() => copyToClipboard(translatedText)}
                      disabled={!translatedText}
                    >
                      {isCopied ? (
                        <Check className="size-4 text-green-500" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </Button>
                    {translatedText && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-8 hover:text-yellow-500" 
                        onClick={() => addToFavorites({
                          id: Date.now().toString(),
                          sourceText,
                          translatedText,
                          sourceLang: sourceLanguage,
                          targetLang: targetLanguage,
                          timestamp: Date.now(),
                          tone
                        })}
                      >
                        <Star className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <CardContent className="flex-1 p-0 relative">
                  <Textarea 
                    value={translatedText}
                    readOnly
                    placeholder="Translation will appear here..."
                    className="absolute inset-0 resize-none border-none focus-visible:ring-0 rounded-none p-4 text-base bg-transparent"
                  />
                </CardContent>
                <div className="flex items-center justify-between p-2 border-t bg-muted/20">
                  <span className="text-xs text-muted-foreground px-2">
                    {translatedText.length} characters
                  </span>
                  {translatedText && (
                    <Badge variant="secondary" className="text-xs capitalize">
                      {tone}
                    </Badge>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* FILE MODE */}
          {view === "file" && (
            <div className="h-full flex items-center justify-center">
              {!selectedFile ? (
                <Card 
                  className="w-full max-w-lg border-2 border-dashed hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
                    <div className="p-4 rounded-full bg-muted">
                      <UploadCloud className="size-8 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold">Upload a file</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Drag and drop or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Supports .txt, .md, .json, .csv, .srt and more
                      </p>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".txt,.md,.json,.csv,.srt,.js,.ts,.py,.html,.css,.xml" 
                      onChange={handleFileUpload} 
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                  {/* Source File */}
                  <Card className="flex flex-col overflow-hidden">
                    <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="size-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">{fileContent.length} characters</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setSelectedFile(null)
                          setFileContent("")
                          setTranslatedFileContent("")
                        }}
                      >
                        <Trash className="size-4" />
                      </Button>
                    </div>
                    <CardContent className="flex-1 p-4 overflow-auto">
                      <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                        {fileContent.substring(0, 5000)}
                        {fileContent.length > 5000 && "..."}
                      </pre>
                    </CardContent>
                  </Card>

                  {/* Translated File */}
                  <Card className="flex flex-col overflow-hidden bg-muted/20 relative">
                    {loading && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                        <Loader2 className="size-8 animate-spin text-primary" />
                      </div>
                    )}
                    <div className="p-4 border-b bg-green-500/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <FileText className="size-5 text-green-600" />
                        </div>
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">
                          Translated File
                        </p>
                      </div>
                      {translatedFileContent && (
                        <Button 
                          size="sm" 
                          onClick={handleDownload}
                          className="gap-2 bg-green-600 hover:bg-green-500"
                        >
                          <Download className="size-4" />
                          Download
                        </Button>
                      )}
                    </div>
                    <CardContent className="flex-1 p-4 overflow-auto">
                      {translatedFileContent ? (
                        <pre className="text-xs font-mono whitespace-pre-wrap">
                          {translatedFileContent}
                        </pre>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <p className="text-sm italic">Click "Translate" to process the file</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-svh">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    }>
      <TranslatorWorkspace />
    </Suspense>
  )
}
