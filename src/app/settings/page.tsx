"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { 
  Settings, Sun, Moon, Monitor, Globe, Server, Palette,
  Database, Trash2, Download, Upload, RefreshCw, Check, X,
  Loader2, Zap
} from "lucide-react"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { useLanguage } from "@/contexts/language-context"
import { useOnboarding } from "@/contexts/onboarding-context"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { t, language, setLanguage } = useLanguage()
  const { resetOnboarding } = useOnboarding()
  
  const [lmStudioUrl, setLmStudioUrl] = useState("http://localhost:1234")
  const [temperature, setTemperature] = useState([0.2])
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle")

  useEffect(() => {
    const savedUrl = localStorage.getItem("localce-lm-studio-url")
    const savedTemp = localStorage.getItem("localce-temperature")
    if (savedUrl) setLmStudioUrl(savedUrl)
    if (savedTemp) setTemperature([parseFloat(savedTemp)])
  }, [])

  const saveSettings = () => {
    localStorage.setItem("localce-lm-studio-url", lmStudioUrl)
    localStorage.setItem("localce-temperature", temperature[0].toString())
    toast.success(t.common.save + "!")
  }

  const testConnection = async () => {
    setTestingConnection(true)
    setConnectionStatus("idle")
    
    try {
      const response = await fetch(`${lmStudioUrl}/v1/models`, {
        method: "GET",
      })
      
      if (response.ok) {
        setConnectionStatus("success")
        toast.success(t.settings.connectionSuccess)
      } else {
        setConnectionStatus("error")
        toast.error(t.settings.connectionFailed)
      }
    } catch {
      setConnectionStatus("error")
      toast.error(t.settings.connectionFailed)
    } finally {
      setTestingConnection(false)
    }
  }

  const exportData = () => {
    const data = {
      history: localStorage.getItem("translation-history"),
      favorites: localStorage.getItem("translation-favorites"),
      settings: {
        language,
        theme,
        lmStudioUrl,
        temperature: temperature[0],
      },
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `localce-backup-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(t.settings.exportData)
  }

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (data.history) localStorage.setItem("translation-history", data.history)
        if (data.favorites) localStorage.setItem("translation-favorites", data.favorites)
        if (data.settings) {
          if (data.settings.language) setLanguage(data.settings.language)
          if (data.settings.theme) setTheme(data.settings.theme)
          if (data.settings.lmStudioUrl) setLmStudioUrl(data.settings.lmStudioUrl)
          if (data.settings.temperature) setTemperature([data.settings.temperature])
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

  const resetSettings = () => {
    setLmStudioUrl("http://localhost:1234")
    setTemperature([0.2])
    setTheme("system")
    setLanguage("en")
    localStorage.removeItem("localce-lm-studio-url")
    localStorage.removeItem("localce-temperature")
    toast.success(t.settings.reset)
  }

  const themes = [
    { value: "light", label: t.common.light, icon: Sun },
    { value: "dark", label: t.common.dark, icon: Moon },
    { value: "system", label: t.common.system, icon: Monitor },
  ]

  return (
    <div className="flex flex-col h-full min-h-svh bg-background">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/">{t.nav.translator}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-2">
                <Settings className="size-4" />
                {t.settings.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="size-5" />
                  {t.settings.appearance}
                </CardTitle>
                <CardDescription>{t.settings.appearanceDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Language */}
                <div className="space-y-2">
                  <Label>{t.settings.language}</Label>
                  <p className="text-sm text-muted-foreground">{t.settings.languageDesc}</p>
                  <Select value={language} onValueChange={(v: "en" | "tr") => setLanguage(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">
                        <span className="flex items-center gap-2">
                          <span>🇬🇧</span> English
                        </span>
                      </SelectItem>
                      <SelectItem value="tr">
                        <span className="flex items-center gap-2">
                          <span>🇹🇷</span> Turkce
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Theme */}
                <div className="space-y-2">
                  <Label>{t.settings.theme}</Label>
                  <p className="text-sm text-muted-foreground">{t.settings.themeDesc}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {themes.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setTheme(t.value)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                          theme === t.value
                            ? "border-primary bg-primary/5"
                            : "border-transparent bg-muted/50 hover:bg-muted"
                        )}
                      >
                        <t.icon className="size-5" />
                        <span className="text-sm font-medium">{t.label}</span>
                        {theme === t.value && (
                          <Check className="size-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="size-5" />
                  {t.settings.connection}
                </CardTitle>
                <CardDescription>{t.settings.connectionDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t.settings.lmStudioUrl}</Label>
                  <p className="text-sm text-muted-foreground">{t.settings.lmStudioUrlDesc}</p>
                  <div className="flex gap-2">
                    <Input
                      value={lmStudioUrl}
                      onChange={(e) => setLmStudioUrl(e.target.value)}
                      placeholder="http://localhost:1234"
                    />
                    <Button
                      variant="outline"
                      onClick={testConnection}
                      disabled={testingConnection}
                      className="shrink-0"
                    >
                      {testingConnection ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : connectionStatus === "success" ? (
                        <Check className="size-4 text-green-500" />
                      ) : connectionStatus === "error" ? (
                        <X className="size-4 text-destructive" />
                      ) : (
                        <Zap className="size-4" />
                      )}
                      <span className="ml-2 hidden sm:inline">{t.settings.testConnection}</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Model Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="size-5" />
                  {t.settings.model}
                </CardTitle>
                <CardDescription>{t.settings.modelDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>{t.settings.temperature}</Label>
                    <Badge variant="secondary">{temperature[0]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{t.settings.temperatureDesc}</p>
                  <Slider
                    value={temperature}
                    onValueChange={setTemperature}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="size-5" />
                  {t.settings.data}
                </CardTitle>
                <CardDescription>{t.settings.dataDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={exportData} className="gap-2">
                    <Download className="size-4" />
                    {t.settings.exportData}
                  </Button>
                  <Button variant="outline" asChild className="gap-2">
                    <label>
                      <Upload className="size-4" />
                      {t.settings.importData}
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={importData}
                      />
                    </label>
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="gap-2 text-destructive hover:text-destructive">
                        <Trash2 className="size-4" />
                        {t.settings.clearData}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t.settings.clearDataTitle}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t.settings.clearDataDesc}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={clearAllData}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t.common.delete}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <Separator />

                <div className="flex flex-wrap gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" className="gap-2">
                        <RefreshCw className="size-4" />
                        {t.settings.reset}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t.settings.resetTitle}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t.settings.resetDesc}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={resetSettings}>
                          {t.settings.reset}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button variant="ghost" onClick={resetOnboarding} className="gap-2">
                    <Globe className="size-4" />
                    Show Onboarding
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button onClick={saveSettings} className="w-full gap-2">
              <Check className="size-4" />
              {t.common.save}
            </Button>

          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
