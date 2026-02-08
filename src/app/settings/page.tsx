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
  Cpu, Droplets, Github, Code2, ArrowUpRight, Bell, Volume2,
  Shield, Server, Terminal, Sparkles, User, ExternalLink, Database,
  LayoutGrid, Sliders, HardDrive, Info, ArrowLeft
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
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl h-[700px] bg-black border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex"
      >
        {/* Sidebar */}
        <div className="w-64 border-r border-white/5 bg-white/[0.02] flex flex-col p-6 space-y-8">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Logo size={24} />
            </div>
            <h1 className="font-black tracking-tighter text-xl">Settings</h1>
          </div>

          <nav className="flex-1 space-y-1">
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative",
                    isActive 
                      ? "text-white" 
                      : "text-white/40 hover:text-white/70 hover:bg-white/5"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-white/5 rounded-2xl border border-white/5 shadow-sm"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <item.icon className={cn(
                    "size-5 transition-colors",
                    isActive ? "text-primary" : "text-white/20"
                  )} />
                  <span className="text-sm font-bold tracking-tight relative z-10">{item.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-dot"
                      className="size-1 bg-primary rounded-full ml-auto relative z-10" 
                    />
                  )}
                </button>
              )
            })}
          </nav>

          <div className="pt-6 border-t border-white/5">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/5 border border-primary/10">
               <div className={cn(
                 "size-1.5 rounded-full",
                 connectionStatus === 'success' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-white/20"
               )} />
               <span className="text-[9px] font-black uppercase tracking-widest text-primary/80">
                 {connectionStatus === 'success' ? "Core Online" : "Core Offline"}
               </span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex-1 p-10 overflow-y-auto custom-scrollbar"
            >
              {activeTab === 'appearance' && (
                <div className="space-y-10">
                  <SectionHeader title={t.settings.appearance} desc="Customize your visual experience." icon={LayoutGrid} />
                  
                  <div className="space-y-6">
                    <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/30 ml-1">Color Theme</Label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: 'light', icon: Sun, label: t.common.light },
                        { id: 'dark', icon: Moon, label: t.common.dark },
                        { id: 'system', icon: Monitor, label: t.common.system }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id)}
                          className={cn(
                            "flex flex-col items-center gap-4 p-6 rounded-[32px] border transition-all duration-300 group",
                            theme === t.id 
                              ? "bg-white text-black border-white shadow-xl scale-105" 
                              : "bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/10"
                          )}
                        >
                          <t.icon className="size-6 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/30 ml-1">System Language</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: 'en', label: 'English', native: 'English', flag: '🇺🇸' },
                        { id: 'tr', label: 'Turkish', native: 'Türkçe', flag: '🇹🇷' }
                      ].map((l) => (
                        <button
                          key={l.id}
                          onClick={() => setLanguage(l.id as any)}
                          className={cn(
                            "flex items-center gap-4 p-5 rounded-[28px] border transition-all duration-300",
                            language === l.id 
                              ? "bg-primary/10 border-primary/40 text-primary shadow-[0_0_20px_rgba(var(--primary),0.1)]" 
                              : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                          )}
                        >
                          <span className="text-2xl">{l.flag}</span>
                          <div className="text-left">
                            <p className="font-bold">{l.native}</p>
                            <p className="text-[9px] uppercase tracking-widest opacity-50">{l.label}</p>
                          </div>
                          {language === l.id && <Check className="size-4 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'connection' && (
                <div className="space-y-10">
                  <SectionHeader title={t.settings.connection} desc="Configure your local AI engine." icon={Sliders} />
                  
                  <div className="p-8 rounded-[32px] bg-white/5 border border-white/5 space-y-8">
                    <div className="space-y-4">
                      <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/30 ml-1">Engine URL</Label>
                      <div className="flex gap-2">
                        <Input
                          value={lmStudioUrl}
                          onChange={(e) => setLmStudioUrl(e.target.value)}
                          className="h-14 pl-6 rounded-2xl bg-black/50 border-white/5 focus:border-primary transition-all font-mono text-sm"
                          placeholder="http://localhost:1234"
                        />
                        <Button
                          variant="outline"
                          className="h-14 px-6 rounded-2xl border-white/10 bg-white/5"
                          onClick={testConnection}
                          disabled={isTestingConnection}
                        >
                          {isTestingConnection ? <Loader2 className="size-4 animate-spin mr-2" /> : <RefreshCw className="size-4 mr-2" />}
                          Test
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/30 ml-1">Active Model</Label>
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="h-14 rounded-2xl bg-black/50 border-white/5 px-6">
                          <SelectValue placeholder="Select Model" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-white/10">
                          {models.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.id}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/30 ml-1">Temperature</Label>
                        <Badge variant="outline" className="font-mono text-primary border-primary/20 bg-primary/5">{temperature.toFixed(1)}</Badge>
                      </div>
                      <Slider
                        value={[temperature]}
                        onValueChange={(v) => setTemperature(v[0])}
                        min={0}
                        max={1}
                        step={0.1}
                        className="py-4"
                      />
                    </div>

                    <Button onClick={saveSettings} className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20">
                      Save configuration
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-10">
                  <SectionHeader title={t.settings.notifications} desc="Stay updated on translation tasks." icon={Bell} />
                  
                  <div className="space-y-4">
                    <ToggleTile 
                      icon={Bell} 
                      title="Enable Notifications" 
                      desc="Get notified when translations are ready." 
                      checked={notificationsEnabled} 
                      onChange={handleNotificationsChange} 
                    />
                    <ToggleTile 
                      icon={Volume2} 
                      title="Audio Feedback" 
                      desc="Play a sound on successful translation." 
                      checked={notificationSound} 
                      onChange={handleNotificationSoundChange} 
                      disabled={!notificationsEnabled}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'data' && (
                <div className="space-y-10">
                  <SectionHeader title={t.settings.data} desc="Manage your personal translation vault." icon={HardDrive} />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <DataButton 
                      icon={Download} 
                      title="Export Vault" 
                      desc="Download your history & favorites." 
                      onClick={exportData} 
                    />
                    <label className="block cursor-pointer">
                      <DataButton 
                        icon={Upload} 
                        title="Import Vault" 
                        desc="Restore from a JSON backup." 
                        onClick={() => {}} 
                      />
                      <input type="file" accept=".json" className="hidden" onChange={importData} />
                    </label>
                  </div>

                  <div className="pt-10 border-t border-white/5 space-y-6">
                    <SectionHeader title="Danger Zone" desc="Destructive actions that cannot be undone." icon={Shield} color="text-rose-500" />
                    
                    <div className="space-y-3">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="w-full flex items-center justify-between p-6 rounded-[28px] border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition-all group">
                            <div className="text-left">
                              <p className="font-bold text-rose-500">Purge All Data</p>
                              <p className="text-xs text-rose-500/60 font-medium">Clear history, favorites and all preferences.</p>
                            </div>
                            <Trash2 className="size-5 text-rose-500 group-hover:scale-110 transition-transform" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-zinc-950 border-rose-500/20">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black tracking-tighter text-rose-500 uppercase">Confirm Purge</AlertDialogTitle>
                            <AlertDialogDescription className="text-white/50">{t.settings.clearDataDesc}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-white/5 border-white/5 rounded-xl">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={clearAllData} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl">
                              Confirm Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <button 
                        onClick={resetOnboarding}
                        className="w-full flex items-center justify-between p-6 rounded-[28px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group"
                      >
                        <div className="text-left">
                          <p className="font-bold">Reset Welcome Experience</p>
                          <p className="text-xs text-white/40 font-medium">Re-run the initial setup wizard.</p>
                        </div>
                        <RefreshCw className="size-5 text-white/20 group-hover:rotate-180 transition-transform duration-500" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="space-y-12">
                  <div className="flex flex-col items-center text-center space-y-6 pt-6">
                    <div className="size-24 bg-gradient-to-br from-primary to-violet-600 rounded-[32px] p-1 shadow-2xl shadow-primary/20">
                      <div className="w-full h-full bg-black rounded-[28px] flex items-center justify-center">
                        <Logo size={48} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-5xl font-black tracking-tighter">Localce</h2>
                      <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px]">Version 1.2.4 • Private AI</p>
                    </div>
                    <p className="text-lg text-white/60 leading-relaxed max-w-lg">
                      {t.about.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <AboutCard 
                      icon={User} 
                      title="Lead Developer" 
                      value="Eren Çakar" 
                      href="https://erencakar.com" 
                    />
                    <AboutCard 
                      icon={Github} 
                      title="Source Code" 
                      value="sudoeren/localce" 
                      href="https://github.com/sudoeren/localce" 
                    />
                  </div>

                  <div className="flex justify-center gap-6 pt-4">
                    <SocialIcon icon={Globe} href="https://erencakar.com" />
                    <SocialIcon icon={Github} href="https://github.com/sudoeren" />
                    <SocialIcon icon={Code2} href="https://github.com/sudoeren/localce" />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer Info */}
          <div className="px-10 py-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/20">© 2026 Localce AI. All rights reserved.</p>
            <div className="flex items-center gap-4">
               <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Secure</span>
               <div className="size-1 rounded-full bg-white/10" />
               <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Private</span>
               <div className="size-1 rounded-full bg-white/10" />
               <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Local</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* SUB-COMPONENTS */

function SectionHeader({ title, desc, icon: Icon, color = "text-white" }: { title: string, desc: string, icon: any, color?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <Icon className={cn("size-6", color)} />
        <h2 className={cn("text-3xl font-black tracking-tight", color)}>{title}</h2>
      </div>
      <p className="text-sm text-white/40 font-medium ml-9">{desc}</p>
    </div>
  )
}

function ToggleTile({ icon: Icon, title, desc, checked, onChange, disabled = false }: { icon: any, title: string, desc: string, checked: boolean, onChange: any, disabled?: boolean }) {
  return (
    <div className={cn(
      "flex items-center justify-between p-6 rounded-[28px] border border-white/5 bg-white/[0.02] transition-all",
      disabled && "opacity-50 pointer-events-none"
    )}>
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-white/5 rounded-2xl">
          <Icon className="size-5 text-white/40" />
        </div>
        <div className="text-left">
          <p className="font-bold">{title}</p>
          <p className="text-xs text-white/40 font-medium">{desc}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function DataButton({ icon: Icon, title, desc, onClick }: { icon: any, title: string, desc: string, onClick: any }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex flex-col gap-4 p-8 rounded-[32px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group text-left"
    >
      <div className="p-3 bg-white/5 rounded-2xl w-fit group-hover:scale-110 transition-transform">
        <Icon className="size-6 text-white/40" />
      </div>
      <div>
        <p className="font-bold text-lg">{title}</p>
        <p className="text-xs text-white/40 font-medium">{desc}</p>
      </div>
    </button>
  )
}

function AboutCard({ icon: Icon, title, value, href }: { icon: any, title: string, value: string, href: string }) {
  return (
    <Link 
      href={href} 
      target="_blank"
      className="p-6 rounded-[28px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group"
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2 flex items-center gap-2">
        <Icon className="size-3" />
        {title}
      </p>
      <p className="text-lg font-bold group-hover:text-primary transition-colors flex items-center justify-between">
        {value}
        <ExternalLink className="size-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      </p>
    </Link>
  )
}

function SocialIcon({ icon: Icon, href }: { icon: any, href: string }) {
  return (
    <Link 
      href={href} 
      target="_blank" 
      className="p-3 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-white/40 hover:text-white transition-all hover:scale-110"
    >
      <Icon className="size-5" />
    </Link>
  )
}

function SettingsCard({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", duration: 0.5 }}
      className={cn(
        "rounded-[40px] border border-white/5 bg-white/5 backdrop-blur-3xl shadow-2xl",
        className
      )}
    >
      {children}
    </motion.div>
  )
}

function SocialLink({ href, icon: Icon, label }: { href: string, icon: any, label: string }) {
  return (
    <Link 
      href={href} 
      target="_blank"
      className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
    >
      <Icon className="size-4 text-white/40 group-hover:text-primary transition-colors" />
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
    </Link>
  )
}
