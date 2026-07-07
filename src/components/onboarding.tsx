"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/contexts/language-context"
import { useOnboarding } from "@/contexts/onboarding-context"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/logo"
import {
  CaretRight, Check, Network, Key, Eye, EyeSlash, Link,
  ArrowsClockwise, Lightning, WarningCircle, ComputerTower, Terminal, Cloud
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
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

const interfaceLanguages = [
  { code: "en", name: "English", flag: "🇺🇸", native: "English" },
  { code: "tr", name: "Turkish", flag: "🇹🇷", native: "Türkçe" },
  { code: "de", name: "German", flag: "🇩🇪", native: "Deutsch" },
  { code: "fr", name: "French", flag: "🇫🇷", native: "Français" },
  { code: "es", name: "Spanish", flag: "🇪🇸", native: "Español" },
]

const providerList: { key: ProviderType; icon: any; label: string }[] = [
  { key: 'lmstudio', icon: Terminal, label: 'LM Studio' },
  { key: 'ollama', icon: ComputerTower, label: 'Ollama' },
  { key: 'openai', icon: Cloud, label: 'OpenAI' },
  { key: 'anthropic', icon: Cloud, label: 'Anthropic' },
  { key: 'gemini', icon: Cloud, label: 'Gemini' },
  { key: 'openrouter', icon: Cloud, label: 'OpenRouter' },
  { key: 'custom', icon: ComputerTower, label: 'Custom' },
]

const stepVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

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
  const [showApiKey, setShowApiKey] = useState(false)

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
        localStorage.setItem("llm-provider", selectedProvider)
        localStorage.setItem("llm-api-url", url)
        localStorage.setItem("lm-studio-url", url)
        toast.success(t.settings.connectionSuccess)
      } else {
        setConnectionStatus("error")
        toast.error(data.error || t.settings.connectionFailed)
      }
    } catch {
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
    if (step < 3) setStep(step + 1)
    else completeOnboarding(nativeLang, targetLang)
  }

  const prevStep = () => {
    if (step > 0) setStep(step - 1)
  }

  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground overflow-hidden flex flex-col">
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 z-10">
        <Logo size={28} />
        <ModeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {step === 0 && <WelcomeStep t={t} />}
              {step === 1 && <InterfaceStep t={t} language={language} setLanguage={setLanguage} />}
              {step === 2 && (
                <EngineStep
                  t={t}
                  selectedProvider={selectedProvider}
                  onProviderSelect={handleProviderSelect}
                  apiUrl={apiUrl}
                  setApiUrl={setApiUrl}
                  apiKey={apiKey}
                  setApiKey={setApiKey}
                  showApiKey={showApiKey}
                  setShowApiKey={setShowApiKey}
                  testConnection={testConnection}
                  connectionStatus={connectionStatus}
                />
              )}
              {step === 3 && (
                <LanguagesStep
                  t={t}
                  nativeLang={nativeLang}
                  setNativeLang={setNativeLang}
                  targetLang={targetLang}
                  setTargetLang={setTargetLang}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="p-6 pt-0">
        <div className="max-w-xl mx-auto">
          <div className="flex justify-center gap-1.5 mb-5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === step
                    ? "w-6 bg-primary"
                    : i < step
                      ? "w-1.5 bg-primary/40"
                      : "w-1.5 bg-muted-foreground/20"
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {step > 0 ? (
              <button
                onClick={prevStep}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {t.common.back}
              </button>
            ) : (
              <div />
            )}
            {step < 3 && (
              <button
                onClick={() => completeOnboarding(nativeLang, targetLang)}
                className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                {t.common.skip}
              </button>
            )}
            <div className="flex-1" />
            <Button onClick={nextStep} className="rounded-xl">
              {step === 3 ? t.onboarding.letsGo : step === 0 ? t.onboarding.getStarted : t.common.next}
              <CaretRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function WelcomeStep({ t }: { t: any }) {
  return (
    <div className="text-center py-12">
      <div className="flex justify-center mb-6">
        <Logo size={64} />
      </div>
      <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-4">
        Karpa
      </h1>
      <p className="text-base text-muted-foreground max-w-xs mx-auto leading-relaxed">
        {t.onboarding.welcomeDesc}
      </p>
    </div>
  )
}

function InterfaceStep({ t, language, setLanguage }: { t: any; language: string; setLanguage: any }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight mb-1.5">
        {t.onboarding.step3Title}
      </h2>
      <p className="text-sm text-muted-foreground mb-8">
        {t.onboarding.step3Desc}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {interfaceLanguages.map((l) => (
          <button
            key={l.code}
            onClick={() => setLanguage(l.code)}
            className={cn(
              "p-4 rounded-xl border transition-colors text-center",
              language === l.code
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <span className="text-2xl block mb-1">{l.flag}</span>
            <span className="text-sm font-medium block">{l.native}</span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">{l.name}</span>
            {language === l.code && <Check className="size-3 mx-auto mt-1.5 text-primary" />}
          </button>
        ))}
      </div>
    </div>
  )
}

function EngineStep({
  t, selectedProvider, onProviderSelect, apiUrl, setApiUrl,
  apiKey, setApiKey, showApiKey, setShowApiKey, testConnection, connectionStatus
}: {
  t: any; selectedProvider: ProviderType; onProviderSelect: (p: ProviderType) => void
  apiUrl: string; setApiUrl: (u: string) => void; apiKey: string; setApiKey: (k: string) => void
  showApiKey: boolean; setShowApiKey: (s: boolean) => void
  testConnection: () => void; connectionStatus: string
}) {
  const providerInfo = PROVIDERS[selectedProvider]

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight mb-1.5">
        {t.onboarding.step2Title}
      </h2>
      <p className="text-sm text-muted-foreground mb-8">
        {t.onboarding.step2Desc}
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {providerList.map((p) => (
          <button
            key={p.key}
            onClick={() => onProviderSelect(p.key)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors",
              selectedProvider === p.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/50"
            )}
          >
            <p.icon className="size-3.5" />
            {p.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Network className="size-4 text-primary" />
            </div>
            <span className="text-sm font-medium">{providerInfo.name}</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border border-border text-muted-foreground">
            {providerInfo.requiresApiKey ? "API" : "LOCAL"}
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">URL</label>
          <div className="relative">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="h-10 pl-10 rounded-xl text-sm font-mono"
              placeholder={providerInfo.placeholder}
            />
          </div>
        </div>

        {providerInfo.requiresApiKey && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">API Key</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                type={showApiKey ? "text" : "password"}
                className="h-10 pl-10 pr-10 rounded-xl text-sm"
                placeholder={t.onboarding.enterApiKey}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showApiKey ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={testConnection}
            disabled={connectionStatus === "testing"}
            size="sm"
            className={cn(
              "rounded-xl text-xs",
              connectionStatus === "success" && "bg-emerald-600 hover:bg-emerald-700"
            )}
          >
            {connectionStatus === "testing" ? (
              <ArrowsClockwise className="size-3.5 animate-spin mr-1.5" />
            ) : connectionStatus === "success" ? (
              <Check className="size-3.5 mr-1.5" />
            ) : (
              <Lightning className="size-3.5 mr-1.5" />
            )}
            {connectionStatus === "testing"
              ? t.onboarding.testingLink
              : connectionStatus === "success"
                ? t.onboarding.connectedSuccessfully
                : t.onboarding.establishConnection}
          </Button>
          {connectionStatus === "success" && (
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-600 inline-block" />
              {t.onboarding.systemOnline}
            </span>
          )}
        </div>

        {connectionStatus === "error" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="text-xs space-y-1.5 pt-1"
          >
            <p className="font-medium text-destructive flex items-center gap-1.5">
              <WarningCircle className="size-3.5" />
              {t.onboarding.troubleshooting}
            </p>
            <ul className="text-muted-foreground space-y-0.5 ml-5 list-disc">
              {!providerInfo.requiresApiKey ? (
                <>
                  <li>{t.onboarding.troubleLocalRunning.replace("{name}", providerInfo.name)}</li>
                  <li>{t.onboarding.troubleLocalUrl}</li>
                  <li>{t.onboarding.troubleLocalCors}</li>
                </>
              ) : (
                <>
                  <li>{t.onboarding.troubleCloudKey}</li>
                  <li>{t.onboarding.troubleCloudCredits}</li>
                  <li>{t.onboarding.troubleCloudUrl}</li>
                </>
              )}
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function LanguagesStep({
  t, nativeLang, setNativeLang, targetLang, setTargetLang
}: {
  t: any; nativeLang: string; setNativeLang: (l: string) => void
  targetLang: string; setTargetLang: (l: string) => void
}) {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight mb-1.5">
        Your Languages
      </h2>
      <p className="text-sm text-muted-foreground mb-8">
        Select the languages you&apos;ll translate between
      </p>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium">{t.onboarding.nativeLanguage}</span>
            {nativeLang && (
              <span className="text-[11px] text-muted-foreground">— {nativeLang}</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {translationLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setNativeLang(lang.name)}
                className={cn(
                  "p-3 rounded-xl border transition-colors text-center",
                  nativeLang === lang.name
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <span className="text-xl block mb-0.5">{lang.flag}</span>
                <span className="text-xs font-medium block">{lang.name}</span>
                {nativeLang === lang.name && (
                  <Check className="size-3 mx-auto mt-1 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium">{t.onboarding.targetLanguage}</span>
            {targetLang && (
              <span className="text-[11px] text-muted-foreground">— {targetLang}</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {translationLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setTargetLang(lang.name)}
                className={cn(
                  "p-3 rounded-xl border transition-colors text-center",
                  targetLang === lang.name
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <span className="text-xl block mb-0.5">{lang.flag}</span>
                <span className="text-xs font-medium block">{lang.name}</span>
                {targetLang === lang.name && (
                  <Check className="size-3 mx-auto mt-1 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
