"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import {
  Settings, Sun, Moon, Monitor, Globe, 
  Trash2, Download, Upload, RefreshCw, Check, Loader2, Zap,
  Github, Heart, Shield, Code2, ExternalLink
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

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [lmStudioUrl, setLmStudioUrl] = useState("http://localhost:1234")
  const [temperature, setTemperature] = useState(0.2)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [activeTab, setActiveTab] = useState<'general' | 'connection' | 'data' | 'about'>('general')

  useEffect(() => {
    const savedUrl = localStorage.getItem("lm-studio-url")
    const savedTemp = localStorage.getItem("lm-studio-temperature")
    if (savedUrl) setLmStudioUrl(savedUrl)
    if (savedTemp) setTemperature(parseFloat(savedTemp))
  }, [])

  const saveSettings = () => {
    localStorage.setItem("lm-studio-url", lmStudioUrl)
    localStorage.setItem("lm-studio-temperature", temperature.toString())
    toast.success(t.common.save)
  }

  const testConnection = async () => {
    setIsTestingConnection(true)
    setConnectionStatus('idle')
    try {
      const response = await fetch(`${lmStudioUrl}/v1/models`, { method: 'GET' })
      if (response.ok) {
        setConnectionStatus('success')
        toast.success(t.settings.connectionSuccess)
      } else {
        throw new Error()
      }
    } catch {
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

  const features = [
    { icon: Shield, title: "100% Private", desc: language === 'tr' ? "Tum veriler cihazinizda kalir" : "All data stays on your device" },
    { icon: Zap, title: "AI Powered", desc: language === 'tr' ? "LM Studio ile yerel LLM" : "Using local LLM via LM Studio" },
    { icon: Code2, title: "Open Source", desc: language === 'tr' ? "Sonsuza kadar ucretsiz" : "Free and open source forever" },
  ]

  const technologies = [
    "Next.js 16", "React 19", "TypeScript", "Tailwind CSS", 
    "shadcn/ui", "Framer Motion", "LM Studio"
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
                className="space-y-6"
              >
                {/* App Info */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50">
                  <Logo size={48} />
                  <div>
                    <h2 className="text-xl font-bold">Localce</h2>
                    <p className="text-sm text-muted-foreground">{t.about.description}</p>
                    <Badge variant="secondary" className="mt-2">v1.0.0</Badge>
                  </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-3 gap-3">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="text-center p-4 rounded-xl bg-muted/30"
                    >
                      <div className="inline-flex items-center justify-center size-10 rounded-xl bg-primary/10 mb-2">
                        <feature.icon className="size-5 text-primary" />
                      </div>
                      <p className="text-xs font-medium">{feature.title}</p>
                      <p className="text-[10px] text-muted-foreground">{feature.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Developer */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-600/10 border border-violet-500/20">
                  <div className="size-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    EC
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Eren Cakar</p>
                    <p className="text-xs text-muted-foreground">{t.about.developer}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button variant="ghost" size="sm" className="h-7 px-2 rounded-lg" asChild>
                        <Link href="https://erencakar.com" target="_blank">
                          <Globe className="size-3.5 mr-1" />
                          <span className="text-xs">Website</span>
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 rounded-lg" asChild>
                        <Link href="https://github.com/sudoeren" target="_blank">
                          <Github className="size-3.5 mr-1" />
                          <span className="text-xs">GitHub</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Technologies */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">{t.about.technologies}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {technologies.map((tech) => (
                      <Badge key={tech} variant="outline" className="text-[10px] font-normal">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Links */}
                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full rounded-xl gap-2" asChild>
                    <Link href="https://github.com/sudoeren/localce" target="_blank">
                      <Github className="size-4" />
                      {t.about.openSource}
                      <ExternalLink className="size-3 ml-auto" />
                    </Link>
                  </Button>
                </div>

                {/* Made with */}
                <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                  {t.about.madeWith} <Heart className="size-3 text-red-500 fill-red-500" /> in Turkey
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
