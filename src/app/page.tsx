"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  ArrowRightLeft, Loader2, Copy, Check, Volume2, VolumeX, X, Star,
  Languages, Sparkles, Wand2, FileUp, Upload
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"
import { motion, AnimatePresence } from "framer-motion"
import { Logo } from "@/components/logo"
import { useTTS } from "@/hooks/use-tts"
import { MarkdownViewer } from "@/components/markdown-viewer"
import { useOnboarding } from "@/contexts/onboarding-context"

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
  }, [searchParams])

  const addToHistory = (item: TranslationItem) => {
    const savedH = localStorage.getItem("translation-history")
    let history: TranslationItem[] = savedH ? JSON.parse(savedH) : []
    history = [item, ...history].slice(0, 100)
    localStorage.setItem("translation-history", JSON.stringify(history))
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
    try {
      // Get settings from localStorage
      const savedModel = localStorage.getItem("lm-studio-model")
      const savedUrl = localStorage.getItem("lm-studio-url")
      const savedTemp = localStorage.getItem("lm-studio-temperature")

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToTranslate,
          targetLanguage,
          sourceLanguage: sourceLanguage !== "Auto Detect" ? sourceLanguage : undefined,
          tone: tone !== "standard" ? tone : undefined,
          model: savedModel,
          apiUrl: savedUrl,
          temperature: savedTemp ? parseFloat(savedTemp) : undefined
        }),
        signal: abortControllerRef.current.signal,
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed")

      if (mode === "text") {
        setTranslatedText(data.translation)
      } else {
        setTranslatedFileContent(data.translation)
        toast.success(t.translator.fileTranslated)
      }

      const newEntry: TranslationItem = {
        id: Date.now().toString(),
        sourceText: textToTranslate,
        translatedText: data.translation,
        sourceLang: sourceLanguage,
        targetLang: targetLanguage,
        timestamp: Date.now(),
        tone
      }
      addToHistory(newEntry)

      // Reset to Auto Detect and set target to most used language
      setSourceLanguage("Auto Detect")
      
      const savedH = localStorage.getItem("translation-history")
      if (savedH) {
        const history: TranslationItem[] = JSON.parse(savedH)
        if (history.length > 0) {
          const counts: Record<string, number> = {}
          history.forEach(item => {
            counts[item.targetLang] = (counts[item.targetLang] || 0) + 1
          })
          const mostUsed = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b)
          setTargetLanguage(mostUsed)
        } else {
          setTargetLanguage(defaultTargetLang || "English")
        }
      } else {
        setTargetLanguage(defaultTargetLang || "English")
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validExtensions = ['.txt', '.md', '.json', '.csv', '.srt', '.js', '.ts', '.py', '.html', '.css', '.xml']
    const isExtensionValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))

    if (!isExtensionValid && !file.type.startsWith('text/')) {
      toast.error(t.errors.invalidFile)
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
    const targetCode = targetLanguage.substring(0, 2).toLowerCase()
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
    <div className="h-full flex flex-col items-center justify-center">
{/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <Logo size={36} />
          <h1 className="text-2xl font-bold">Localce</h1>
        </div>
        <p className="text-sm text-muted-foreground">{t.translator.title}</p>
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl"
      >
        <div className="bg-card/50 backdrop-blur-xl border rounded-3xl shadow-2xl shadow-black/5 dark:shadow-black/20 overflow-hidden">
          {/* Mode Toggle & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b bg-muted/30">
            {/* Mode Toggle */}
            <div className="flex bg-muted rounded-xl p-1 self-start">
              <button
                onClick={() => setMode("text")}
                className={cn(
                  "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  mode === "text"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Languages className="size-4" />
                <span className="hidden xs:inline">{t.translator.textMode}</span>
                <span className="xs:hidden">Text</span>
              </button>
              <button
                onClick={() => setMode("file")}
                className={cn(
                  "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  mode === "file"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileUp className="size-4" />
                <span className="hidden xs:inline">{t.translator.fileMode}</span>
                <span className="xs:hidden">File</span>
              </button>
            </div>

            {/* Language Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                <SelectTrigger className="w-[110px] sm:w-[130px] h-9 rounded-xl bg-background/50 text-xs sm:text-sm">
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
                className="size-9 rounded-xl shrink-0"
                onClick={swapLanguages}
                disabled={sourceLanguage === "Auto Detect"}
              >
                <ArrowRightLeft className="size-4" />
              </Button>

              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger className="w-[110px] sm:w-[130px] h-9 rounded-xl bg-background/50 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(l => (
                    <SelectItem key={l.code} value={l.name}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="w-[100px] sm:w-[120px] h-9 rounded-xl bg-background/50 text-xs sm:text-sm">
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
          <AnimatePresence mode="wait">
            {mode === "text" ? (
              <motion.div
                key="text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x"
              >
                {/* Source */}
                <div className="relative">
                  <Textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder={t.translator.enterText}
                    className="min-h-[180px] sm:min-h-[280px] resize-none border-none focus-visible:ring-0 rounded-none p-4 text-base bg-transparent"
                    spellCheck={false}
                  />
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-3 bg-gradient-to-t from-card/80 to-transparent">
                    <span className="text-xs text-muted-foreground">
                      {sourceText.length} {t.translator.characters}
                    </span>
<div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "size-8 rounded-lg transition-colors",
                          tts.isSpeaking && "text-primary bg-primary/10"
                        )}
                        onClick={() => handleSpeak(sourceText, sourceLanguage)}
                        disabled={!sourceText || !tts.isSupported}
                      >
                        {tts.isSpeaking ? (
                          <VolumeX className="size-4" />
                        ) : (
                          <Volume2 className="size-4" />
                        )}
                      </Button>
                      {sourceText && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg hover:text-destructive"
                          onClick={() => setSourceText("")}
                        >
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Target */}
                <div className="relative bg-muted/20">
                  {loading && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-center justify-center">
                      <div className="flex items-center gap-3 bg-background px-4 py-2 rounded-full shadow-lg border">
                        <Loader2 className="size-4 animate-spin text-primary" />
                        <span className="text-sm">{t.translator.translating}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                          onClick={handleCancelTranslation}
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="min-h-[180px] sm:min-h-[280px] p-4 h-full">
                    {translatedText ? (
                      <MarkdownViewer content={translatedText} className="text-base" />
                    ) : (
                      <p className="text-muted-foreground">{t.translator.translationWillAppear}</p>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-3 bg-gradient-to-t from-muted/40 to-transparent">
                    <span className="text-xs text-muted-foreground">
                      {translatedText.length} {t.translator.characters}
                    </span>
<div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "size-8 rounded-lg transition-colors",
                          tts.isSpeaking && "text-primary bg-primary/10"
                        )}
                        onClick={() => handleSpeak(translatedText, targetLanguage)}
                        disabled={!translatedText || !tts.isSupported}
                      >
                        {tts.isSpeaking ? (
                          <VolumeX className="size-4" />
                        ) : (
                          <Volume2 className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg"
                        onClick={() => copyToClipboard(translatedText)}
                        disabled={!translatedText}
                      >
                        {isCopied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg hover:text-yellow-500"
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
                className="p-6"
              >
                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
                  >
                    <Upload className="size-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-1">{t.translator.uploadFile}</h3>
                    <p className="text-sm text-muted-foreground">{t.translator.dragDrop}</p>
                    <p className="text-xs text-muted-foreground mt-2">{t.translator.supportedFormats}</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".txt,.md,.json,.csv,.srt,.js,.ts,.py,.html,.css,.xml"
                      onChange={handleFileUpload}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileUp className="size-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">{fileContent.length} {t.translator.characters}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null)
                          setFileContent("")
                          setTranslatedFileContent("")
                        }}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>

                    {translatedFileContent && (
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-green-600 dark:text-green-400">
                            {t.translator.translatedFile}
                          </p>
                          <Button size="sm" onClick={handleDownload} className="bg-green-600 hover:bg-green-500">
                            {t.common.download}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Translate Button */}
          <div className="p-4 border-t bg-muted/20">
            {loading ? (
              <Button
                onClick={handleCancelTranslation}
                variant="destructive"
                className="w-full h-12 rounded-xl text-base font-medium gap-2"
                size="lg"
              >
                <X className="size-5" />
                {t.common.cancel}
              </Button>
            ) : (
              <Button
                onClick={handleTranslate}
                disabled={mode === "text" ? !sourceText.trim() : !selectedFile}
                className="w-full h-12 rounded-xl text-base font-medium gap-2"
                size="lg"
              >
                <Wand2 className="size-5" />
                {t.translator.translate}
              </Button>
            )}
            <p className="text-xs text-center text-muted-foreground mt-2">
              {t.translator.ctrlEnter}
            </p>
          </div>
        </div>
      </motion.div>
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
