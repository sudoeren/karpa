"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Settings, Sun, Moon, Monitor, Globe, 
  Trash2, Download, Upload, RefreshCw, Check, Loader2, Zap,
  Github, Code2, Droplets, Cpu
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
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { useOnboarding } from "@/contexts/onboarding-context"

type Model = {
  id: string
  object: string
}

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()
  const { resetOnboarding } = useOnboarding()
  const [lmStudioUrl, setLmStudioUrl] = useState("http://localhost:1234")
  const [temperature, setTemperature] = useState(0.2)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [activeTab, setActiveTab] = useState<'general' | 'connection' | 'data' | 'about'>('general')
  const [amoledMode, setAmoledMode] = useState(false)
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState<string>("")

  const fetchModels = useCallback(async (url: string) => {
    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await response.json()
      if (data.success) {
        setModels(data.models)
        if (!selectedModel && data.models.length > 0) {
          // Check if saved model exists in new list, otherwise pick first
          const savedModel = localStorage.getItem("lm-studio-model")
          if (savedModel && data.models.some((m: Model) => m.id === savedModel)) {
            setSelectedModel(savedModel)
          } else {
            setSelectedModel(data.models[0].id)
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch models", error)
    }
  }, [selectedModel])

  useEffect(() => {
    const savedUrl = localStorage.getItem("lm-studio-url")
    const savedTemp = localStorage.getItem("lm-studio-temperature")
    const savedAmoled = localStorage.getItem("localce-amoled")
    const savedModel = localStorage.getItem("lm-studio-model")
    
    if (savedUrl) {
      setLmStudioUrl(savedUrl)
      fetchModels(savedUrl)
    }
    if (savedTemp) setTemperature(parseFloat(savedTemp))
    if (savedAmoled) setAmoledMode(savedAmoled === 'true')
    if (savedModel) setSelectedModel(savedModel)
  }, [fetchModels])

  // Apply AMOLED mode
  useEffect(() => {
    if (amoledMode && theme === 'dark') {
      document.documentElement.classList.add('amoled')
    } else {
      document.documentElement.classList.remove('amoled')
    }
    localStorage.setItem("localce-amoled", String(amoledMode))
  }, [amoledMode, theme])

  const saveSettings = () => {
    localStorage.setItem("lm-studio-url", lmStudioUrl)
    localStorage.setItem("lm-studio-temperature", temperature.toString())
    if (selectedModel) localStorage.setItem("lm-studio-model", selectedModel)
    toast.success(t.settings.saved)
  }

  const testConnection = async () => {
    setIsTestingConnection(true)
    setConnectionStatus('idle')
    
    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: lmStudioUrl }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setConnectionStatus('success')
        await fetchModels(lmStudioUrl)
        const modelInfo = data.models > 0 ? ` (${data.models} model${data.models > 1 ? 's' : ''})` : ''
        toast.success(`${t.settings.connectionSuccess}${modelInfo}`)
      } else {
        setConnectionStatus('error')
        toast.error(data.error || t.settings.connectionFailed)
      }
    } catch (error) {
      console.error(error)
      setConnectionStatus('error')
      toast.error(t.settings.connectionFailed)
    } finally {
      setIsTestingConnection(false)
    }
  }

  const exportData = () => {
    const data = {
      history: JSON.parse(localStorage.getItem("translation-history") || "[]"),
      favorites: JSON.parse(localStorage.getItem("translation-favorites") || "[]"),
      settings: { lmStudioUrl, temperature, language, theme }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `localce-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success(t.settings.exportData)
  }

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (data.history) localStorage.setItem("translation-history", JSON.stringify(data.history))
        if (data.favorites) localStorage.setItem("translation-favorites", JSON.stringify(data.favorites))
        if (data.settings) {
          if (data.settings.lmStudioUrl) setLmStudioUrl(data.settings.lmStudioUrl)
          if (data.settings.temperature) setTemperature(data.settings.temperature)
          if (data.settings.language) setLanguage(data.settings.language)
          if (data.settings.theme) setTheme(data.settings.theme)
        }
        toast.success(t.settings.importData)
      } catch {
        toast.error("Invalid backup file")
      }
    }
    reader.readAsText(file)
  }

  const clearAllData = () => {
    localStorage.removeItem("translation-history")
    localStorage.removeItem("translation-favorites")
    toast.success(t.settings.clearData)
    // Reset onboarding to show it again
    resetOnboarding()
  }

  const themes = [
    { value: "light", icon: Sun, label: t.common.light },
    { value: "dark", icon: Moon, label: t.common.dark },
    { value: "system", icon: Monitor, label: t.common.system },
  ]

  const languages = [
    { value: "en", label: "English", flag: "GB" },
    { value: "tr", label: "Turkce", flag: "TR" },
  ]

  const tabs = [
    { id: 'general' as const, label: t.settings.appearance, icon: Sun },
    { id: 'connection' as const, label: t.settings.connection, icon: Zap },
    { id: 'data' as const, label: t.settings.data, icon: Download },
    { id: 'about' as const, label: t.nav.about, icon: Code2 },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-card/50 backdrop-blur-xl border rounded-full mb-2">
          <Settings className="size-4 text-primary" />
          <span className="text-sm font-medium">{t.settings.title}</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto w-full flex-1 min-h-0 flex flex-col"
      >
        <div className="bg-card/50 backdrop-blur-xl border rounded-3xl shadow-2xl shadow-black/5 dark:shadow-black/20 overflow-hidden h-full flex flex-col">
          {/* Tabs */}
          <div className="flex border-b overflow-x-auto shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <tab.icon className="size-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            {/* General Tab */}
            {activeTab === 'general' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Theme */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">{t.settings.theme}</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {themes.map((t2) => (
                      <button
                        key={t2.value}
                        onClick={() => setTheme(t2.value)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                          theme === t2.value
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-transparent bg-muted/50 hover:bg-muted"
                        )}
                      >
                        <t2.icon className={cn("size-6", theme === t2.value && "text-primary")} />
                        <span className="text-sm">{t2.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* AMOLED Mode */}
                <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Droplets className="size-4" />
                      {language === 'tr' ? 'AMOLED Modu (Tam Siyah)' : 'AMOLED Mode (Pitch Black)'}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {language === 'tr' 
                        ? 'Koyu tema icin tam siyah arka plan kullanir' 
                        : 'Use pure black background for dark theme'}
                    </p>
                  </div>
                  <Switch
                    checked={amoledMode}
                    onCheckedChange={setAmoledMode}
                    disabled={theme === 'light'}
                  />
                </div>

                {/* Language */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">{t.settings.language}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {languages.map((lang) => (
                      <button
                        key={lang.value}
                        onClick={() => setLanguage(lang.value as "en" | "tr")}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-xl border transition-all",
                          language === lang.value
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-transparent bg-muted/50 hover:bg-muted"
                        )}
                      >
                        <Globe className={cn("size-5", language === lang.value && "text-primary")} />
                        <span className="text-sm font-medium">{lang.label}</span>
                        {language === lang.value && <Check className="size-4 text-primary ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Connection Tab */}
            {activeTab === 'connection' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* URL */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium">{t.settings.lmStudioUrl}</Label>
                    {connectionStatus === 'success' && (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        Connected
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={lmStudioUrl}
                      onChange={(e) => setLmStudioUrl(e.target.value)}
                      className="flex-1 h-11 rounded-xl bg-muted/50"
                      placeholder="http://localhost:1234"
                    />
                    <Button
                      variant="outline"
                      className="h-11 rounded-xl gap-2 px-4"
                      onClick={testConnection}
                      disabled={isTestingConnection}
                    >
                      {isTestingConnection ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : connectionStatus === 'success' ? (
                        <Check className="size-4 text-green-500" />
                      ) : (
                        <RefreshCw className="size-4" />
                      )}
                      Test
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{t.settings.connectionDesc}</p>
                </div>

                {/* Model Selection */}
                {models.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                      <Cpu className="size-4" />
                      Model
                    </Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="w-full h-11 rounded-xl bg-muted/50">
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-2">
                      {language === 'tr' ? 'Ceviri icin kullanilacak modeli secin' : 'Select the model to use for translation'}
                    </p>
                  </div>
                )}

                {/* Temperature */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium">{t.settings.temperature}</Label>
                    <Badge variant="outline" className="font-mono">{temperature.toFixed(1)}</Badge>
                  </div>
                  <Slider
                    value={[temperature]}
                    onValueChange={(v) => setTemperature(v[0])}
                    min={0}
                    max={1}
                    step={0.1}
                    className="py-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">{t.settings.temperatureDesc}</p>
                </div>

                {/* Save */}
                <Button onClick={saveSettings} className="w-full h-11 rounded-xl">
                  {t.common.save}
                </Button>
              </motion.div>
            )}

            {/* Data Tab */}
            {activeTab === 'data' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <Label className="text-sm font-medium mb-3 block">{t.settings.dataDesc}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-12 rounded-xl gap-2" onClick={exportData}>
                      <Download className="size-4" />
                      {t.settings.exportData}
                    </Button>
                    <Button variant="outline" className="h-12 rounded-xl gap-2" asChild>
                      <label className="cursor-pointer">
                        <Upload className="size-4" />
                        {t.settings.importData}
                        <input type="file" accept=".json" className="hidden" onChange={importData} />
                      </label>
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Label className="text-sm font-medium mb-3 block text-destructive">{t.settings.clearDataTitle}</Label>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full h-12 rounded-xl gap-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10">
                        <Trash2 className="size-4" />
                        {t.settings.clearData}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t.settings.clearDataTitle}</AlertDialogTitle>
                        <AlertDialogDescription>{t.settings.clearDataDesc}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={clearAllData} className="bg-destructive text-destructive-foreground">
                          {t.common.delete}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </motion.div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-12 select-none"
              >
                {/* Brand Section */}
                <div className="flex flex-col items-center gap-6">
                  <motion.div 
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Logo size={56} />
                  </motion.div>
                  
                  <div className="space-y-3 max-w-xs">
                    <h1 className="text-lg font-medium tracking-tight text-foreground">
                      Localce
                    </h1>
                    <p className="text-sm text-muted-foreground/80 leading-relaxed font-light">
                      {t.about.description}
                    </p>
                  </div>
                </div>

                {/* Developer Section */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-medium">
                      {t.about.developer}
                    </p>
                    <p className="text-sm font-medium text-foreground/80">
                      Eren Cakar
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-center gap-5">
                    <Link 
                      href="https://erencakar.com" 
                      target="_blank" 
                      className="text-muted-foreground/60 hover:text-foreground transition-colors duration-300"
                    >
                      <Globe className="size-4" />
                      <span className="sr-only">Website</span>
                    </Link>
                    <Link 
                      href="https://github.com/sudoeren" 
                      target="_blank" 
                      className="text-muted-foreground/60 hover:text-foreground transition-colors duration-300"
                    >
                      <Github className="size-4" />
                      <span className="sr-only">GitHub</span>
                    </Link>
                  </div>
                </div>

                {/* Version & Source */}
                <div className="pt-2">
                  <Link 
                    href="https://github.com/sudoeren/localce" 
                    target="_blank"
                    className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground transition-colors font-mono"
                  >
                    v1.0.0
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
