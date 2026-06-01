"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  ArrowRightLeft, Loader2, Copy, Check, Volume2, VolumeX, X, Star,
  Languages, Sparkles, Wand2, FileUp, Upload, Download, Info, History, Calendar, Trash2, ArrowRight, ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"
import { motion, AnimatePresence } from "framer-motion"
import { Logo } from "@/components/logo"
import { useTTS } from "@/hooks/use-tts"
import { MarkdownViewer } from "@/components/markdown-viewer"
import { useOnboarding } from "@/contexts/onboarding-context"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { splitIntoChunks } from "@/lib/utils"

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
  { code: "en", name: "English" },
  { code: "tr", name: "Turkish" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
]

const tones = [
  { value: "standard", labelKey: "standard" as const },
  { value: "formal", labelKey: "formal" as const },
  { value: "casual", labelKey: "casual" as const },
  { value: "technical", labelKey: "technical" as const },
]

function TranslatorWorkspace() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t, language } = useLanguage()
  const { targetLanguage: defaultTargetLang } = useOnboarding()

  const [mode, setMode] = useState<"text" | "file">("text")
  const [sourceText, setSourceText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState("")
  const [translatedFileContent, setTranslatedFileContent] = useState("")
  const [sourceLanguage, setSourceLanguage] = useState("Auto Detect")
  const [targetLanguage, setTargetLanguage] = useState(defaultTargetLang || "English")
  const [tone, setTone] = useState("standard")
  const [loading, setLoading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentChunk, setCurrentChunk] = useState(0)
  const [totalChunks, setTotalChunks] = useState(0)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [history, setHistory] = useState<TranslationItem[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const tts = useTTS()

  useEffect(() => {
    const text = searchParams.get("text")
    const translation = searchParams.get("translation")
    const src = searchParams.get("sourceLang")
    const tgt = searchParams.get("targetLang")

    if (text) setSourceText(decodeURIComponent(text))
    if (translation) setTranslatedText(decodeURIComponent(translation))
    if (src) setSourceLanguage(src)
    if (tgt) setTargetLanguage(tgt)

    const saved = localStorage.getItem("translation-history")
    if (saved) setHistory(JSON.parse(saved))
  }, [searchParams])

  const addToHistory = (item: TranslationItem) => {
    const savedH = localStorage.getItem("translation-history")
    let historyData: TranslationItem[] = savedH ? JSON.parse(savedH) : []
    historyData = [item, ...historyData].slice(0, 100)
    localStorage.setItem("translation-history", JSON.stringify(historyData))
    setHistory(historyData)
  }

  const deleteHistoryItem = (id: string) => {
    const newHistory = history.filter(item => item.id !== id)
    setHistory(newHistory)
    localStorage.setItem("translation-history", JSON.stringify(newHistory))
  }

  const restoreHistoryItem = (item: TranslationItem) => {
    setSourceText(item.sourceText)
    setTranslatedText(item.translatedText)
    setSourceLanguage(item.sourceLang)
    setTargetLanguage(item.targetLang)
    if (item.tone) setTone(item.tone)
    setMode("text")
  }
  const addToFavorites = () => {
    if (!translatedText) return
    const savedF = localStorage.getItem("translation-favorites")
    let favorites: TranslationItem[] = savedF ? JSON.parse(savedF) : []

    const item: TranslationItem = {
      id: Date.now().toString(),
      sourceText,
      translatedText,
      sourceLang: sourceLanguage,
      targetLang: targetLanguage,
      timestamp: Date.now(),
      tone,
      isFavorite: true
    }

    if (!favorites.some(f => f.translatedText === item.translatedText)) {
      favorites = [item, ...favorites]
      localStorage.setItem("translation-favorites", JSON.stringify(favorites))
      toast.success(t.favorites.added)
    } else {
      toast.info(t.favorites.alreadyExists)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!loading && (sourceText.trim() || selectedFile)) {
          handleTranslate()
        }
      }
      if (e.key === 'Escape') setIsHistoryOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceText, selectedFile, loading])

  const handleTranslate = async () => {
    const textToTranslate = mode === "text" ? sourceText : fileContent
    if (!textToTranslate.trim()) return

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setProgress(0)

    try {
      // Use preserveFormatting=true to keep original whitespace/indentation for files
      const chunks = splitIntoChunks(textToTranslate, 2000, true)
      setTotalChunks(chunks.length)

      const translatedChunks: string[] = []

      // Get settings from localStorage
      const savedModel = localStorage.getItem("llm-model") || localStorage.getItem("lm-studio-model")
      const savedUrl = localStorage.getItem("llm-api-url") || localStorage.getItem("lm-studio-url")
      const savedTemp = localStorage.getItem("llm-temperature") || localStorage.getItem("lm-studio-temperature")
      const savedProvider = localStorage.getItem("llm-provider") || "lmstudio"
      const savedApiKey = sessionStorage.getItem("llm-api-key")

      for (let i = 0; i < chunks.length; i++) {
        setCurrentChunk(i + 1)

        // Skip API call for whitespace-only chunks to save time (though API handles it too)
        if (!chunks[i].trim()) {
          translatedChunks.push(chunks[i]);
          setProgress(Math.round(((i + 1) / chunks.length) * 100));
          continue;
        }

        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: chunks[i],
            targetLanguage,
            sourceLanguage: sourceLanguage !== "Auto Detect" ? sourceLanguage : undefined,
            tone: tone !== "standard" ? tone : undefined,
            model: savedModel,
            apiUrl: savedUrl,
            temperature: savedTemp ? parseFloat(savedTemp) : undefined,
            provider: savedProvider,
            apiKey: savedApiKey || undefined,
          }),
          signal: abortControllerRef.current.signal,
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Failed")

        translatedChunks.push(data.translation)
        setProgress(Math.round(((i + 1) / chunks.length) * 100))
      }

      // Join with empty string because separators are preserved in chunks
      const fullTranslation = translatedChunks.join("")

      if (mode === "text") {
        setTranslatedText(fullTranslation)
      } else {
        setTranslatedFileContent(fullTranslation)
        toast.success(t.translator.fileTranslated)
      }

      const newEntry: TranslationItem = {
        id: Date.now().toString(),
        sourceText: textToTranslate,
        translatedText: fullTranslation,
        sourceLang: sourceLanguage,
        targetLang: targetLanguage,
        timestamp: Date.now(),
        tone
      }
      addToHistory(newEntry)

      // Reset source language to Auto Detect but KEEP the selected target language
      setSourceLanguage("Auto Detect")

      // Notify user
      const notificationsEnabled = localStorage.getItem("localce-notifications") === "true"
      if (notificationsEnabled && document.hidden) {
        if (Notification.permission === 'granted') {
          new Notification("Localce", {
            body: t.translator.fileTranslated,
            icon: "/logo.png"
          })
        }

        const soundEnabled = localStorage.getItem("localce-notification-sound") !== "false"
        if (soundEnabled) {
          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3")
          audio.volume = 0.5
          audio.play().catch(() => { })
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        toast.info(t.translator.cancelled)
      } else {
        toast.error((err as Error).message)
      }
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }

  const handleCancelTranslation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const processFile = (file: File) => {
    const validExtensions = ['.txt', '.md', '.json', '.csv', '.srt', '.js', '.ts', '.py', '.html', '.css', '.xml']
    const isExtensionValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))

    if (!isExtensionValid && !file.type.startsWith('text/')) {
      toast.error(t.translator.unsupportedWarning)
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleDownload = () => {
    if (!translatedFileContent || !selectedFile) return
    const blob = new Blob([translatedFileContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    const nameParts = selectedFile.name.split('.')
    const ext = nameParts.pop()
    const name = nameParts.join('.')
    const targetCode = languages.find(l => l.name === targetLanguage)?.code || targetLanguage.substring(0, 2).toLowerCase()
    a.href = url
    a.download = `${name}_${targetCode}.${ext}`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success(t.common.download)
  }

  const copyToClipboard = async (text: string) => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
    toast.success(t.common.copied)
  }

  const handleSpeak = (text: string, lang: string) => {
    if (!text) return
    if (tts.isSpeaking) {
      tts.stop()
    } else {
      tts.speak(text, lang)
    }
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
    <div className="h-full flex flex-col items-center overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6 relative w-full max-w-4xl shrink-0"
      >
        <div className="flex items-center justify-center gap-3 mb-1">
          <Logo size={32} />
          <h1 className="text-xl font-bold">Localce</h1>
        </div>
        <p className="text-xs text-muted-foreground">{t.translator.title}</p>

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 rounded-full gap-2 h-9",
            isHistoryOpen && "text-primary bg-primary/10"
          )}
          onClick={() => setIsHistoryOpen(true)}
        >
          <History className="size-4" />
          <span className="hidden sm:inline text-xs">{t.history.title}</span>
        </Button>
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl flex-1 min-h-0"
      >
        <div className="h-full bg-card/50 backdrop-blur-xl border rounded-[32px] overflow-hidden flex flex-col">
          {/* Mode Toggle & Controls */}
          <div className="flex flex-col md:flex-row items-center gap-4 p-4 border-b bg-muted/30 shrink-0 relative">
            {/* Mode Toggle - Left on desktop */}
            <div className="flex bg-muted rounded-xl p-1 md:absolute md:left-4 shrink-0">
              <button
                onClick={() => setMode("text")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  mode === "text"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Languages className="size-3.5" />
                <span className="hidden xs:inline">{t.translator.textMode}</span>
                <span className="xs:hidden">Text</span>
              </button>
              <button
                onClick={() => setMode("file")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  mode === "file"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileUp className="size-3.5" />
                <span className="hidden xs:inline">{t.translator.fileMode}</span>
                <span className="xs:hidden">File</span>
              </button>
            </div>

            {/* Language Controls - Centered */}
            <div className="flex flex-wrap items-center justify-center gap-2 w-full px-32">
              <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                <SelectTrigger className="w-[150px] sm:w-[180px] h-9 rounded-xl bg-background/50 text-xs font-semibold border-transparent shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Auto Detect">
                    <span className="flex items-center gap-2">
                      <Sparkles className="size-3" />
                      {t.translator.autoDetect}
                    </span>
                  </SelectItem>
                  {languages.map(l => (
                    <SelectItem key={l.code} value={l.name}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-xl shrink-0 hover:bg-background/50 transition-colors"
                onClick={swapLanguages}
                disabled={sourceLanguage === "Auto Detect"}
              >
                <ArrowRightLeft className="size-4" />
              </Button>

              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger className="w-[120px] sm:w-[140px] h-9 rounded-xl bg-background/50 text-xs font-semibold border-transparent shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(l => (
                    <SelectItem key={l.code} value={l.name}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tone Selection - Right on desktop */}
            <div className="md:absolute md:right-4 shrink-0">
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="w-[110px] sm:w-[130px] h-9 rounded-xl bg-background/50 text-xs font-semibold border-transparent shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tones.map(t2 => (
                    <SelectItem key={t2.value} value={t2.value}>
                      {t.translator[t2.labelKey]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <AnimatePresence mode="wait">
              {mode === "text" ? (
                <motion.div
                  key="text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x overflow-hidden"
                >
                  {/* Source */}
                  <div className="relative h-full flex flex-col">
                    <Textarea
                      value={sourceText}
                      onChange={(e) => setSourceText(e.target.value)}
                      placeholder={t.translator.enterText}
                      className="flex-1 resize-none border-none focus-visible:ring-0 rounded-none p-6 text-lg bg-transparent custom-scrollbar"
                      spellCheck={false}
                    />
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-t from-card/90 to-transparent shrink-0">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {sourceText.length} {t.translator.characters}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "size-9 rounded-xl transition-colors",
                            tts.isSpeaking && "text-primary bg-primary/10"
                          )}
                          onClick={() => handleSpeak(sourceText, sourceLanguage)}
                          disabled={!sourceText || !tts.isSupported}
                        >
                          {tts.isSpeaking ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                        </Button>
                        {sourceText && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 rounded-xl hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setSourceText("")}
                          >
                            <X className="size-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Target */}
                  <div className="relative bg-muted/10 h-full flex flex-col">
                    {loading && (
                      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-center justify-center p-6 text-center">
                        <div className="w-full max-w-xs space-y-4">
                          <div className="flex items-center justify-center gap-3 mb-2">
                            <Loader2 className="size-5 animate-spin text-primary" />
                            <span className="font-bold">{t.translator.translating}</span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                          <div className="flex justify-between text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                            <span>{progress}%</span>
                            {totalChunks > 1 && <span>{currentChunk} / {totalChunks}</span>}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 rounded-full h-8 text-[10px] font-bold uppercase tracking-widest"
                            onClick={handleCancelTranslation}
                          >
                            {t.common.cancel}
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="flex-1 p-6 h-full overflow-y-auto custom-scrollbar">
                      {translatedText ? (
                        <MarkdownViewer content={translatedText} className="text-lg leading-relaxed" />
                      ) : (
                        <p className="text-muted-foreground italic">{t.translator.translationWillAppear}</p>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-t from-muted/40 to-transparent shrink-0">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {translatedText.length} {t.translator.characters}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "size-9 rounded-xl transition-colors",
                            tts.isSpeaking && "text-primary bg-primary/10"
                          )}
                          onClick={() => handleSpeak(translatedText, targetLanguage)}
                          disabled={!translatedText || !tts.isSupported}
                        >
                          {tts.isSpeaking ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 rounded-xl hover:bg-primary/10"
                          onClick={() => copyToClipboard(translatedText)}
                          disabled={!translatedText}
                        >
                          {isCopied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 rounded-xl hover:text-yellow-500 hover:bg-yellow-500/10"
                          onClick={addToFavorites}
                          disabled={!translatedText}
                        >
                          <Star className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="file"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-8 h-full flex flex-col"
                >
                  {!selectedFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={cn(
                        "flex-1 border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4",
                        isDragging
                          ? "border-primary bg-primary/5 scale-[0.99]"
                          : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30"
                      )}
                    >
                      <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Upload className={cn(
                          "size-8 transition-colors",
                          isDragging ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg">{t.translator.uploadFile}</h3>
                        <p className="text-sm text-muted-foreground">{t.translator.dragDrop}</p>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-4">{t.translator.supportedFormats}</p>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".txt,.md,.json,.csv,.srt,.js,.ts,.py,.html,.css,.xml"
                        onChange={handleFileUpload}
                      />
                    </div>
                  ) : (
                    <div className="space-y-6 flex-1 flex flex-col min-h-0">
                      <div className="flex items-center justify-between p-5 bg-muted/50 rounded-2xl border">
                        <div className="flex items-center gap-4">
                          <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <FileUp className="size-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{selectedFile.name}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              {fileContent.length} {t.translator.characters}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-10 rounded-full hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => {
                            setSelectedFile(null)
                            setFileContent("")
                            setTranslatedFileContent("")
                          }}
                        >
                          <X className="size-5" />
                        </Button>
                      </div>

                      {loading && (
                        <div className="p-8 bg-muted/30 border rounded-3xl space-y-6">
                          <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.2em]">
                            <div className="flex items-center gap-3 text-primary">
                              <Loader2 className="size-4 animate-spin" />
                              <span>{t.translator.translating}</span>
                            </div>
                            <span className="text-muted-foreground">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                          {totalChunks > 1 && (
                            <p className="text-center text-[10px] font-bold text-muted-foreground tracking-widest">
                              {currentChunk} / {totalChunks}
                            </p>
                          )}
                        </div>
                      )}

                      {translatedFileContent && (
                        <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-[24px] mt-auto">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-xs font-black uppercase tracking-widest text-green-600 dark:text-green-400">
                                {t.translator.translatedFile}
                              </p>
                              <p className="text-sm font-medium opacity-70">Ready for download</p>
                            </div>
                            <Button
                              size="lg"
                              onClick={handleDownload}
                              className="bg-green-600 hover:bg-green-500 rounded-xl px-8 font-bold shadow-lg shadow-green-500/20"
                            >
                              <Download className="size-4 mr-2" />
                              {t.common.download}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {mode === "file" && !selectedFile && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 shrink-0"
                    >
                      <Alert className="bg-primary/5 border-primary/20 rounded-[20px]">
                        <Info className="size-4 text-primary" />
                        <AlertTitle className="text-xs font-black uppercase tracking-widest text-primary">
                          {t.translator.unsupportedNote}
                        </AlertTitle>
                        <AlertDescription className="text-xs">
                          {t.translator.unsupportedWarning}
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Translate Button */}
          <div className="p-4 border-t bg-muted/20 shrink-0">
            {loading ? (
              <Button
                onClick={handleCancelTranslation}
                variant="destructive"
                className="w-full h-16 rounded-[24px] text-base font-bold gap-3 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                size="lg"
              >
                <X className="size-5" />
                {t.common.cancel}
              </Button>
            ) : (
              <Button
                onClick={handleTranslate}
                disabled={mode === "text" ? !sourceText.trim() : !selectedFile}
                className={cn(
                  "w-full h-16 rounded-[24px] font-black text-lg transition-all duration-500 flex items-center justify-between px-8 group",
                  mode === "text" && !sourceText.trim() || mode === "file" && !selectedFile
                    ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                    : "bg-foreground text-background hover:bg-primary hover:text-white shadow-2xl hover:shadow-primary/30"
                )}
                size="lg"
              >
                <span className="tracking-tight">{t.translator.translate}</span>
                <div className={cn(
                  "size-10 rounded-full flex items-center justify-center transition-all duration-500",
                  mode === "text" && !sourceText.trim() || mode === "file" && !selectedFile
                    ? "bg-muted-foreground/10"
                    : "bg-background/20 group-hover:bg-white group-hover:rotate-[360deg] shadow-lg"
                )}>
                  <Wand2 className={cn(
                    "size-5 transition-colors duration-500",
                    mode === "text" && !sourceText.trim() || mode === "file" && !selectedFile
                      ? "text-muted-foreground"
                      : "text-current group-hover:text-primary"
                  )} />
                </div>
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Floating History Sidebar */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            {/* Floating Panel */}
            <motion.div
              initial={{ opacity: 0, x: 100, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-4 top-4 bottom-4 w-[calc(100%-2rem)] sm:max-w-md z-50 bg-background/95 backdrop-blur-xl border rounded-[32px] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="h-full flex flex-col overflow-hidden">
                <div className="p-6 border-b shrink-0 bg-muted/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <History className="size-5" />
                    </div>
                    <h2 className="text-xl font-bold">{t.history.title}</h2>
                  </div>
                  <Button variant="ghost" size="icon" className="size-10 rounded-full" onClick={() => setIsHistoryOpen(false)}>
                    <X className="size-5" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-12 opacity-30">
                      <History className="size-12 mb-4" />
                      <p className="font-medium">{t.history.noHistory}</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {history.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            restoreHistoryItem(item)
                            setIsHistoryOpen(false)
                          }}
                          className="p-4 rounded-2xl border border-border/50 bg-card/50 hover:bg-muted/50 hover:border-primary/30 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-muted border border-border">
                                {item.sourceLang === "Auto Detect" ? t.translator.autoDetect.toUpperCase() : item.sourceLang.slice(0, 2).toUpperCase()}
                              </div>
                              <ArrowRight className="size-3 opacity-40" />
                              <div className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-primary/10 border border-primary/20 text-primary">
                                {item.targetLang.slice(0, 2).toUpperCase()}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 rounded-full transition-all"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteHistoryItem(item.id)
                              }}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                          <p className="text-sm font-semibold line-clamp-1 mb-1 group-hover:text-primary transition-colors">{item.sourceText}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.translatedText}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-muted/20 border-t shrink-0">
                  <Button
                    variant="outline"
                    className="w-full rounded-xl h-11 font-bold text-xs uppercase tracking-widest"
                    onClick={() => {
                      setIsHistoryOpen(false)
                      router.push("/history")
                    }}
                  >
                    <ExternalLink className="size-3.5 mr-2" />
                    {language === 'tr' ? 'Tüm Geçmişi Gör' : 'View Full History'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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