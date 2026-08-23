"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

import {
  Sun, Moon, Monitor,
  Trash, Download, Upload, ArrowsClockwise, Check, Spinner,
  Bell, SpeakerHigh, Info,
  ComputerTower, Cloud, SquaresFour, Sliders,
  HardDrive, ArrowUpRight, GitFork, MagnifyingGlass, CaretDown, X
} from "@phosphor-icons/react"
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useLanguage } from "@/contexts/language-context"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { cn, decodeApiKey, safeJSONParse, safeSetItem } from "@/lib/utils"
import { useOnboarding } from "@/contexts/onboarding-context"
import { Logo } from "@/components/logo"
import { openExternal } from "@/lib/open-external"
import { type ProviderType, PROVIDERS, KNOWN_MODELS } from "@/lib/providers"
import { clientTestConnection } from "@/lib/client-test-connection"
import { clientFetchModels } from "@/lib/client-models"
import { version } from '../../../package.json'

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
  const [hasApiKey, setHasApiKey] = useState(false)
  const [temperature, setTemperature] = useState(0.2)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationSound, setNotificationSound] = useState(true)

  const fetchModels = useCallback(async (url: string, provider: ProviderType, key?: string, currentSelected?: string) => {
    try {
      const data = await clientFetchModels({ url, provider, apiKey: key })
      if (data.success) {
        setModels(data.models)
        const savedModel = localStorage.getItem("llm-model")
        if (savedModel && data.models.some((m: Model) => m.id === savedModel)) {
          setSelectedModel(savedModel)
        } else if (currentSelected && data.models.some((m: Model) => m.id === currentSelected)) {
          setSelectedModel(currentSelected)
        } else if (data.models.length > 0) {
          setSelectedModel(data.models[0].id)
        }
      }
    } catch (error) {
      console.error("Failed to fetch models", error)
    }
  }, [])

  useEffect(() => {
    const savedProvider = localStorage.getItem("llm-provider") as ProviderType | null
    const savedUrl = localStorage.getItem("llm-api-url")
    const savedKey = (() => { const k = sessionStorage.getItem("llm-api-key"); return k ? decodeApiKey(k) : undefined })()
    const savedTemp = localStorage.getItem("llm-temperature")
    const savedModel = localStorage.getItem("llm-model")
    const savedNotifs = localStorage.getItem("karpa-notifications")
    const savedNotifSound = localStorage.getItem("karpa-notification-sound")

    // Migration from old lm-studio keys
    if (!savedProvider) {
      const oldUrl = localStorage.getItem("lm-studio-url")
      const oldModel = localStorage.getItem("lm-studio-model")
      const oldTemp = localStorage.getItem("lm-studio-temperature")
      if (oldUrl) {
        safeSetItem("llm-provider", "lmstudio")
        safeSetItem("llm-api-url", oldUrl)
        if (oldModel) safeSetItem("llm-model", oldModel)
        if (oldTemp) safeSetItem("llm-temperature", oldTemp)
        setSelectedProvider("lmstudio")
        setApiUrl(oldUrl)
        if (oldModel) setSelectedModel(oldModel)
        if (oldTemp) setTemperature(parseFloat(oldTemp))
        fetchModels(oldUrl, "lmstudio", undefined, oldModel || undefined)
      }
    } else {
      setSelectedProvider(savedProvider)
      if (savedUrl) {
        setApiUrl(savedUrl)
        fetchModels(savedUrl, savedProvider, savedKey || undefined, savedModel || undefined)
      } else {
        const defaultUrl = PROVIDERS[savedProvider]?.defaultUrl || ''
        setApiUrl(defaultUrl)
      }
    }

    if (savedKey) setHasApiKey(true)
    if (savedTemp) setTemperature(parseFloat(savedTemp))
    if (savedModel) setSelectedModel(savedModel)
    if (savedNotifs) setNotificationsEnabled(savedNotifs === 'true')
    if (savedNotifSound) setNotificationSound(savedNotifSound !== 'false')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-detect connection on mount and when provider/url changes
  useEffect(() => {
    const savedUrl = localStorage.getItem("llm-api-url")
    const savedProvider = localStorage.getItem("llm-provider") as ProviderType | null
    const url = savedUrl || apiUrl
    const provider = savedProvider || selectedProvider

    const checkConnection = async () => {
      try {
        const savedKey = (() => { const k = sessionStorage.getItem("llm-api-key"); return k ? decodeApiKey(k) : undefined })()
        const result = await clientTestConnection({ url, provider, apiKey: savedKey })
        setConnectionStatus(result.success ? 'success' : 'error')
      } catch {
        setConnectionStatus('error')
      }
    }

    checkConnection()
  }, [selectedProvider, apiUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleProviderChange = (provider: ProviderType) => {
    setSelectedProvider(provider)
    const info = PROVIDERS[provider]
    setApiUrl(info.defaultUrl)
    setApiKey("")
    setHasApiKey(false)
    setModels([])
    setSelectedModel(info.defaultModel)
    setConnectionStatus('idle')

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
          safeSetItem("karpa-notifications", "true")
          toast.success(t.settings.notifications)
        } else {
          setNotificationsEnabled(false)
          safeSetItem("karpa-notifications", "false")
          toast.error(t.settings.notificationDenied)
        }
      })
    } else {
      setNotificationsEnabled(checked)
      safeSetItem("karpa-notifications", String(checked))
    }
  }

  const handleNotificationSoundChange = (checked: boolean) => {
    setNotificationSound(checked)
    safeSetItem("karpa-notification-sound", String(checked))
  }

  const saveSettings = () => {
    safeSetItem("llm-provider", selectedProvider)
    safeSetItem("llm-api-url", apiUrl)
    safeSetItem("llm-temperature", temperature.toString())
    if (selectedModel) safeSetItem("llm-model", selectedModel)
    if (apiKey) {
      sessionStorage.setItem("llm-api-key", btoa(apiKey))
      setHasApiKey(true)
    } else if (!hasApiKey) {
      sessionStorage.removeItem("llm-api-key")
    }

    safeSetItem("lm-studio-url", apiUrl)
    if (selectedModel) safeSetItem("lm-studio-model", selectedModel)
    safeSetItem("lm-studio-temperature", temperature.toString())

    toast.success(t.settings.saved)
  }

  const exportData = () => {
    const data = {
      history: safeJSONParse(localStorage.getItem("translation-history"), []),
      favorites: safeJSONParse(localStorage.getItem("translation-favorites"), []),
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
    a.download = `karpa-backup-${new Date().toISOString().split('T')[0]}.json`
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
        const result = event.target?.result
        if (typeof result !== 'string') throw new Error('Invalid file')
        const data = JSON.parse(result)
        if (data.history) safeSetItem("translation-history", JSON.stringify(data.history))
        if (data.favorites) safeSetItem("translation-favorites", JSON.stringify(data.favorites))
        if (data.settings) {
          if (data.settings.provider) {
            setSelectedProvider(data.settings.provider)
            handleProviderChange(data.settings.provider)
          }
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
        toast.error(t.settings.invalidBackup)
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
    const effectiveKey = apiKey || (() => { const k = sessionStorage.getItem("llm-api-key"); return k ? decodeApiKey(k) : undefined })()
    try {
      const result = await clientTestConnection({
        url: apiUrl,
        provider: selectedProvider,
        apiKey: effectiveKey,
      })
      if (result.success) {
        setConnectionStatus('success')
        await fetchModels(apiUrl, selectedProvider, effectiveKey, selectedModel || undefined)
        toast.success(t.settings.connectionSuccess)
      } else {
        setConnectionStatus('error')
        toast.error(result.error || t.settings.connectionFailed)
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
    { id: 'appearance', label: t.settings.appearance, icon: SquaresFour },
    { id: 'connection', label: t.settings.connection, icon: Sliders },
    { id: 'notifications', label: t.settings.notifications, icon: Bell },
    { id: 'data', label: t.settings.data, icon: HardDrive },
    { id: 'about', label: t.nav.about, icon: Info },
  ] as const

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden border-b border-border shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Logo size={20} />
            <span className="font-semibold text-sm">{t.settings.title}</span>
          </div>
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium",
            connectionStatus === 'success' ? "text-emerald-600" : "text-muted-foreground"
          )}>
            <span className={cn("size-1.5 rounded-full", connectionStatus === 'success' ? "bg-emerald-500" : "bg-muted-foreground/30")} />
            {connectionStatus === 'success' ? t.settings.coreOnline : t.settings.coreOffline}
          </div>
        </div>
        <div className="flex gap-1 px-3 pb-3 overflow-x-auto scrollbar-none">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                activeTab === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="size-3.5" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-60 shrink-0 border-r border-border/40 bg-background flex-col">
          <div className="p-5 pb-4">
            <div className="flex items-center gap-2.5">
              <Logo size={22} />
              <h1 className="font-semibold text-base">{t.settings.title}</h1>
            </div>
            <p className="text-[11px] text-muted-foreground/60 mt-1.5">v{version}</p>
          </div>

          <nav className="flex-1 px-3 space-y-0.5">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  activeTab === item.id
                    ? "bg-muted text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                )}
              >
                <item.icon className={cn("size-4", activeTab === item.id && "text-primary")} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-5 pt-4 border-t border-border/30">
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium",
              connectionStatus === 'success'
                ? "bg-emerald-500/10 text-emerald-600"
                : "text-muted-foreground/60"
            )}>
              <span className={cn(
                "size-1.5 rounded-full",
                connectionStatus === 'success' ? "bg-emerald-500" : "bg-muted-foreground/30"
              )} />
              {connectionStatus === 'success' ? t.settings.coreOnline : t.settings.coreOffline}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="p-4 md:p-8 lg:p-10"
            >
              {activeTab === 'appearance' && (
                <div className="max-w-2xl space-y-8">
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold tracking-tight">{t.settings.appearance}</h2>
                    <p className="text-sm text-muted-foreground">{t.settings.appearanceDesc}</p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground">{t.settings.colorTheme}</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'light', icon: Sun, label: t.common.light },
                        { id: 'dark', icon: Moon, label: t.common.dark },
                        { id: 'system', icon: Monitor, label: t.common.system }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setTheme(item.id)}
                          className={cn(
                            "flex items-center gap-2.5 p-3.5 rounded-xl border transition-colors",
                            theme === item.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <item.icon className={cn("size-4", theme === item.id ? "text-primary" : "text-muted-foreground")} />
                          <span className={cn("text-sm font-medium", theme === item.id ? "text-foreground" : "text-muted-foreground")}>
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground">{t.settings.systemLanguage}</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                            "flex items-center gap-3 p-3.5 rounded-xl border transition-colors",
                            language === l.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <span className="text-lg">{l.flag}</span>
                          <span className={cn("text-sm font-medium", language === l.id ? "text-foreground" : "text-muted-foreground")}>
                            {l.native}
                          </span>
                          {language === l.id && <Check className="size-3.5 text-primary ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'connection' && (
                <div className="max-w-2xl space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold tracking-tight">{t.settings.connection}</h2>
                    <p className="text-sm text-muted-foreground">{t.settings.connectionDesc}</p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground">{t.settings.provider}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.entries(PROVIDERS) as [ProviderType, typeof PROVIDERS[ProviderType]][]).map(([key, info]) => (
                        <button
                          key={key}
                          onClick={() => handleProviderChange(key)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border transition-colors text-left",
                            selectedProvider === key
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div className={cn(
                            "size-8 rounded-lg flex items-center justify-center shrink-0",
                            selectedProvider === key ? "bg-primary/10" : "bg-muted"
                          )}>
                            {info.requiresApiKey ? (
                              <Cloud className={cn("size-4", selectedProvider === key && "text-primary")} />
                            ) : (
                              <ComputerTower className={cn("size-4", selectedProvider === key && "text-primary")} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{info.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{info.description}</p>
                          </div>
                          {selectedProvider === key && <Check className="size-3.5 text-primary shrink-0 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground">{t.settings.engineUrl}</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                        className="h-10 px-4 rounded-xl bg-background border-border font-mono text-sm"
                        placeholder={providerInfo.placeholder}
                      />
                      <Button
                        variant="outline"
                        className="h-10 px-5 rounded-xl shrink-0 text-sm"
                        onClick={testConnection}
                        disabled={isTestingConnection}
                      >
                        {isTestingConnection ? <Spinner className="size-4 animate-spin mr-1.5" /> : <ArrowsClockwise className="size-4 mr-1.5" />}
                        {t.settings.testConnection}
                      </Button>
                    </div>
                  </div>

                  {providerInfo.requiresApiKey && (
                    <div className="space-y-3">
                      <Label className="text-xs text-muted-foreground">{t.settings.apiKey}</Label>
                      {hasApiKey ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-10 px-4 rounded-xl bg-muted border border-border flex items-center text-sm text-muted-foreground select-none">
                            <span className="tracking-widest">{"\u2022".repeat(24)}</span>
                          </div>
                          <Button
                            variant="outline"
                            className="h-10 px-4 rounded-xl shrink-0 text-xs"
                            onClick={() => {
                              setHasApiKey(false)
                              setApiKey("")
                            }}
                          >
                            Change
                          </Button>
                        </div>
                      ) : (
                        <div className="relative">
                          <Input
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            type="password"
                            className="h-10 pl-4 pr-10 rounded-xl bg-background border-border font-mono text-sm"
                            placeholder={t.settings.apiKeyPlaceholder}
                          />
                          {apiKey && (
                            <button
                              type="button"
                              onClick={() => setApiKey("")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <X className="size-4" />
                            </button>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">{t.settings.apiKeyDesc}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground">{t.settings.activeModel}</Label>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="w-full h-10 px-4 rounded-xl border border-border bg-background flex items-center justify-between gap-2 text-sm hover:bg-muted/30 transition-colors">
                          <span className={selectedModel ? "font-mono text-xs truncate" : "text-xs text-muted-foreground"}>
                            {selectedModel || (models.length > 0 ? "Select a model" : "Enter model name")}
                          </span>
                          <CaretDown className="size-3.5 text-muted-foreground shrink-0" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="bg-popover border-border gap-0 p-0 rounded-2xl max-w-md">
                        <DialogHeader className="px-4 pt-4 pb-2">
                          <DialogTitle className="text-sm font-semibold">Select Model</DialogTitle>
                          <DialogDescription className="text-xs">
                            Choose a model for translation
                          </DialogDescription>
                        </DialogHeader>
                        <ModelPickerDialog
                          models={models}
                          selected={selectedModel}
                          onSelect={setSelectedModel}
                          manualPlaceholder={providerInfo.defaultModel || t.settings.enterModelName}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">{t.settings.temperature}</Label>
                      <span className="text-xs font-mono font-semibold text-primary">{temperature.toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[temperature]}
                      onValueChange={(v) => setTemperature(v[0])}
                      min={0}
                      max={1}
                      step={0.1}
                    />
                    <p className="text-xs text-muted-foreground">{t.settings.temperatureDesc}</p>
                  </div>

                  <Button onClick={saveSettings} className="w-full h-11 rounded-xl text-sm font-medium">
                    {t.settings.saveConfig}
                  </Button>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="max-w-2xl space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold tracking-tight">{t.settings.notifications}</h2>
                    <p className="text-sm text-muted-foreground">{t.settings.notificationsDesc}</p>
                  </div>

                  <div className="space-y-2">
                    <ToggleTile
                      icon={Bell}
                      title={t.settings.enableNotifications}
                      desc={t.settings.notifyOnComplete}
                      checked={notificationsEnabled}
                      onChange={handleNotificationsChange}
                    />
                    <ToggleTile
                      icon={SpeakerHigh}
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
                <div className="max-w-2xl space-y-10">
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold tracking-tight">{t.settings.vaultTitle}</h2>
                    <p className="text-sm text-muted-foreground">{t.settings.vaultDesc}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <DataButton
                        icon={Download}
                        title={t.settings.exportData}
                        desc={t.settings.exportDesc}
                        onClick={exportData}
                      />

                      <label className="block cursor-pointer">
                        <DataButton
                          icon={Upload}
                          title={t.settings.importData}
                          desc={t.settings.importDesc}
                          onClick={() => {}}
                        />
                        <input type="file" accept=".json" className="hidden" onChange={importData} />
                      </label>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-muted/10">
                      <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        <span className="font-medium text-foreground">{t.settings.privacyNoticeTitle}</span>{" "}
                        {t.settings.privacyNoticeDesc}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold tracking-tight text-destructive">{t.settings.purgeTitle}</h3>
                      <p className="text-sm text-muted-foreground">{t.settings.purgeDesc}</p>
                    </div>

                    <div className="space-y-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="w-full flex items-center gap-4 p-4 rounded-xl border border-destructive/20 bg-destructive/[0.02] hover:bg-destructive/[0.04] transition-colors text-left">
                            <div className="p-2.5 bg-destructive/10 rounded-xl">
                              <Trash className="size-4 text-destructive" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-destructive">{t.settings.clearData}</p>
                              <p className="text-xs text-destructive/60">{t.settings.clearDataDesc}</p>
                            </div>
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-popover border-border rounded-2xl max-w-sm">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-lg font-semibold tracking-tight">{t.settings.clearDataTitle}</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm text-muted-foreground">
                              {t.settings.clearDataDesc}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2 pt-2">
                            <AlertDialogCancel className="rounded-xl border-border text-sm">{t.common.cancel}</AlertDialogCancel>
                            <AlertDialogAction onClick={clearAllData} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl px-6 text-sm">
                              {t.common.delete}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <button
                        onClick={resetOnboarding}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-muted/20 transition-colors text-left"
                      >
                        <div className="p-2.5 bg-muted rounded-xl">
                          <ArrowsClockwise className="size-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{t.settings.resetOnboarding}</p>
                          <p className="text-xs text-muted-foreground">{t.settings.resetOnboardingDesc}</p>
                        </div>
                        <ArrowUpRight className="size-3.5 text-muted-foreground/40" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="max-w-2xl space-y-8">
                    <div className="space-y-4">
                      <Logo size={48} />
                      <div className="space-y-2">
                        <h2 className="text-4xl font-light tracking-tight">Karpa</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                          {t.about.description}
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border/50">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Version</span>
                        <span className="text-xs font-mono font-bold text-foreground">v{version}</span>
                      </div>
                    </div>

                  <div className="pt-6 border-t border-border flex flex-col sm:flex-row gap-6">
                    <button onClick={() => openExternal("https://erencakar.com")} className="group flex items-center gap-3 text-left">
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-1">{t.about.developer}</p>
                        <span className="text-sm font-medium group-hover:text-primary transition-colors">Eren Çakar</span>
                      </div>
                      <ArrowUpRight className="size-3.5 text-muted-foreground/20 group-hover:text-primary transition-colors" />
                    </button>

                    <div className="hidden sm:block w-px bg-border" />

                    <button onClick={() => openExternal("https://github.com/sudoeren/karpa")} className="group flex items-center gap-3 text-left">
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-1">{t.about.sourceCode}</p>
                        <span className="text-sm font-medium group-hover:text-primary transition-colors">{t.about.openSource}</span>
                      </div>
                      <GitFork className="size-4 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
                    </button>
                  </div>


                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

/* SUB-COMPONENTS */

function ModelPickerDialog({ models, selected, onSelect, manualPlaceholder }: {
  models: Model[]
  selected: string
  onSelect: (id: string) => void
  manualPlaceholder: string
}) {
  const [query, setQuery] = useState("")

  const filtered = query
    ? models.filter(m => m.id.toLowerCase().includes(query.toLowerCase()))
    : models

  if (models.length === 0) {
    return (
      <div className="p-4 pt-2">
        <Input
          value={selected}
          onChange={(e) => onSelect(e.target.value)}
          className="h-10 px-4 rounded-xl border-border font-mono text-sm"
          placeholder={manualPlaceholder}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="relative px-4 pb-2">
        <MagnifyingGlass className="absolute left-6 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-4 text-sm bg-muted/50 border border-border rounded-xl outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/50"
          placeholder="Search models..."
          autoFocus
        />
      </div>
      <div className="max-h-80 overflow-y-auto overscroll-contain border-t border-border">
        {filtered.map((m) => (
          <DialogClose key={m.id} asChild>
            <button
              onClick={() => onSelect(m.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors border-b border-border/50 last:border-0",
                selected === m.id
                  ? "bg-primary/5 text-primary font-medium"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <div className={cn(
                "size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                selected === m.id
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30"
              )}>
                {selected === m.id && <Check className="size-3 text-primary-foreground" />}
              </div>
              <span className="truncate">{m.id}</span>
            </button>
          </DialogClose>
        ))}
        {filtered.length === 0 && (
          <div className="px-4 py-10 text-sm text-muted-foreground/50 text-center">
            No models match "<span className="font-mono">{query}</span>"
          </div>
        )}
      </div>
      <div className="px-4 py-2.5 flex items-center justify-between border-t border-border">
        <span className="text-xs text-muted-foreground/50">
          {filtered.length} / {models.length} models
        </span>
      </div>
    </div>
  )
}

function ToggleTile({ icon: Icon, title, desc, checked, onChange, disabled = false }: { icon: any, title: string, desc: string, checked: boolean, onChange: any, disabled?: boolean }) {
  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-xl border border-border transition-colors",
      disabled && "opacity-40 pointer-events-none"
    )}>
      <div className="flex items-center gap-3">
        <Icon className="size-4.5 text-muted-foreground shrink-0" />
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function DataButton({ icon: Icon, title, desc, onClick, className }: { icon: any, title: string, desc?: string, onClick: any, className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-muted/20 transition-colors text-left",
        className
      )}
    >
      <div className="p-2.5 bg-muted rounded-xl shrink-0">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
    </button>
  )
}
