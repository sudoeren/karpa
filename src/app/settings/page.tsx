"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Settings, Sun, Moon, Monitor, Globe, 
  Trash2, Download, Upload, RefreshCw, Check, Loader2, Zap,
  Github, Heart, Code2, ExternalLink, Droplets
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

  useEffect(() => {
    const savedUrl = localStorage.getItem("lm-studio-url")
    const savedTemp = localStorage.getItem("lm-studio-temperature")
    const savedAmoled = localStorage.getItem("localce-amoled")
    
    if (savedUrl) setLmStudioUrl(savedUrl)
    if (savedTemp) setTemperature(parseFloat(savedTemp))
    if (savedAmoled) setAmoledMode(savedAmoled === 'true')
  }, [])

  useEffect(() => {
    if (amoledMode) {
      document.documentElement.classList.add('amoled')
      localStorage.setItem("localce-amoled", 'true')
    } else {
      document.documentElement.classList.remove('amoled')
      localStorage.setItem("localce-amoled", 'false')
    }
  }, [amoledMode])

  const saveSettings = () => {
    localStorage.setItem("lm-studio-url", lmStudioUrl)
    localStorage.setItem("lm-studio-temperature", temperature.toString())
    toast.success(t.common.save)
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
        const modelInfo = data.models > 0 ? ` (${data.models} model${data.models > 1 ? 's' : ''})` : ''
        toast.success(`${t.settings.connectionSuccess}${modelInfo}`)
      } else {
        setConnectionStatus('error')
        toast.error(data.error || t.settings.connectionFailed)
      }
    } catch (error) {
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
    <div className="min-h-[calc(100svh-5rem)] flex flex-col p-4 overflow-y-auto">
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
        className="max-w-4xl mx-auto w-full flex-1"
      >
        <div className="bg-card/50 backdrop-blur-xl border rounded-3xl shadow-2xl shadow-black/5 dark:shadow-black/20 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b overflow-x-auto">
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
          <div className="p-6">
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
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                {/* Developer Section - Main Focus */}
                <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-card via-card to-violet-500/5">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                  
                  <div className="relative p-8">
                    <div className="flex flex-col items-center text-center">
                      {/* Avatar */}
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl blur-2xl opacity-50 scale-110" />
                        <div className="relative size-28 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-4xl shadow-2xl ring-4 ring-background">
                          EC
                        </div>
                      </div>
                      
                      {/* Info */}
                      <h2 className="text-2xl font-bold mb-1">Eren Cakar</h2>
                      <p className="text-muted-foreground mb-6">Full Stack Developer</p>
                      
                      {/* Buttons */}
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="outline" 
                          className="h-11 px-5 rounded-xl gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all" 
                          asChild
                        >
                          <Link href="https://erencakar.com" target="_blank">
                            <Globe className="size-4" />
                            Website
                            <ExternalLink className="size-3 opacity-50" />
                          </Link>
                        </Button>
                        <Button 
                          className="h-11 px-5 rounded-xl gap-2" 
                          asChild
                        >
                          <Link href="https://github.com/sudoeren" target="_blank">
                            <Github className="size-4" />
                            GitHub
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* App Info Card */}
                <div className="relative overflow-hidden rounded-2xl border bg-muted/30 p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-background rounded-xl border shadow-sm">
                      <Logo size={40} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">Localce</h3>
                      <p className="text-sm text-muted-foreground">{t.about.description}</p>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20">v1.0.0</Badge>
                  </div>
                </div>

                {/* Open Source CTA */}
                <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 p-6">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-1 text-center sm:text-left">
                      <h4 className="font-semibold mb-1">{t.about.openSource}</h4>
                      <p className="text-xs text-muted-foreground">
                        {language === 'tr' 
                          ? 'Kodu inceleyin, katki saglayin veya fork\'layin' 
                          : 'View the code, contribute, or fork it'}
                      </p>
                    </div>
                    <Button variant="outline" className="gap-2 rounded-xl h-11 px-6" asChild>
                      <Link href="https://github.com/sudoeren/localce" target="_blank">
                        <Github className="size-4" />
                        {language === 'tr' ? 'Kaynak Kodu' : 'Source Code'}
                        <ExternalLink className="size-3" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                    {t.about.madeWith} 
                    <Heart className="size-4 text-red-500 fill-red-500 animate-pulse" /> 
                    {language === 'tr' ? "Turkiye'de" : 'in Turkey'}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
