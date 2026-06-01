"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sun, Moon, Monitor, Globe, 
  Trash2, Download, Upload, RefreshCw, Check, Loader2, Zap,
  GitFork, Code2, ArrowUpRight, Bell, Volume2,
  Shield, Terminal, LayoutGrid, Sliders, HardDrive, Info, User, ExternalLink,
  Key, Server, Cloud, Eye, EyeOff
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
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useOnboarding } from "@/contexts/onboarding-context"
import { Logo } from "@/components/logo"
import Link from "next/link"
import { type ProviderType, PROVIDERS, KNOWN_MODELS } from "@/lib/providers"

type Model = {
  id: string
  object: string
}

type TabType = 'appearance' | 'connection' | 'notifications' | 'data' | 'about'

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()
  const { resetOnboarding } = useOnboarding()
  const [activeTab, setActiveTab] = useState<TabType>('appearance')
  
  // Provider settings
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>("lmstudio")
  const [apiUrl, setApiUrl] = useState("http://localhost:1234")
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [temperature, setTemperature] = useState(0.2)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationSound, setNotificationSound] = useState(true)

  const fetchModels = useCallback(async (url: string, provider: ProviderType, key?: string) => {
    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, provider, apiKey: key }),
      })
      const data = await response.json()
      if (data.success) {
        setModels(data.models)
        if (!selectedModel && data.models.length > 0) {
          const savedModel = localStorage.getItem("llm-model")
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
    const savedProvider = localStorage.getItem("llm-provider") as ProviderType | null
    const savedUrl = localStorage.getItem("llm-api-url")
    const savedKey = sessionStorage.getItem("llm-api-key")
    const savedTemp = localStorage.getItem("llm-temperature")
    const savedModel = localStorage.getItem("llm-model")
    const savedNotifs = localStorage.getItem("localce-notifications")
    const savedNotifSound = localStorage.getItem("localce-notification-sound")

    // Migration from old lm-studio keys
    if (!savedProvider) {
      const oldUrl = localStorage.getItem("lm-studio-url")
      const oldModel = localStorage.getItem("lm-studio-model")
      const oldTemp = localStorage.getItem("lm-studio-temperature")
      if (oldUrl) {
        localStorage.setItem("llm-provider", "lmstudio")
        localStorage.setItem("llm-api-url", oldUrl)
        if (oldModel) localStorage.setItem("llm-model", oldModel)
        if (oldTemp) localStorage.setItem("llm-temperature", oldTemp)
        setSelectedProvider("lmstudio")
        setApiUrl(oldUrl)
        if (oldModel) setSelectedModel(oldModel)
        if (oldTemp) setTemperature(parseFloat(oldTemp))
        fetchModels(oldUrl, "lmstudio")
      }
    } else {
      setSelectedProvider(savedProvider)
      if (savedUrl) {
        setApiUrl(savedUrl)
        fetchModels(savedUrl, savedProvider, savedKey || undefined)
      } else {
        const defaultUrl = PROVIDERS[savedProvider]?.defaultUrl || ''
        setApiUrl(defaultUrl)
      }
    }
    
    if (savedKey) setApiKey(savedKey)
    if (savedTemp) setTemperature(parseFloat(savedTemp))
    if (savedModel) setSelectedModel(savedModel)
    if (savedNotifs) setNotificationsEnabled(savedNotifs === 'true')
    if (savedNotifSound) setNotificationSound(savedNotifSound !== 'false')
  }, [fetchModels])

  const handleProviderChange = (provider: ProviderType) => {
    setSelectedProvider(provider)
    const info = PROVIDERS[provider]
    setApiUrl(info.defaultUrl)
    setApiKey("")
    setModels([])
    setSelectedModel(info.defaultModel)
    setConnectionStatus('idle')
    
    // Load known models for providers that have them
    const knownModels = KNOWN_MODELS[provider]
    if (knownModels) {
      setModels(knownModels.map(id => ({ id, object: 'model' })))
      if (!info.defaultModel && knownModels.length > 0) {
        setSelectedModel(knownModels[0])
      }
    }
  }

  const handleNotificationsChange = (checked: boolean) => {
    if (checked && Notification.permission !== 'granted') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setNotificationsEnabled(true)
          localStorage.setItem("localce-notifications", "true")
          toast.success(t.settings.notifications)
        } else {
          setNotificationsEnabled(false)
          localStorage.setItem("localce-notifications", "false")
          toast.error("Notification permission denied")
        }
      })
    } else {
      setNotificationsEnabled(checked)
      localStorage.setItem("localce-notifications", String(checked))
    }
  }

  const handleNotificationSoundChange = (checked: boolean) => {
    setNotificationSound(checked)
    localStorage.setItem("localce-notification-sound", String(checked))
  }

  const saveSettings = () => {
    localStorage.setItem("llm-provider", selectedProvider)
    localStorage.setItem("llm-api-url", apiUrl)
    localStorage.setItem("llm-temperature", temperature.toString())
    // apiKey intentionally not persisted to storage (kept in memory only)
    if (selectedModel) localStorage.setItem("llm-model", selectedModel)

    // Also keep backward-compatible keys for sidebar/navbar connection checks
    localStorage.setItem("lm-studio-url", apiUrl)
    if (selectedModel) localStorage.setItem("lm-studio-model", selectedModel)
    localStorage.setItem("lm-studio-temperature", temperature.toString())

    toast.success(t.settings.saved)
  }

  const exportData = () => {
    const data = {
      history: JSON.parse(localStorage.getItem("translation-history") || "[]"),
      favorites: JSON.parse(localStorage.getItem("translation-favorites") || "[]"),
      settings: { 
        provider: selectedProvider, 
        apiUrl, 
        temperature, 
        language, 
        theme, 
        notificationsEnabled, 
        notificationSound,
        model: selectedModel,
      }
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
          if (data.settings.provider) {
            setSelectedProvider(data.settings.provider)
            handleProviderChange(data.settings.provider)
          }
          // Support old format
          if (data.settings.lmStudioUrl && !data.settings.apiUrl) {
            setApiUrl(data.settings.lmStudioUrl)
          } else if (data.settings.apiUrl) {
            setApiUrl(data.settings.apiUrl)
          }
          if (data.settings.temperature) setTemperature(data.settings.temperature)
          if (data.settings.language) setLanguage(data.settings.language)
          if (data.settings.theme) setTheme(data.settings.theme)
          if (data.settings.model) setSelectedModel(data.settings.model)
          if (data.settings.notificationsEnabled !== undefined) handleNotificationsChange(data.settings.notificationsEnabled)
          if (data.settings.notificationSound !== undefined) handleNotificationSoundChange(data.settings.notificationSound)
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
    resetOnboarding()
  }

  const testConnection = async () => {
    setIsTestingConnection(true)
    setConnectionStatus('idle')
    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: apiUrl, 
          provider: selectedProvider, 
          apiKey: apiKey || undefined 
        }),
      })
      const data = await response.json()
      if (data.success) {
        setConnectionStatus('success')
        await fetchModels(apiUrl, selectedProvider, apiKey || undefined)
        toast.success(t.settings.connectionSuccess)
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

  const providerInfo = PROVIDERS[selectedProvider]

  const sidebarItems = [
    { id: 'appearance', label: t.settings.appearance, icon: LayoutGrid },
    { id: 'connection', label: t.settings.connection, icon: Sliders },
    { id: 'notifications', label: t.settings.notifications, icon: Bell },
    { id: 'data', label: t.settings.data, icon: HardDrive },
    { id: 'about', label: t.nav.about, icon: Info },
  ] as const

  return (
    <div className="h-full flex items-center justify-center p-2 md:p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl h-full md:h-[700px] bg-card border border-border rounded-2xl md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Mobile Tab Bar - horizontal scroll on mobile */}
        <div className="md:hidden border-b border-border bg-muted/20 shrink-0 overflow-x-auto custom-scrollbar">
          <nav className="flex items-center gap-1 p-2 min-w-max">
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="size-3.5" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-64 border-r border-border bg-muted/20 flex-col p-6 space-y-8">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Logo size={24} />
            </div>
            <h1 className="font-bold text-lg tracking-tight">{t.settings.title}</h1>
          </div>

          <nav className="flex-1 space-y-1">
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative",
                    isActive 
                      ? "text-foreground bg-accent/50 shadow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className={cn(
                    "size-4.5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground/50"
                  )} />
                  <span className="text-sm font-medium relative z-10">{item.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-active-indicator"
                      className="w-1 h-4 bg-primary rounded-full absolute left-0" 
                    />
                  )}
                </button>
              )
            })}
          </nav>

          <div className="pt-6 border-t border-border space-y-4">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/30 border border-border">
               <div className={cn(
                 "size-1.5 rounded-full",
                 connectionStatus === 'success' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-muted-foreground/30"
               )} />
               <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                 {connectionStatus === 'success' ? t.settings.coreOnline : t.settings.coreOffline}
               </span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-muted/[0.02]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
              transition={{ duration: 0.2 }}
              className="flex-1 p-12 overflow-y-auto custom-scrollbar"
            >
              {activeTab === 'appearance' && (
                <div className="max-w-2xl space-y-10">
                  <SectionHeader title={t.settings.appearance} desc={t.settings.appearanceDesc} icon={LayoutGrid} />
                  
                  <div className="space-y-4">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground ml-1">{t.settings.colorTheme}</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'light', icon: Sun, label: t.common.light },
                        { id: 'dark', icon: Moon, label: t.common.dark },
                        { id: 'system', icon: Monitor, label: t.common.system }
                      ].map((tItem) => (
                        <button
                          key={tItem.id}
                          onClick={() => setTheme(tItem.id)}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200",
                            theme === tItem.id 
                              ? "bg-foreground text-background border-foreground shadow-lg" 
                              : "bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          <tItem.icon className="size-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">{tItem.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground ml-1">{t.settings.systemLanguage}</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'en', native: 'English', flag: '🇺🇸' },
                        { id: 'tr', native: 'Türkçe', flag: '🇹🇷' },
                        { id: 'de', native: 'Deutsch', flag: '🇩🇪' },
                        { id: 'fr', native: 'Français', flag: '🇫🇷' },
                        { id: 'es', native: 'Español', flag: '🇪🇸' }
                      ].map((l) => (
                        <button
                          key={l.id}
                          onClick={() => setLanguage(l.id as any)}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200",
                            language === l.id 
                              ? "bg-primary/10 border-primary/30 text-primary" 
                              : "bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          <span className="text-xl">{l.flag}</span>
                          <span className="text-sm font-bold">{l.native}</span>
                          {language === l.id && <Check className="size-4 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'connection' && (
                <div className="max-w-2xl space-y-8">
                  <SectionHeader title={t.settings.connection} desc={t.settings.connectionDesc} icon={Sliders} />
                  
                  <div className="space-y-6">
                    {/* Provider Selection */}
                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground ml-1">{t.settings.provider}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.entries(PROVIDERS) as [ProviderType, typeof PROVIDERS[ProviderType]][]).map(([key, info]) => (
                          <button
                            key={key}
                            onClick={() => handleProviderChange(key)}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left",
                              selectedProvider === key
                                ? "bg-primary/10 border-primary/30 text-foreground shadow-sm"
                                : "bg-muted/20 border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
                            )}
                          >
                            <div className={cn(
                              "size-8 rounded-lg flex items-center justify-center shrink-0",
                              selectedProvider === key ? "bg-primary/20" : "bg-muted/30"
                            )}>
                              {info.requiresApiKey ? (
                                <Cloud className={cn("size-4", selectedProvider === key && "text-primary")} />
                              ) : (
                                <Server className={cn("size-4", selectedProvider === key && "text-primary")} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">{info.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{info.description}</p>
                            </div>
                            {selectedProvider === key && <Check className="size-3.5 text-primary shrink-0 ml-auto" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* API URL */}
                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground ml-1">{t.settings.engineUrl}</Label>
                      <div className="flex gap-2">
                        <Input
                          value={apiUrl}
                          onChange={(e) => setApiUrl(e.target.value)}
                          className="h-12 pl-5 rounded-xl bg-background border-border focus:border-primary transition-all font-mono text-sm"
                          placeholder={providerInfo.placeholder}
                        />
                        <Button
                          variant="outline"
                          className="h-12 px-6 rounded-xl border-border bg-muted/20"
                          onClick={testConnection}
                          disabled={isTestingConnection}
                        >
                          {isTestingConnection ? <Loader2 className="size-4 animate-spin mr-2" /> : <RefreshCw className="size-4 mr-2" />}
                          {t.settings.testConnection}
                        </Button>
                      </div>
                    </div>

                    {/* API Key (for providers that require it) */}
                    {providerInfo.requiresApiKey && (
                      <div className="space-y-3">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground ml-1">{t.settings.apiKey}</Label>
                        <div className="relative">
                          <Input
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            type={showApiKey ? "text" : "password"}
                            className="h-12 pl-5 pr-12 rounded-xl bg-background border-border focus:border-primary transition-all font-mono text-sm"
                            placeholder={t.settings.apiKeyPlaceholder}
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed ml-1">{t.settings.apiKeyDesc}</p>
                      </div>
                    )}

                    {/* Model Selection */}
                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground ml-1">{t.settings.activeModel}</Label>
                      {models.length > 0 ? (
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                          <SelectTrigger className="h-12 rounded-xl bg-background border-border px-5">
                            <SelectValue placeholder="Select Model" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {models.map((m) => (
                              <SelectItem key={m.id} value={m.id}>{m.id}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="h-12 pl-5 rounded-xl bg-background border-border focus:border-primary transition-all font-mono text-sm"
                          placeholder={providerInfo.defaultModel || "Enter model name..."}
                        />
                      )}
                    </div>

                    {/* Temperature */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground ml-1">{t.settings.temperature}</Label>
                        <span className="text-xs font-mono font-bold text-primary">{temperature.toFixed(1)}</span>
                      </div>
                      <Slider
                        value={[temperature]}
                        onValueChange={(v) => setTemperature(v[0])}
                        min={0}
                        max={1}
                        step={0.1}
                      />
                      <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">{t.settings.temperatureDesc}</p>
                    </div>

                    <Button onClick={saveSettings} className="w-full h-12 rounded-xl font-bold text-sm shadow-xl shadow-primary/10">
                      {t.settings.saveConfig}
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="max-w-2xl space-y-6">
                  <SectionHeader title={t.settings.notifications} desc={t.settings.notificationsDesc} icon={Bell} />
                  
                  <div className="space-y-3">
                    <ToggleTile 
                      icon={Bell} 
                      title={t.settings.enableNotifications} 
                      desc={t.settings.notifyOnComplete} 
                      checked={notificationsEnabled} 
                      onChange={handleNotificationsChange} 
                    />
                    <ToggleTile 
                      icon={Volume2} 
                      title={t.settings.audioFeedback} 
                      desc={t.settings.audioFeedbackDesc} 
                      checked={notificationSound} 
                      onChange={handleNotificationSoundChange} 
                      disabled={!notificationsEnabled}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'data' && (
                <div className="max-w-2xl space-y-12">
                  <div className="space-y-6">
                    <SectionHeader title={t.settings.vaultTitle} desc={t.settings.vaultDesc} icon={HardDrive} />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/20 to-transparent rounded-[24px] blur opacity-0 group-hover:opacity-100 transition duration-500" />
                        <DataButton 
                          icon={Download} 
                          title={t.settings.exportData} 
                          desc="Tüm geçmişinizi ve ayarlarınızı JSON formatında indirin."
                          onClick={exportData} 
                          className="bg-card relative"
                        />
                      </div>
                      
                      <label className="block cursor-pointer group relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/20 to-transparent rounded-[24px] blur opacity-0 group-hover:opacity-100 transition duration-500" />
                        <DataButton 
                          icon={Upload} 
                          title={t.settings.importData} 
                          desc="Daha önce yedeklediğiniz verileri sisteme geri yükleyin."
                          onClick={() => {}} 
                          className="bg-card relative"
                        />
                        <input type="file" accept=".json" className="hidden" onChange={importData} />
                      </label>
                    </div>

                    <div className="p-6 rounded-[24px] bg-primary/[0.03] border border-primary/10 flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-2xl">
                        <Info className="size-5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground">Gizlilik Notu</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Verileriniz tamamen yerel olarak tarayıcınızda (localStorage) saklanır. 
                          Dışa aktarma işlemi bu verilerin bir kopyasını oluşturur, silme işlemi ise kalıcı olarak kaldırır.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-10 border-t border-border/50 space-y-8">
                    <SectionHeader 
                      title={t.settings.purgeTitle} 
                      desc={t.settings.purgeDesc} 
                      icon={Shield} 
                      color="text-destructive" 
                    />
                    
                    <div className="grid gap-3">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="w-full flex items-center justify-between p-6 rounded-[24px] border border-destructive/10 bg-destructive/[0.02] hover:bg-destructive/[0.04] transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity translate-x-4 -translate-y-4">
                              <Trash2 size={80} />
                            </div>
                            <div className="flex items-center gap-5 relative z-10">
                              <div className="p-3 bg-destructive/10 rounded-2xl group-hover:scale-110 transition-transform">
                                <Trash2 className="size-5 text-destructive" />
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-destructive text-sm tracking-tight">{t.settings.clearData}</p>
                                <p className="text-[11px] text-destructive/50 font-medium">{t.settings.clearDataDesc}</p>
                              </div>
                            </div>
                            <Check className="size-4 text-destructive/20 group-hover:text-destructive transition-colors relative z-10" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-popover border-border rounded-[32px]">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-bold tracking-tight">{t.settings.clearDataTitle}</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed italic">
                              "{t.settings.clearDataDesc}"
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-3 pt-4">
                            <AlertDialogCancel className="rounded-2xl border-border bg-muted/50">{t.common.cancel}</AlertDialogCancel>
                            <AlertDialogAction onClick={clearAllData} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-2xl px-8">
                              {t.common.delete}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <button 
                        onClick={resetOnboarding}
                        className="w-full flex items-center justify-between p-6 rounded-[24px] border border-border bg-muted/10 hover:bg-muted/20 transition-all group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity translate-x-4 -translate-y-4">
                          <RefreshCw size={80} />
                        </div>
                        <div className="flex items-center gap-5 relative z-10">
                          <div className="p-3 bg-muted/20 rounded-2xl group-hover:rotate-180 transition-transform duration-700">
                            <RefreshCw className="size-5 text-muted-foreground" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-sm tracking-tight">{t.settings.resetOnboarding}</p>
                            <p className="text-[11px] text-muted-foreground font-medium">{t.settings.resetOnboardingDesc}</p>
                          </div>
                        </div>
                        <ArrowUpRight className="size-4 text-muted-foreground/30 group-hover:text-foreground transition-colors relative z-10" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="max-w-2xl mx-auto space-y-10">
                  {/* Brand & Identity Header */}
                  <div className="relative p-12 rounded-[48px] bg-gradient-to-br from-primary/[0.03] via-transparent to-transparent border border-primary/5 overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-1000">
                      <Logo size={240} />
                    </div>
                    
                    <div className="relative z-10 space-y-8">
                      <div className="space-y-4">
                        <h2 className="text-7xl font-black tracking-tighter leading-none text-foreground">Localce</h2>
                        <p className="text-lg text-muted-foreground/80 font-medium leading-relaxed max-w-md">
                          {t.about.description}
                        </p>
                      </div>

                      {/* Developer & Project Info - Unified Layout */}
                      <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center gap-8 border-t border-border/40">
                        <Link href="https://erencakar.com" target="_blank" className="group/dev">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-2 group-hover/dev:text-primary transition-colors">{t.about.developer}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold tracking-tight group-hover/dev:underline decoration-primary/30 underline-offset-8 transition-all">Eren Çakar</span>
                            <ArrowUpRight className="size-4 text-muted-foreground/20 group-hover/dev:text-primary group-hover/dev:translate-x-0.5 group-hover/dev:-translate-y-0.5 transition-all" />
                          </div>
                        </Link>

                        <div className="hidden sm:block w-px h-10 bg-border/40" />

                        <Link href="https://github.com/sudoeren/localce" target="_blank" className="group/code">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-2 group-hover/code:text-primary transition-colors">{t.about.sourceCode}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold tracking-tight group-hover/code:underline decoration-primary/30 underline-offset-8 transition-all">{t.about.openSource}</span>
                            <GitFork className="size-5 text-muted-foreground/30 group-hover/code:text-foreground transition-colors" />
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Footer Meta */}
                  <div className="flex justify-center px-6">
                    <div className="flex items-center gap-3 px-4 py-1.5 rounded-2xl bg-muted/30 border border-border/50">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{t.about.version}</span>
                      <div className="w-px h-3 bg-border" />
                      <span className="text-xs font-bold font-mono">1.0.0</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

/* SUB-COMPONENTS */

function SectionHeader({ title, desc, icon: Icon, color = "text-foreground" }: { title: string, desc: string, icon: any, color?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <Icon className={cn("size-5", color)} />
        <h2 className={cn("text-2xl font-bold tracking-tight", color)}>{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground font-medium ml-8 leading-relaxed">{desc}</p>
    </div>
  )
}

function ToggleTile({ icon: Icon, title, desc, checked, onChange, disabled = false }: { icon: any, title: string, desc: string, checked: boolean, onChange: any, disabled?: boolean }) {
  return (
    <div className={cn(
      "flex items-center justify-between p-5 rounded-2xl border border-border bg-muted/10 transition-all",
      disabled && "opacity-40 pointer-events-none"
    )}>
      <div className="flex items-center gap-4">
        <div className="p-2 bg-muted/20 rounded-xl">
          <Icon className="size-4.5 text-muted-foreground" />
        </div>
        <div className="text-left">
          <p className="text-sm font-bold">{title}</p>
          <p className="text-[11px] text-muted-foreground font-medium">{desc}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="scale-90" />
    </div>
  )
}

function DataButton({ icon: Icon, title, desc, onClick, className }: { icon: any, title: string, desc?: string, onClick: any, className?: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-5 p-6 rounded-[24px] border border-border bg-muted/10 hover:bg-muted/20 transition-all group text-left",
        className
      )}
    >
      <div className="p-3 bg-muted/20 rounded-2xl group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all shrink-0">
        <Icon className="size-5 transition-colors" />
      </div>
      <div className="space-y-1">
        <p className="font-bold text-sm tracking-tight">{title}</p>
        {desc && <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">{desc}</p>}
      </div>
    </button>
  )
}

function SocialLinkItem({ icon: Icon, label, href }: { icon: any, label: string, href: string }) {
  return (
    <Link 
      href={href} 
      target="_blank"
      className="flex items-center gap-3 px-4 py-2 rounded-xl border border-border bg-muted/10 hover:bg-muted/20 hover:border-primary/20 hover:text-primary transition-all group"
    >
      <Icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
      <span className="text-xs font-bold tracking-tight">{label}</span>
      <ExternalLink className="size-3 opacity-30 group-hover:opacity-100 transition-all" />
    </Link>
  )
}
