"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Settings, Sun, Moon, Monitor, Globe, Thermometer,
  Trash2, Download, Upload, RefreshCw, Check, Loader2, Zap
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

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [lmStudioUrl, setLmStudioUrl] = useState("http://localhost:1234")
  const [temperature, setTemperature] = useState(0.2)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')

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

  return (
    <div className="h-svh flex flex-col p-4 pb-24 overflow-y-auto">
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

      {/* Settings Grid */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto w-full space-y-4"
      >
        {/* Appearance */}
        <div className="bg-card/50 backdrop-blur-xl border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-primary/10">
              <Sun className="size-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">{t.settings.appearance}</h3>
              <p className="text-xs text-muted-foreground">{t.settings.appearanceDesc}</p>
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">{t.settings.theme}</Label>
            <div className="grid grid-cols-3 gap-2">
              {themes.map((t2) => (
                <button
                  key={t2.value}
                  onClick={() => setTheme(t2.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                    theme === t2.value
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-muted/50 hover:bg-muted"
                  )}
                >
                  <t2.icon className={cn("size-5", theme === t2.value && "text-primary")} />
                  <span className="text-xs">{t2.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-3 mt-4 pt-4 border-t">
            <Label className="text-xs text-muted-foreground">{t.settings.language}</Label>
            <div className="grid grid-cols-2 gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => setLanguage(lang.value as "en" | "tr")}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                    language === lang.value
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-muted/50 hover:bg-muted"
                  )}
                >
                  <Globe className={cn("size-4", language === lang.value && "text-primary")} />
                  <span className="text-sm">{lang.label}</span>
                  {language === lang.value && <Check className="size-4 text-primary ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Connection */}
        <div className="bg-card/50 backdrop-blur-xl border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-green-500/10">
              <Zap className="size-4 text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{t.settings.connection}</h3>
              <p className="text-xs text-muted-foreground">{t.settings.connectionDesc}</p>
            </div>
            {connectionStatus === 'success' && (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Connected</Badge>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">{t.settings.lmStudioUrl}</Label>
            <div className="flex gap-2">
              <Input
                value={lmStudioUrl}
                onChange={(e) => setLmStudioUrl(e.target.value)}
                className="flex-1 h-10 rounded-xl bg-muted/50 border-transparent"
                placeholder="http://localhost:1234"
              />
              <Button
                variant="outline"
                className="rounded-xl gap-2"
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
          </div>

          {/* Temperature */}
          <div className="space-y-3 mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">{t.settings.temperature}</Label>
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
            <p className="text-[10px] text-muted-foreground">{t.settings.temperatureDesc}</p>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-card/50 backdrop-blur-xl border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-orange-500/10">
              <Download className="size-4 text-orange-500" />
            </div>
            <div>
              <h3 className="font-medium">{t.settings.data}</h3>
              <p className="text-xs text-muted-foreground">{t.settings.dataDesc}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="rounded-xl gap-2" onClick={exportData}>
              <Download className="size-4" />
              {t.settings.exportData}
            </Button>
            <Button variant="outline" className="rounded-xl gap-2" asChild>
              <label className="cursor-pointer">
                <Upload className="size-4" />
                {t.settings.importData}
                <input type="file" accept=".json" className="hidden" onChange={importData} />
              </label>
            </Button>
          </div>

          <div className="mt-4 pt-4 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full rounded-xl gap-2 text-destructive hover:text-destructive">
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
        </div>

        {/* Save Button */}
        <Button onClick={saveSettings} className="w-full h-12 rounded-xl text-base">
          {t.common.save}
        </Button>
      </motion.div>
    </div>
  )
}
