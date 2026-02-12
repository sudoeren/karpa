"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { useOnboarding } from "@/contexts/onboarding-context"
import { Logo } from "@/components/logo"
import { 
  Languages, Shield, Zap, ArrowRight, Check, Globe, Sparkles, RefreshCw, AlertCircle, 
  Link2, Terminal, Cpu, Database, Network, Server, Cloud, Key, Eye, EyeOff
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { type ProviderType, PROVIDERS } from "@/lib/providers"

const translationLanguages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
]

export function Onboarding() {
  const [step, setStep] = useState(0)
  const { t, language, setLanguage } = useLanguage()
  const { completeOnboarding } = useOnboarding()
  const [nativeLang, setNativeLang] = useState("Turkish")
  const [targetLang, setTargetLang] = useState("English")
  
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>("lmstudio")
  const [apiUrl, setApiUrl] = useState("http://localhost:1234")
  const [apiKey, setApiKey] = useState("")
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle")

  const testConnection = async () => {
    setConnectionStatus("testing")
    try {
      let url = apiUrl.trim()
      if (url.endsWith('/')) url = url.slice(0, -1)
      
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, provider: selectedProvider, apiKey: apiKey || undefined }),
      })

      const data = await response.json()
      if (data.success) {
        setConnectionStatus("success")
        // Save to localStorage
        localStorage.setItem("llm-provider", selectedProvider)
        localStorage.setItem("llm-api-url", url)
        localStorage.setItem("lm-studio-url", url) // backward compat
        if (apiKey) localStorage.setItem("llm-api-key", apiKey)
        toast.success(t.settings.connectionSuccess)
      } else {
        setConnectionStatus("error")
        toast.error(data.error || t.settings.connectionFailed)
      }
    } catch (error) {
      setConnectionStatus("error")
      toast.error(t.settings.connectionFailed)
    }
  }

  const handleProviderSelect = (provider: ProviderType) => {
    setSelectedProvider(provider)
    const info = PROVIDERS[provider]
    setApiUrl(info.defaultUrl)
    setApiKey("")
    setConnectionStatus("idle")
  }

  const nextStep = () => {
    if (step === 2 && connectionStatus !== "success") {
       toast.info(t.onboarding.continuingWithout, {
         description: t.onboarding.ensureEngineRunning
       })
    }
    if (step < 4) setStep(step + 1)
    else completeOnboarding(nativeLang, targetLang)
  }

  const prevStep = () => {
    if (step > 0) setStep(step - 1)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white overflow-hidden flex flex-col font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1a1a1a_0%,#000_100%)]" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 flex items-center justify-center p-6 md:p-12">
        <AnimatePresence mode="wait">
          <motion.div 
            key={step}
            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ type: "spring", duration: 0.6, bounce: 0.2 }}
            className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left Content / Header Section */}
            <div className="lg:col-span-5 flex flex-col justify-center space-y-8">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-white/5 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md">
                    <Logo size={48} />
                  </div>
                  <div>
                    <h2 className="text-sm font-mono tracking-[0.3em] text-primary uppercase">LOCALCE AI</h2>
                    <p className="text-xs text-white/40 font-medium">{t.onboarding.stepOf.replace('{current}', String(step + 1)).replace('{total}', '5')}</p>
                  </div>
                </div>

                {step === 0 && <WelcomeStep t={t} />}
                {step === 1 && <InterfaceLangStep t={t} />}
                {step === 2 && <ConnectionStep t={t} connectionStatus={connectionStatus} />}
                {step === 3 && <LanguageSetupStep t={t} type="native" />}
                {step === 4 && <LanguageSetupStep t={t} type="target" />}
              </motion.div>

              {/* Navigation Buttons */}
              <motion.div 
                className="flex items-center gap-4 pt-8"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {step > 0 && (
                  <button 
                    onClick={prevStep}
                    className="h-14 px-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all font-bold text-sm"
                  >
                    {t.common.back}
                  </button>
                )}
                <button 
                  onClick={nextStep}
                  className="h-14 flex-1 flex items-center justify-center gap-3 rounded-2xl bg-white text-black hover:bg-white/90 transition-all font-black text-sm uppercase tracking-widest shadow-[0_0_40px_rgba(255,255,255,0.1)] group"
                >
                  {step === 4 ? t.onboarding.letsGo : step === 0 ? t.onboarding.getStarted : t.common.next}
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
              
              {step < 4 && (
                <button 
                  onClick={() => completeOnboarding(nativeLang, targetLang)}
                  className="text-white/30 hover:text-white/60 text-[10px] uppercase tracking-widest font-bold self-start pl-4"
                >
                  {t.common.skip}
                </button>
              )}
            </div>

            {/* Right Interactive / Visual Section */}
            <div className="lg:col-span-7 hidden lg:flex items-center justify-center">
              <div className="w-full grid grid-cols-2 gap-4">
                {step === 0 && <WelcomeVisuals t={t} />}
                {step === 1 && <InterfaceVisuals language={language} setLanguage={setLanguage} />}
                {step === 2 && (
                  <ConnectionVisuals 
                    selectedProvider={selectedProvider}
                    onProviderSelect={handleProviderSelect}
                    apiUrl={apiUrl} 
                    setApiUrl={setApiUrl} 
                    apiKey={apiKey}
                    setApiKey={setApiKey}
                    testConnection={testConnection} 
                    status={connectionStatus}
                    t={t}
                  />
                )}
                {(step === 3 || step === 4) && (
                  <LanguageVisuals 
                    selected={step === 3 ? nativeLang : targetLang} 
                    setSelected={step === 3 ? setNativeLang : setTargetLang} 
                  />
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Progress Line */}
      <div className="h-1 w-full bg-white/5 relative">
        <motion.div 
          className="absolute top-0 left-0 h-full bg-primary shadow-[0_0_20px_rgba(var(--primary),0.8)]"
          initial={{ width: "0%" }}
          animate={{ width: `${((step + 1) / 5) * 100}%` }}
          transition={{ duration: 0.5, ease: "circOut" }}
        />
      </div>
    </div>
  )
}

/* SUB-COMPONENTS FOR STEPS */

function WelcomeStep({ t }: { t: any }) {
  return (
    <div className="space-y-4">
      <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">
        {t.onboarding.welcome.split(' ').map((word: string, i: number) => (
          <motion.span 
            key={i} 
            className="block"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 + (i * 0.1) }}
          >
            {word}
          </motion.span>
        ))}
      </h1>
      <p className="text-xl text-white/50 max-w-md leading-relaxed">
        {t.onboarding.welcomeDesc}
      </p>
    </div>
  )
}

function WelcomeVisuals({ t }: { t: any }) {
  const cards = [
    { icon: Shield, title: t.onboarding.local, desc: t.onboarding.privateSecure, color: "text-emerald-500" },
    { icon: Zap, title: t.onboarding.aiPowered, desc: t.onboarding.multipleProviders, color: "text-amber-500" },
    { icon: Globe, title: t.onboarding.multiLang, desc: t.onboarding.worldClassModels, color: "text-blue-500" },
    { icon: Sparkles, title: t.onboarding.modernUI, desc: t.onboarding.designedForSpeed, color: "text-violet-500" },
  ]
  
  return (
    <>
      {cards.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + (i * 0.1) }}
          className="p-8 rounded-[32px] bg-white/5 border border-white/10 flex flex-col justify-between aspect-square group hover:bg-white/10 transition-colors cursor-default"
        >
          <card.icon className={cn("size-10", card.color)} />
          <div>
            <h3 className="text-lg font-bold mb-1">{card.title}</h3>
            <p className="text-xs text-white/40 font-medium uppercase tracking-wider">{card.desc}</p>
          </div>
        </motion.div>
      ))}
    </>
  )
}

function InterfaceLangStep({ t }: { t: any }) {
  return (
    <div className="space-y-4">
      <h1 className="text-5xl font-black tracking-tight leading-tight">
        {t.onboarding.step3Title}
      </h1>
      <p className="text-lg text-white/50 max-w-md">
        {t.onboarding.step3Desc}
      </p>
    </div>
  )
}

function InterfaceVisuals({ language, setLanguage }: { language: string, setLanguage: any }) {
  const langs = [
    { code: "en", name: "English", flag: "🇺🇸", native: "English" },
    { code: "tr", name: "Turkish", flag: "🇹🇷", native: "Türkçe" },
    { code: "de", name: "German", flag: "🇩🇪", native: "Deutsch" },
    { code: "fr", name: "French", flag: "🇫🇷", native: "Français" },
    { code: "es", name: "Spanish", flag: "🇪🇸", native: "Español" },
  ]
  return (
    <div className="col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => setLanguage(l.code)}
          className={cn(
            "p-8 rounded-[32px] border transition-all duration-500 flex flex-col items-center gap-4 group relative overflow-hidden",
            language === l.code 
              ? "bg-white text-black border-white shadow-[0_0_40px_rgba(255,255,255,0.15)]" 
              : "bg-white/5 border-white/10 text-white hover:bg-white/10"
          )}
        >
          {language === l.code && (
            <motion.div 
              layoutId="active-lang-bg"
              className="absolute inset-0 bg-white"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="text-5xl group-hover:scale-110 transition-transform relative z-10">{l.flag}</span>
          <div className="text-center relative z-10">
            <h3 className="text-lg font-black leading-tight">{l.native}</h3>
            <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-40", language === l.code && "text-black/60 opacity-100")}>{l.name}</p>
          </div>
          {language === l.code && <Check className="size-4 absolute top-4 right-4 text-black z-10" />}
        </button>
      ))}
    </div>
  )
}

function ConnectionStep({ t, connectionStatus }: { t: any, connectionStatus: string }) {
  return (
    <div className="space-y-4">
      <div className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
        connectionStatus === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-primary/10 border-primary/20 text-primary"
      )}>
        <div className={cn("size-1.5 rounded-full", connectionStatus === "success" ? "bg-emerald-500 animate-pulse" : "bg-primary")} />
        {connectionStatus === "success" ? t.onboarding.systemOnline : t.onboarding.configNeeded}
      </div>
      <h1 className="text-5xl font-black tracking-tight leading-tight">
        {t.onboarding.step2Title}
      </h1>
      <p className="text-lg text-white/50 max-w-md">
        {t.onboarding.step2Desc}
      </p>
    </div>
  )
}

type ConnectionVisualsProps = {
  selectedProvider: ProviderType
  onProviderSelect: (provider: ProviderType) => void
  apiUrl: string
  setApiUrl: (url: string) => void
  apiKey: string
  setApiKey: (key: string) => void
  testConnection: () => void
  status: string
  t: any
}

function ConnectionVisuals({ selectedProvider, onProviderSelect, apiUrl, setApiUrl, apiKey, setApiKey, testConnection, status, t }: ConnectionVisualsProps) {
  const [showApiKey, setShowApiKey] = useState(false)
  const providerInfo = PROVIDERS[selectedProvider]

  const providerList: { key: ProviderType; icon: any; label: string }[] = [
    { key: 'lmstudio', icon: Terminal, label: 'LM Studio' },
    { key: 'ollama', icon: Server, label: 'Ollama' },
    { key: 'openai', icon: Cloud, label: 'OpenAI' },
    { key: 'anthropic', icon: Cloud, label: 'Anthropic' },
    { key: 'gemini', icon: Cloud, label: 'Gemini' },
    { key: 'custom', icon: Server, label: 'Custom' },
  ]

  return (
    <div className="col-span-2 space-y-6">
      {/* Provider Selection */}
      <div className="grid grid-cols-3 gap-2">
        {providerList.map((p) => (
          <button
            key={p.key}
            onClick={() => onProviderSelect(p.key)}
            className={cn(
              "p-3 rounded-2xl border transition-all duration-300 flex items-center gap-3",
              selectedProvider === p.key
                ? "bg-white text-black border-white shadow-lg"
                : "bg-white/5 border-white/10 text-white hover:bg-white/10"
            )}
          >
            <p.icon className={cn("size-4", selectedProvider === p.key ? "text-black" : "text-white/50")} />
            <span className="text-xs font-bold">{p.label}</span>
            {selectedProvider === p.key && <Check className="size-3 ml-auto" />}
          </button>
        ))}
      </div>

      <div className="p-8 rounded-[40px] bg-white/5 border border-white/10 space-y-6 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-xl">
              <Network className="size-5 text-primary" />
            </div>
            <h3 className="font-bold tracking-tight">{providerInfo.name} {t.onboarding.configuration}</h3>
          </div>
          <Badge variant="outline" className="font-mono text-[10px] opacity-50">
            {providerInfo.requiresApiKey ? "API" : "LOCAL"}
          </Badge>
        </div>

        <div className="space-y-4">
          {/* API URL */}
          <div className="relative group">
            <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/30 group-focus-within:text-white transition-colors" />
            <Input 
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="h-14 pl-12 rounded-2xl bg-black/50 border-white/10 focus:border-white transition-all font-mono text-sm"
              placeholder={providerInfo.placeholder}
            />
          </div>

          {/* API Key (for cloud providers) */}
          {providerInfo.requiresApiKey && (
            <div className="relative group">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/30 group-focus-within:text-white transition-colors" />
              <Input 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                type={showApiKey ? "text" : "password"}
                className="h-14 pl-12 pr-12 rounded-2xl bg-black/50 border-white/10 focus:border-white transition-all font-mono text-sm"
                placeholder={t.onboarding.enterApiKey}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
              >
                {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          )}
          
          <Button 
            onClick={testConnection}
            disabled={status === "testing"}
            className={cn(
              "w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500",
              status === "success" ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-white text-black hover:bg-white/90"
            )}
          >
            {status === "testing" ? <RefreshCw className="size-4 animate-spin mr-2" /> : status === "success" ? <Check className="size-4 mr-2" /> : <Zap className="size-4 mr-2" />}
            {status === "testing" ? t.onboarding.testingLink : status === "success" ? t.onboarding.connectedSuccessfully : t.onboarding.establishConnection}
          </Button>
        </div>

        {status === "error" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20">
            <div className="flex gap-4">
              <AlertCircle className="size-5 text-red-500 shrink-0" />
              <div className="space-y-2">
                <p className="text-xs font-bold text-red-500 uppercase tracking-widest">{t.onboarding.troubleshooting}</p>
                <ul className="text-[11px] text-white/60 space-y-1 font-medium">
                  {!providerInfo.requiresApiKey ? (
                    <>
                      <li>• {t.onboarding.troubleLocalRunning.replace('{name}', providerInfo.name)}</li>
                      <li>• {t.onboarding.troubleLocalUrl}</li>
                      <li>• {t.onboarding.troubleLocalCors}</li>
                    </>
                  ) : (
                    <>
                      <li>• {t.onboarding.troubleCloudKey}</li>
                      <li>• {t.onboarding.troubleCloudCredits}</li>
                      <li>• {t.onboarding.troubleCloudUrl}</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 rounded-[32px] bg-white/5 border border-white/10 flex items-center gap-4">
          <Cpu className="size-6 text-white/20" />
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            {providerInfo.requiresApiKey ? t.onboarding.cloudPowered : t.onboarding.gpuAcceleration}
          </div>
        </div>
        <div className="p-6 rounded-[32px] bg-white/5 border border-white/10 flex items-center gap-4">
          <Database className="size-6 text-white/20" />
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            {providerInfo.requiresApiKey ? t.onboarding.fastResponse : t.onboarding.zeroDataLeak}
          </div>
        </div>
      </div>
    </div>
  )
}

function LanguageSetupStep({ t, type }: { t: any, type: "native" | "target" }) {
  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-500 text-[10px] font-black uppercase tracking-widest">
        <Sparkles className="size-3" />
        {t.onboarding.translationEngine}
      </div>
      <h1 className="text-5xl font-black tracking-tight leading-tight">
        {type === "native" ? t.onboarding.nativeLanguage : t.onboarding.targetLanguage}
      </h1>
      <p className="text-lg text-white/50 max-w-md">
        {type === "native" ? t.onboarding.nativeLanguageDesc : t.onboarding.targetLanguageDesc}
      </p>
    </div>
  )
}

function LanguageVisuals({ selected, setSelected }: { selected: string, setSelected: any }) {
  return (
    <div className="col-span-2 grid grid-cols-3 gap-3 max-h-[500px] overflow-y-auto p-2 custom-scrollbar pr-4">
      {translationLanguages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setSelected(lang.name)}
          className={cn(
            "p-6 rounded-3xl border transition-all duration-300 flex flex-col items-center gap-3",
            selected === lang.name 
              ? "bg-white text-black border-white shadow-xl scale-105 z-10" 
              : "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
          )}
        >
          <span className="text-4xl">{lang.flag}</span>
          <span className="text-sm font-black tracking-tight">{lang.name}</span>
          {selected === lang.name && <Check className="size-4" />}
        </button>
      ))}
    </div>
  )
}

function Badge({ children, variant = "default", className }: { children: React.ReactNode, variant?: string, className?: string }) {
  return (
    <span className={cn(
      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
      variant === "outline" ? "border border-white/20" : "bg-white text-black",
      className
    )}>
      {children}
    </span>
  )
}
