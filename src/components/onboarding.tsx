"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { useOnboarding } from "@/contexts/onboarding-context"
import { Logo } from "@/components/logo"
import { 
  Languages, Shield, Zap, ArrowRight, Check, Globe, Sparkles, RefreshCw, AlertCircle, Link2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const translationLanguages = [
  { code: "en", name: "English" },
  { code: "tr", name: "Turkish" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
]

export function Onboarding() {
  const [step, setStep] = useState(0)
  const { t, language, setLanguage } = useLanguage()
  const { completeOnboarding } = useOnboarding()
  const [nativeLang, setNativeLang] = useState("Turkish")
  const [targetLang, setTargetLang] = useState("English")
  
  // Connection Wizard states
  const [apiUrl, setApiUrl] = useState("http://localhost:1234")
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle")

  const testConnection = async () => {
    setConnectionStatus("testing")
    try {
      let url = apiUrl.trim()
      if (url.endsWith('/')) url = url.slice(0, -1)
      
      const response = await fetch(`${url}/v1/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })

      if (response.ok) {
        setConnectionStatus("success")
        localStorage.setItem("lm-studio-url", url)
        toast.success(t.settings.connectionSuccess)
      } else {
        setConnectionStatus("error")
        toast.error(t.settings.connectionFailed)
      }
    } catch (error) {
      setConnectionStatus("error")
      toast.error(t.settings.connectionFailed)
    }
  }

  const handleComplete = () => {
    completeOnboarding(nativeLang, targetLang)
  }

  const nextStep = () => {
    if (step === 2 && connectionStatus !== "success") {
       toast.info("Bağlantı kurulmadan devam ediyorsunuz. Çeviri özelliği çalışmayabilir.", {
         description: "LM Studio'nun açık olduğundan emin olun."
       })
    }

    if (step < 4) {
      setStep(step + 1)
    } else {
      handleComplete()
    }
  }

  const prevStep = () => {
    if (step > 0) setStep(step - 1)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg mx-4">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/50" : "w-4 bg-muted"
              )}
            />
          ))}
        </div>

        <div className="bg-card/50 backdrop-blur-xl border rounded-3xl p-8 shadow-2xl">
          <AnimatePresence mode="wait">
            {/* Step 0: Welcome */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="relative inline-block mb-6"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-violet-500 rounded-2xl blur-xl opacity-30 scale-110" />
                  <div className="relative p-4 bg-background rounded-2xl border shadow-xl">
                    <Logo size={64} />
                  </div>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold mb-2"
                >
                  {t.onboarding.welcome}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-muted-foreground mb-8"
                >
                  {t.onboarding.welcomeDesc}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="grid grid-cols-3 gap-3 mb-8"
                >
                  {[
                    { icon: Shield, text: t.onboarding.local },
                    { icon: Zap, text: t.onboarding.aiPowered },
                    { icon: Globe, text: t.onboarding.multiLang },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-xl bg-muted/50 text-center">
                      <item.icon className="size-5 mx-auto mb-1 text-primary" />
                      <span className="text-xs font-medium">{item.text}</span>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* Step 1: Interface Language */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-primary/10 mb-6">
                  <Globe className="size-8 text-primary" />
                </div>

                <h2 className="text-2xl font-bold mb-2">{t.onboarding.step3Title}</h2>
                <p className="text-muted-foreground mb-6">{t.onboarding.step3Desc}</p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { code: "en" as const, name: "English", nativeName: "English", flag: "🇬🇧" },
                    { code: "tr" as const, name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                        language === lang.code
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted/50 hover:bg-muted"
                      )}
                    >
                      <span className="text-2xl">{lang.flag}</span>
                      <div className="text-left">
                        <p className="font-medium">{lang.nativeName}</p>
                      </div>
                      {language === lang.code && <Check className="size-5 text-primary ml-auto" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: LM Studio Setup Wizard */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <div className={cn(
                  "inline-flex items-center justify-center size-16 rounded-2xl mb-6 transition-colors",
                  connectionStatus === "success" ? "bg-green-500/10" : "bg-primary/10"
                )}>
                  {connectionStatus === "success" ? (
                    <Check className="size-8 text-green-500" />
                  ) : (
                    <Zap className="size-8 text-primary" />
                  )}
                </div>

                <h2 className="text-2xl font-bold mb-2">{t.onboarding.step2Title}</h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  {t.onboarding.step2Desc}
                </p>

                <div className="space-y-4 mb-6">
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input 
                      value={apiUrl}
                      onChange={(e) => {
                        setApiUrl(e.target.value)
                        if (connectionStatus !== "idle") setConnectionStatus("idle")
                      }}
                      placeholder="http://localhost:1234"
                      className="pl-10 h-12 rounded-xl bg-muted/50 border-transparent focus:border-primary transition-all"
                    />
                  </div>

                  <Button 
                    onClick={testConnection}
                    disabled={connectionStatus === "testing"}
                    variant={connectionStatus === "success" ? "outline" : "default"}
                    className={cn(
                      "w-full h-12 rounded-xl font-bold transition-all",
                      connectionStatus === "success" && "border-green-500/50 text-green-600"
                    )}
                  >
                    {connectionStatus === "testing" ? (
                      <RefreshCw className="size-4 mr-2 animate-spin" />
                    ) : connectionStatus === "success" ? (
                      <Check className="size-4 mr-2" />
                    ) : (
                      <Zap className="size-4 mr-2" />
                    )}
                    {connectionStatus === "success" ? t.settings.connectionSuccess : t.settings.testConnection}
                  </Button>

                  {connectionStatus === "error" && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="p-3 bg-destructive/5 rounded-xl border border-destructive/10 text-[11px] text-destructive text-left"
                    >
                      <div className="flex gap-2">
                        <AlertCircle className="size-4 shrink-0" />
                        <ul className="list-disc pl-3 space-y-1 opacity-90">
                          <li>LM Studio'nun açık olduğundan emin olun.</li>
                          <li>"Start Server" butonuna bastığınızdan emin olun.</li>
                          <li>Portun 1234 olduğunu doğrulayın.</li>
                          <li>LM Studio ayarlarından CORS'u açın.</li>
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="bg-muted/30 rounded-2xl p-4 text-left">
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Hızlı Kurulum Rehberi</p>
                   <div className="space-y-2">
                      {[
                        { num: "1", title: "Modeli Yükle", desc: "HY-MT1.5-7B" },
                        { num: "2", title: "Sunucuyu Başlat", desc: "Local Server -> Start Server" }
                      ].map((item) => (
                        <div key={item.num} className="flex items-center gap-3">
                          <div className="size-6 rounded-lg bg-background flex items-center justify-center font-bold text-[10px] border">
                            {item.num}
                          </div>
                          <div>
                            <p className="font-bold text-[11px] leading-tight">{item.title}</p>
                            <p className="text-[10px] text-muted-foreground leading-tight">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Native Language */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-violet-500/10 mb-6">
                  <Languages className="size-8 text-violet-500" />
                </div>

                <h2 className="text-2xl font-bold mb-2">
                  {t.onboarding.nativeLanguage}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {t.onboarding.nativeLanguageDesc}
                </p>

                <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
                  {translationLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setNativeLang(lang.name)}
                      className={cn(
                        "p-3 rounded-xl border-2 text-sm font-medium transition-all",
                        nativeLang === lang.name
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-transparent bg-muted/50 hover:bg-muted"
                      )}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 4: Target Language */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-orange-500/10 mb-6">
                  <Sparkles className="size-8 text-orange-500" />
                </div>

                <h2 className="text-2xl font-bold mb-2">
                  {t.onboarding.targetLanguage}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {t.onboarding.targetLanguageDesc}
                </p>

                <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
                  {translationLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setTargetLang(lang.name)}
                      className={cn(
                        "p-3 rounded-xl border-2 text-sm font-medium transition-all",
                        targetLang === lang.name
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-transparent bg-muted/50 hover:bg-muted"
                      )}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={prevStep}
                className="flex-1 h-12 rounded-xl"
              >
                {t.common.back}
              </Button>
            )}
            
            <Button
              onClick={nextStep}
              className={cn(
                "h-12 rounded-xl gap-2",
                step === 0 ? "w-full" : "flex-1"
              )}
            >
              {step === 4 ? t.onboarding.letsGo : step === 0 ? t.onboarding.getStarted : t.common.next}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Skip */}
        {step < 4 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-4"
          >
            <Button
              variant="ghost"
              onClick={handleComplete}
              className="text-muted-foreground"
            >
              {t.common.skip}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
