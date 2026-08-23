"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  ArrowsLeftRight, Spinner, Copy, Check, SpeakerHigh, SpeakerX, X, Star,
  Translate, Sparkle, MagicWand, FileArrowUp, Upload, Download, Info, ClockCounterClockwise, Trash, ArrowRight, ArrowSquareOut,
  File, FileText, FileCode, Table, Subtitles, FileJs, FileHtml, FileCss, CheckCircle, ArrowsClockwise
} from "@phosphor-icons/react"
import { cn, decodeApiKey, safeJSONParse, safeSetItem } from "@/lib/utils"
import { clientTranslate } from "@/lib/client-translate"
import type { ProviderType } from "@/lib/providers"
import { useLanguage } from "@/contexts/language-context"
import { motion, AnimatePresence } from "framer-motion"
import { Logo } from "@/components/logo"
import { useTTS } from "@/hooks/use-tts"
import { MarkdownViewer } from "@/components/markdown-viewer"
import { useOnboarding } from "@/contexts/onboarding-context"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

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
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
  { code: "sv", name: "Swedish" },
  { code: "vi", name: "Vietnamese" },
  { code: "th", name: "Thai" },
  { code: "hi", name: "Hindi" },
  { code: "cs", name: "Czech" },
  { code: "ro", name: "Romanian" },
  { code: "uk", name: "Ukrainian" },
  { code: "el", name: "Greek" },
  { code: "hu", name: "Hungarian" },
  { code: "da", name: "Danish" },
  { code: "fi", name: "Finnish" },
  { code: "id", name: "Indonesian" },
  { code: "bn", name: "Bengali" },
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
  const { t } = useLanguage()
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
  const audioContextRef = useRef<AudioContext | null>(null)
  const tts = useTTS()

  useEffect(() => {
    const text = searchParams.get("text")
    const translation = searchParams.get("translation")
    const src = searchParams.get("sourceLang")
    const tgt = searchParams.get("targetLang")
    const modeParam = searchParams.get("mode")
    const fileName = searchParams.get("fileName")

    if (text) setSourceText(decodeURIComponent(text))
    if (translation) setTranslatedText(decodeURIComponent(translation))
    if (src) setSourceLanguage(src)
    if (tgt) setTargetLanguage(tgt)
    if (modeParam === 'file' && fileName && text) {
      setMode('file')
      setFileContent(decodeURIComponent(text))
      setTranslatedFileContent(decodeURIComponent(translation || ''))
      const fakeFile = new File([decodeURIComponent(text)], fileName, { type: 'text/plain' })
      setSelectedFile(fakeFile)
    }

    const saved = localStorage.getItem("translation-history")
    if (saved) setHistory(safeJSONParse(saved, []))
  }, [searchParams])

  const addToHistory = (item: TranslationItem) => {
    const savedH = localStorage.getItem("translation-history")
    let historyData: TranslationItem[] = safeJSONParse(savedH, [])
    historyData = [item, ...historyData].slice(0, 100)
    safeSetItem("translation-history", JSON.stringify(historyData))
    setHistory(historyData)
  }

  const deleteHistoryItem = (id: string) => {
    const newHistory = history.filter(item => item.id !== id)
    setHistory(newHistory)
    safeSetItem("translation-history", JSON.stringify(newHistory))
  }

  const restoreHistoryItem = (item: TranslationItem) => {
    setSourceText(item.sourceText)
    setTranslatedText(item.translatedText)
    setSourceLanguage(item.sourceLang)
    setTargetLanguage(item.targetLang)
    if (item.tone) setTone(item.tone)
    if (item.mode === 'file' && item.fileName) {
      setMode('file')
      setFileContent(item.sourceText)
      setTranslatedFileContent(item.translatedText)
      const fakeFile = new File([item.sourceText], item.fileName, { type: 'text/plain' })
      setSelectedFile(fakeFile)
    } else {
      setMode('text')
    }
  }
  const addToFavorites = () => {
    if (!translatedText) return
    const savedF = localStorage.getItem("translation-favorites")
    let favorites: TranslationItem[] = safeJSONParse(savedF, [])

    const item: TranslationItem = {
      id: Date.now().toString(),
      sourceText,
      translatedText,
      sourceLang: sourceLanguage,
      targetLang: targetLanguage,
      timestamp: Date.now(),
      tone,
      isFavorite: true,
      mode: mode as 'text' | 'file',
      ...(mode === 'file' && selectedFile ? { fileName: selectedFile.name } : {}),
    }

    if (!favorites.some(f => f.translatedText === item.translatedText)) {
      favorites = [item, ...favorites]
      safeSetItem("translation-favorites", JSON.stringify(favorites))
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

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()

    setLoading(true)
    setProgress(0)
    setCurrentChunk(0)
    setTotalChunks(0)

    try {
      const savedModel = localStorage.getItem("llm-model") || localStorage.getItem("lm-studio-model")
      const savedUrl = localStorage.getItem("llm-api-url") || localStorage.getItem("lm-studio-url")
      const savedTemp = localStorage.getItem("llm-temperature") || localStorage.getItem("lm-studio-temperature")
      const savedProvider = localStorage.getItem("llm-provider") || "lmstudio"
      const savedApiKey = sessionStorage.getItem("llm-api-key")
      const finalApiKey = savedApiKey ? decodeApiKey(savedApiKey) : undefined

      const result = await clientTranslate({
        text: textToTranslate,
        targetLanguage,
        sourceLanguage: sourceLanguage !== "Auto Detect" ? sourceLanguage : undefined,
        tone: tone !== "standard" ? tone : undefined,
        model: savedModel || undefined,
        apiUrl: savedUrl || undefined,
        temperature: savedTemp ? parseFloat(savedTemp) : undefined,
        provider: (savedProvider as ProviderType) || "lmstudio",
        apiKey: finalApiKey,
        preserveFormatting: true,
        signal: abortControllerRef.current.signal,
        onProgress: (current, total) => {
          setCurrentChunk(current)
          setTotalChunks(total)
          setProgress(Math.round((current / total) * 100))
        },
      })

      const fullTranslation = result.translation

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
        tone,
        mode: mode as 'text' | 'file',
        ...(mode === 'file' && selectedFile ? { fileName: selectedFile.name } : {}),
      }
      addToHistory(newEntry)

      setSourceLanguage("Auto Detect")

      const notificationsEnabled = localStorage.getItem("karpa-notifications") === "true"
      if (notificationsEnabled) {
        if (Notification.permission === 'granted') {
          new Notification("Karpa", {
            body: t.translator.fileTranslated,
            icon: "/logo.png"
          })
        }

        const soundEnabled = localStorage.getItem("karpa-notification-sound") !== "false"
        if (soundEnabled) {
          try {
            if (!audioContextRef.current) {
              audioContextRef.current = new AudioContext()
            }
            const ctx = audioContextRef.current
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.frequency.value = 880
            osc.type = "sine"
            gain.gain.setValueAtTime(0.3, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
            osc.start(ctx.currentTime)
            osc.stop(ctx.currentTime + 0.3)
          } catch {}
        }
      } else if (document.hidden && Notification.permission === 'granted') {
        new Notification("Karpa", {
          body: t.translator.fileTranslated,
          icon: "/logo.png"
        })
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
      const result = event.target?.result
      if (typeof result !== 'string') return
      setFileContent(result)
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
    const BOM = "\uFEFF"
    const blob = new Blob([BOM + translatedFileContent], { type: 'text/plain;charset=utf-8' })
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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileTypeInfo = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
    const map: Record<string, { icon: React.ComponentType<{ className?: string }>, color: string, label: string }> = {
      md: { icon: FileText, color: "text-blue-500", label: "MD" },
      txt: { icon: FileText, color: "text-blue-400", label: "TXT" },
      json: { icon: FileCode, color: "text-yellow-500", label: "JSON" },
      csv: { icon: Table, color: "text-green-500", label: "CSV" },
      srt: { icon: Subtitles, color: "text-purple-500", label: "SRT" },
      js: { icon: FileJs, color: "text-amber-500", label: "JS" },
      ts: { icon: FileCode, color: "text-cyan-500", label: "TS" },
      py: { icon: FileCode, color: "text-blue-500", label: "PY" },
      html: { icon: FileHtml, color: "text-orange-500", label: "HTML" },
      css: { icon: FileCss, color: "text-sky-500", label: "CSS" },
      xml: { icon: FileCode, color: "text-amber-400", label: "XML" },
    }
    return map[ext] ?? { icon: File, color: "text-muted-foreground", label: ext.toUpperCase() || "FILE" }
  }

  const getLineCount = (content: string): number => {
    if (!content) return 0
    return content.split(/\r?\n/).length
  }

  return (
    <div className="h-full flex flex-col items-center overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4 md:mb-6 relative w-full max-w-4xl shrink-0"
      >
        <div className="flex items-center justify-center gap-3 mb-1">
          <Logo size={28} className="md:size-8" />
          <h1 className="text-lg md:text-xl font-bold">Karpa</h1>
        </div>
        <p className="text-xs text-muted-foreground hidden sm:block">{t.translator.title}</p>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute right-2 md:right-0 top-1/2 -translate-y-1/2 size-9 md:h-9 md:w-auto md:px-4 md:gap-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200",
            isHistoryOpen && "text-primary bg-primary/10 hover:bg-primary/15"
          )}
          onClick={() => setIsHistoryOpen(true)}
        >
          <ClockCounterClockwise className="size-4" />
          <span className="hidden md:inline text-xs font-medium">{t.history.title}</span>
        </Button>
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl flex-1 min-h-0"
      >
        <div className="h-full bg-card/50 backdrop-blur-xl border rounded-2xl overflow-hidden flex flex-col">
          {/* Mode Toggle & Controls */}
          <div className="flex flex-col gap-3 p-3 md:p-4 border-b bg-muted/30 shrink-0">
            {/* Top Row: Mode Toggle + Tone */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex bg-muted/50 border border-border/50 rounded-lg p-0.5 shrink-0">
                <button
                  onClick={() => setMode("text")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                    mode === "text"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Translate className="size-3.5" />
                  <span>{t.translator.textMode}</span>
                </button>
                <button
                  onClick={() => setMode("file")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                    mode === "file"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FileArrowUp className="size-3.5" />
                  <span>{t.translator.fileMode}</span>
                </button>
              </div>

              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="w-auto min-w-[100px] h-9 rounded-xl bg-background/50 text-xs font-semibold border-transparent shadow-sm px-3">
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

            {/* Language Controls */}
            <div className="flex items-center gap-1.5 w-full">
              <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                <SelectTrigger className="flex-1 min-w-0 h-9 rounded-lg bg-muted/50 text-xs font-medium border border-border/50 px-3 data-[state=open]:bg-muted/80 data-[state=open]:border-border transition-all duration-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="Auto Detect" className="text-xs">
                    <span className="flex items-center gap-2">
                      <Sparkle className="size-3" />
                      {t.translator.autoDetect}
                    </span>
                  </SelectItem>
                  {languages.map(l => (
                    <SelectItem key={l.code} value={l.name} className="text-xs">{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-lg shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                onClick={swapLanguages}
                disabled={sourceLanguage === "Auto Detect"}
              >
                <ArrowsLeftRight className="size-3.5" />
              </Button>

              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger className="flex-1 min-w-0 h-9 rounded-lg bg-muted/50 text-xs font-medium border border-border/50 px-3 data-[state=open]:bg-muted/80 data-[state=open]:border-border transition-all duration-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-[var(--radix-select-trigger-width)]">
                  {languages.map(l => (
                    <SelectItem key={l.code} value={l.name} className="text-xs">{l.name}</SelectItem>
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
                  <div className="relative h-full flex flex-col min-h-0">
                    <Textarea
                      value={sourceText}
                      onChange={(e) => setSourceText(e.target.value)}
                      placeholder={t.translator.enterText}
                      className="flex-1 resize-none border-none focus-visible:ring-0 rounded-none p-4 md:p-6 text-base md:text-lg font-light placeholder:text-muted-foreground/40 bg-transparent custom-scrollbar"
                      spellCheck={false}
                    />
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-3 md:p-4 bg-gradient-to-t from-card/90 to-transparent shrink-0">
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
                          {tts.isSpeaking ? <SpeakerX className="size-4" /> : <SpeakerHigh className="size-4" />}
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
                  <div className="relative bg-muted/10 h-full flex flex-col min-h-0">
                    {loading && (
                      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-center justify-center p-6 text-center">
                        <div className="w-full max-w-xs space-y-4">
                          <div className="flex items-center justify-center gap-3 mb-2">
                            <Spinner className="size-5 animate-spin text-primary" />
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
                    <div className="flex-1 p-4 md:p-6 h-full overflow-y-auto custom-scrollbar">
                      {translatedText ? (
                        <MarkdownViewer content={translatedText} className="text-base md:text-lg leading-relaxed" />
                      ) : (
                        <p className="text-muted-foreground/40 text-base md:text-lg font-light">{t.translator.translationWillAppear}</p>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-3 md:p-4 bg-gradient-to-t from-muted/40 to-transparent shrink-0">
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
                          {tts.isSpeaking ? <SpeakerX className="size-4" /> : <SpeakerHigh className="size-4" />}
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
                  className="h-full flex flex-col overflow-hidden"
                >
                  {!selectedFile ? (
                    <div className="flex-1 flex items-center justify-center p-6 md:p-10">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-lg"
                      >
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={cn(
                            "group relative cursor-pointer rounded-3xl border-2 border-dashed p-8 md:p-12 text-center transition-all duration-300",
                            "before:absolute before:inset-0 before:rounded-3xl before:transition-opacity before:duration-500",
                            isDragging
                              ? "border-primary bg-primary/[0.06] scale-[0.98] before:bg-primary/5 before:opacity-100"
                              : "border-border/60 hover:border-primary/40 hover:bg-muted/20 before:opacity-0"
                          )}
                        >
                          <div className={cn(
                            "absolute inset-0 rounded-3xl transition-all duration-500",
                            isDragging
                              ? "shadow-[inset_0_0_60px_-12px] shadow-primary/20"
                              : "shadow-none"
                          )} />
                          <div className="relative z-10 space-y-5">
                            <motion.div
                              animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
                              className={cn(
                                "mx-auto size-16 md:size-20 rounded-2xl flex items-center justify-center transition-all duration-300",
                                isDragging
                                  ? "bg-primary shadow-lg shadow-primary/25"
                                  : "bg-muted group-hover:bg-primary/10"
                              )}
                            >
                              <Upload className={cn(
                                "size-7 md:size-9 transition-all duration-300",
                                isDragging
                                  ? "text-primary-foreground"
                                  : "text-muted-foreground group-hover:text-primary"
                              )} />
                            </motion.div>
                            <div className="space-y-2">
                              <h3 className="text-lg md:text-xl font-bold tracking-tight">
                                {isDragging ? t.translator.uploadFile : t.translator.uploadFile}
                              </h3>
                              <p className="text-sm text-muted-foreground/80 max-w-xs mx-auto leading-relaxed">
                                {t.translator.dragDrop}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              {[".txt", ".md", ".json", ".csv", ".srt", ".html", ".js", ".py"].map(fmt => (
                                <span
                                  key={fmt}
                                  className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-muted/60 border border-border/40 text-muted-foreground"
                                >
                                  {fmt}
                                </span>
                              ))}
                            </div>
                          </div>
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".txt,.md,.json,.csv,.srt,.js,.ts,.py,.html,.css,.xml"
                            onChange={handleFileUpload}
                          />
                        </div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="mt-6"
                        >
                          <Alert className="bg-muted/30 border-border/40 rounded-2xl">
                            <Info className="size-4 text-muted-foreground" />
                            <AlertTitle className="text-xs font-semibold">
                              {t.translator.unsupportedNote}
                            </AlertTitle>
                            <AlertDescription className="text-xs text-muted-foreground/70">
                              {t.translator.unsupportedWarning}
                            </AlertDescription>
                          </Alert>
                        </motion.div>
                      </motion.div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col min-h-0 p-4 md:p-6 overflow-y-auto custom-scrollbar">
                      <div className="flex-1 space-y-4 md:space-y-5">
                        {(() => {
                          const fileType = getFileTypeInfo(selectedFile.name)
                          const FileIcon = fileType.icon
                          return (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-muted/30 border border-border/50 rounded-2xl p-4 md:p-5"
                            >
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "size-12 md:size-14 rounded-xl flex items-center justify-center shrink-0",
                                  "bg-background border border-border/50"
                                )}>
                                  <FileIcon className={cn("size-6 md:size-7", fileType.color)} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-sm md:text-base truncate">{selectedFile.name}</p>
                                    <span className={cn(
                                      "shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-wide border",
                                      fileType.color.replace("text-", "bg-").replace(/500/, "500/10"),
                                      fileType.color.replace("text-", "border-").replace(/500/, "500/20"),
                                      fileType.color
                                    )}>
                                      {fileType.label}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70">
                                    <span>{formatFileSize(selectedFile.size)}</span>
                                    <span className="w-px h-3 bg-border/60" />
                                    <span>{getLineCount(fileContent).toLocaleString()} {t.translator.lines}</span>
                                    <span className="w-px h-3 bg-border/60" />
                                    <span>{fileContent.length.toLocaleString()} {t.translator.characters}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                                    onClick={() => fileInputRef.current?.click()}
                                    title={t.translator.chooseAnother}
                                  >
                                    <ArrowsClockwise className="size-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                      setSelectedFile(null)
                                      setFileContent("")
                                      setTranslatedFileContent("")
                                    }}
                                    title={t.common.delete}
                                  >
                                    <X className="size-4" />
                                  </Button>
                                </div>
                              </div>
                              {!loading && !translatedFileContent && (
                                <div className="mt-4 pt-4 border-t border-border/40 flex items-center gap-2">
                                  <div className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                                  <span className="text-[11px] font-medium text-muted-foreground/70">
                                    {t.translator.fileReady} - {t.translator.fileReadyDesc}
                                  </span>
                                </div>
                              )}
                            </motion.div>
                          )
                        })()}

                        {loading && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-muted/30 border border-border/50 rounded-2xl p-5 md:p-6 space-y-5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Spinner className="size-5 animate-spin text-primary" />
                                <div>
                                  <p className="text-sm font-semibold">{t.translator.translating}</p>
                                  <p className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wider truncate max-w-[200px]">
                                    {selectedFile?.name}
                                  </p>
                                </div>
                              </div>
                              <span className="text-sm font-bold text-primary tabular-nums">{progress}%</span>
                            </div>
                            <div className="space-y-2">
                              <Progress value={progress} className="h-2 [&>div]:transition-all [&>div]:duration-500" />
                              {totalChunks > 1 && (
                                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                  <span>{t.translator.characters}</span>
                                  <span>{currentChunk} / {totalChunks}</span>
                                </div>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full rounded-xl h-9 text-xs font-semibold border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50"
                              onClick={handleCancelTranslation}
                            >
                              {t.common.cancel}
                            </Button>
                          </motion.div>
                        )}

                        {translatedFileContent && !loading && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                          >
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-muted/20 border border-border/40 rounded-2xl p-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                  {t.translator.originalFile}
                                </p>
                                <p className="text-2xl font-bold tabular-nums">{fileContent.length.toLocaleString()}</p>
                                <p className="text-[11px] text-muted-foreground/70">{t.translator.characters}</p>
                              </div>
                              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">
                                  {t.translator.translatedResult}
                                </p>
                                <p className="text-2xl font-bold text-primary tabular-nums">{translatedFileContent.length.toLocaleString()}</p>
                                <p className="text-[11px] text-primary/70">{t.translator.characters}</p>
                              </div>
                            </div>
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/25 rounded-2xl p-5 md:p-6"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="size-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                                    <CheckCircle className="size-5 text-green-500" />
                                  </div>
                                  <div className="space-y-0.5">
                                    <p className="font-bold text-sm">{t.translator.fileProcessed}</p>
                                    <p className="text-xs text-muted-foreground/70 truncate max-w-[200px]">
                                      {selectedFile?.name}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  size="lg"
                                  onClick={handleDownload}
                                  className="bg-green-600 hover:bg-green-500 rounded-xl px-8 h-11 font-bold shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all active:scale-[0.97]"
                                >
                                  <Download className="size-4 mr-2" />
                                  {t.translator.downloadTranslated}
                                </Button>
                              </div>
                            </motion.div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Translate Button */}
          <div className="p-3 md:p-4 border-t bg-muted/20 shrink-0">
            {loading ? (
              <Button
                onClick={handleCancelTranslation}
                variant="destructive"
                className="w-full h-12 md:h-14 rounded-xl text-sm font-bold gap-2 transition-all active:scale-[0.98]"
                size="lg"
              >
                <X className="size-4" />
                {t.common.cancel}
              </Button>
            ) : (
              <Button
                onClick={handleTranslate}
                disabled={mode === "text" ? !sourceText.trim() : !selectedFile}
                className={cn(
                  "w-full h-12 md:h-14 rounded-xl font-bold text-sm md:text-base transition-all duration-200 flex items-center justify-between px-5 md:px-6 group",
                  mode === "text" && !sourceText.trim() || mode === "file" && !selectedFile
                    ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                    : "bg-foreground text-background hover:bg-primary hover:text-white active:scale-[0.98]"
                )}
                size="lg"
              >
                <span>{t.translator.translate}</span>
                <div className={cn(
                  "size-8 md:size-9 rounded-lg flex items-center justify-center transition-all duration-200",
                  mode === "text" && !sourceText.trim() || mode === "file" && !selectedFile
                    ? "bg-muted-foreground/10"
                    : "bg-background/20 group-hover:bg-white/20"
                )}>
                  <MagicWand className={cn(
                    "size-4 transition-colors duration-200",
                    mode === "text" && !sourceText.trim() || mode === "file" && !selectedFile
                      ? "text-muted-foreground"
                      : "text-current"
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
              className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40"
            />
            {/* Floating Panel */}
            <motion.div
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ type: "spring", damping: 30, stiffness: 250 }}
              className="fixed right-3 top-3 bottom-3 w-[calc(100%-1.5rem)] sm:max-w-sm z-50 bg-background border border-border/80 rounded-2xl shadow-lg flex flex-col overflow-hidden"
            >
              <div className="flex flex-col h-full">
                <div className="px-5 py-4 border-b shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ClockCounterClockwise className="size-4 text-primary" />
                    <h2 className="text-sm font-semibold">{t.history.title}</h2>
                    <span className="text-[10px] font-medium text-muted-foreground/50 bg-muted/50 px-1.5 py-0.5 rounded">{history.length}</span>
                  </div>
                  <button
                    onClick={() => setIsHistoryOpen(false)}
                    className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                  {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-8">
                      <div className="size-10 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                        <ClockCounterClockwise className="size-5 text-muted-foreground/40" />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground/50">{t.history.noHistory}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {[...history].reverse().map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            restoreHistoryItem(item)
                            setIsHistoryOpen(false)
                          }}
                          className="group px-3.5 py-3 rounded-xl border border-border/40 bg-card/30 hover:bg-muted/40 hover:border-border/60 transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-muted/60 border border-border/50 text-muted-foreground shrink-0">
                                {item.sourceLang === "Auto Detect" ? "AUTO" : item.sourceLang.slice(0, 2).toUpperCase()}
                              </span>
                              <ArrowRight className="size-2.5 text-muted-foreground/30 shrink-0" />
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-primary/5 border border-primary/15 text-primary shrink-0">
                                {item.targetLang.slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteHistoryItem(item.id)
                              }}
                              className="size-6 flex items-center justify-center rounded-md text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                            >
                              <Trash className="size-3" />
                            </button>
                          </div>
                          <p className="text-xs font-medium mt-2 line-clamp-1">{item.mode === 'file' && item.fileName ? item.fileName : item.sourceText}</p>
                          <p className="text-[11px] text-muted-foreground/60 mt-0.5 line-clamp-1">{item.translatedText}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 border-t shrink-0">
                  <button
                    onClick={() => {
                      setIsHistoryOpen(false)
                      router.push("/history")
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border/40 bg-card/30 hover:bg-muted/40 hover:border-border/60 transition-all group cursor-pointer text-xs font-medium text-muted-foreground/60 hover:text-foreground"
                  >
                    <ArrowSquareOut className="size-3.5" />
                    {t.history.viewFull}
                  </button>
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
        <Spinner className="size-8 animate-spin text-primary" />
      </div>
    }>
      <TranslatorWorkspace />
    </Suspense>
  )
}