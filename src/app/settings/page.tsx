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
  Sun, Moon, Monitor, Globe, 
  Trash2, Download, Upload, RefreshCw, Check, Loader2, Zap,
  Github, Code2, ArrowUpRight, Bell, Volume2,
  Shield, Terminal, LayoutGrid, Sliders, HardDrive, Info, User, ExternalLink
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
  
  const [lmStudioUrl, setLmStudioUrl] = useState("http://localhost:1234")
  const [temperature, setTemperature] = useState(0.2)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationSound, setNotificationSound] = useState(true)

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
    const savedModel = localStorage.getItem("lm-studio-model")
    const savedNotifs = localStorage.getItem("localce-notifications")
    const savedNotifSound = localStorage.getItem("localce-notification-sound")
    
    if (savedUrl) {
      setLmStudioUrl(savedUrl)
      fetchModels(savedUrl)
    }
    if (savedTemp) setTemperature(parseFloat(savedTemp))
    if (savedModel) setSelectedModel(savedModel)
    if (savedNotifs) setNotificationsEnabled(savedNotifs === 'true')
    if (savedNotifSound) setNotificationSound(savedNotifSound !== 'false')
  }, [fetchModels])

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
    localStorage.setItem("lm-studio-url", lmStudioUrl)
    localStorage.setItem("lm-studio-temperature", temperature.toString())
    if (selectedModel) localStorage.setItem("lm-studio-model", selectedModel)
    toast.success(t.settings.saved)
  }

  const exportData = () => {
    const data = {
      history: JSON.parse(localStorage.getItem("translation-history") || "[]"),
      favorites: JSON.parse(localStorage.getItem("translation-favorites") || "[]"),
      settings: { lmStudioUrl, temperature, language, theme, notificationsEnabled, notificationSound }
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
        body: JSON.stringify({ url: lmStudioUrl }),
      })
      const data = await response.json()
      if (data.success) {
        setConnectionStatus('success')
        await fetchModels(lmStudioUrl)
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

  const sidebarItems = [
    { id: 'appearance', label: t.settings.appearance, icon: LayoutGrid },
    { id: 'connection', label: t.settings.connection, icon: Sliders },
    { id: 'notifications', label: t.settings.notifications, icon: Bell },
    { id: 'data', label: t.settings.data, icon: HardDrive },
    { id: 'about', label: t.nav.about, icon: Info },
  ] as const

  return (
    <div className="h-full flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl h-[700px] bg-card border border-border rounded-[32px] shadow-2xl overflow-hidden flex"
      >
        {/* Sidebar */}
        <div className="w-64 border-r border-border bg-muted/20 flex flex-col p-6 space-y-8">
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
        <div className="flex-1 overflow-hidden flex flex-col bg-muted/[0.02]">
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
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'en', native: 'English', flag: '🇺🇸' },
                        { id: 'tr', native: 'Türkçe', flag: '🇹🇷' }
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
                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground ml-1">{t.settings.engineUrl}</Label>
                      <div className="flex gap-2">
                        <Input
                          value={lmStudioUrl}
                          onChange={(e) => setLmStudioUrl(e.target.value)}
                          className="h-12 pl-5 rounded-xl bg-background border-border focus:border-primary transition-all font-mono text-sm"
                          placeholder="http://localhost:1234"
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

                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground ml-1">{t.settings.activeModel}</Label>
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
                    </div>

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
                <div className="max-w-2xl space-y-10">
                  <SectionHeader title={t.settings.vaultTitle} desc={t.settings.vaultDesc} icon={HardDrive} />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <DataButton 
                      icon={Download} 
                      title={t.settings.exportData} 
                      onClick={exportData} 
                    />
                    <label className="block cursor-pointer">
                      <DataButton 
                        icon={Upload} 
                        title={t.settings.importData} 
                        onClick={() => {}} 
                      />
                      <input type="file" accept=".json" className="hidden" onChange={importData} />
                    </label>
                  </div>

                  <div className="pt-8 border-t border-border space-y-6">
                    <SectionHeader title={t.settings.purgeTitle} desc={t.settings.purgeDesc} icon={Shield} color="text-destructive" />
                    
                    <div className="space-y-3">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="w-full flex items-center justify-between p-5 rounded-2xl border border-destructive/10 bg-destructive/[0.02] hover:bg-destructive/[0.05] transition-all group">
                            <div className="text-left">
                              <p className="font-bold text-destructive text-sm">{t.settings.clearData}</p>
                              <p className="text-[11px] text-destructive/40 font-medium">{t.settings.clearDataDesc}</p>
                            </div>
                            <Trash2 className="size-4 text-destructive opacity-40 group-hover:opacity-100 transition-opacity" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-popover border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold tracking-tight">{t.settings.clearDataTitle}</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground text-sm">{t.settings.clearDataDesc}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">{t.common.cancel}</AlertDialogCancel>
                            <AlertDialogAction onClick={clearAllData} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl">
                              {t.common.delete}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <button 
                        onClick={resetOnboarding}
                        className="w-full flex items-center justify-between p-5 rounded-2xl border border-border bg-muted/10 hover:bg-muted/20 transition-all group"
                      >
                        <div className="text-left">
                          <p className="font-bold text-sm">{t.settings.resetOnboarding}</p>
                          <p className="text-[11px] text-muted-foreground font-medium">{t.settings.resetOnboardingDesc}</p>
                        </div>
                        <RefreshCw className="size-4 text-muted-foreground group-hover:rotate-180 transition-transform duration-500" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="max-w-2xl space-y-12">
                  <div className="flex flex-col items-center text-center space-y-8 py-4">
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="size-24 bg-gradient-to-br from-primary to-violet-600 rounded-[32px] p-1 shadow-2xl shadow-primary/20"
                    >
                      <div className="w-full h-full bg-background rounded-[28px] flex items-center justify-center">
                        <Logo size={48} />
                      </div>
                    </motion.div>
                    <div className="space-y-2">
                      <h2 className="text-5xl font-black tracking-tighter text-foreground">Localce</h2>
                      <p className="text-primary font-mono text-[10px] uppercase tracking-[0.4em]">{t.about.privacyFirst}</p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                      {t.about.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AboutCard 
                      icon={User} 
                      title={t.about.developer} 
                      value="Eren Çakar" 
                      href="https://erencakar.com" 
                    />
                    <AboutCard 
                      icon={Code2} 
                      title={t.about.sourceCode} 
                      value={t.about.openSource} 
                      href="https://github.com/sudoeren/localce" 
                    />
                  </div>

                  <div className="flex flex-col items-center gap-2 pt-8 border-t border-border">
                    <div className="px-4 py-1.5 rounded-full bg-muted/50 border border-border flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{t.about.version}</span>
                      <div className="w-px h-3 bg-border" />
                      <span className="text-xs font-bold font-mono text-foreground">1.2.4</span>
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

function DataButton({ icon: Icon, title, onClick }: { icon: any, title: string, onClick: any }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-4 p-5 rounded-2xl border border-border bg-muted/10 hover:bg-muted/20 transition-all group"
    >
      <div className="p-2.5 bg-muted/20 rounded-xl group-hover:scale-105 transition-transform">
        <Icon className="size-4.5 text-muted-foreground" />
      </div>
      <p className="font-bold text-sm">{title}</p>
    </button>
  )
}

function AboutCard({ icon: Icon, title, value, href }: { icon: any, title: string, value: string, href: string }) {
  return (
    <Link 
      href={href} 
      target="_blank"
      className="group relative flex flex-col items-center justify-center p-8 rounded-[32px] bg-muted/5 border border-border/50 hover:bg-primary/[0.02] hover:border-primary/20 transition-all duration-500 overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="p-4 rounded-2xl bg-background shadow-sm border border-border group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
          <Icon className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 mb-1">{title}</p>
          <p className="text-xl font-bold tracking-tight text-foreground">{value}</p>
        </div>
      </div>

      <ArrowUpRight className="absolute top-6 right-6 size-4 text-muted-foreground/20 group-hover:text-primary/40 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
    </Link>
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
