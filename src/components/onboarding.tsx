"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { useOnboarding } from "@/contexts/onboarding-context"
import { Logo } from "@/components/logo"
import { 
  Languages, Shield, Zap, ArrowRight, Check, Globe, Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"

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

  const handleComplete = () => {
    completeOnboarding(nativeLang, targetLang)
  }

  const nextStep = () => {
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

            {/* Step 2: LM Studio Setup */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-green-500/10 mb-6">
                  <Zap className="size-8 text-green-500" />
                </div>

                <h2 className="text-2xl font-bold mb-2">{t.onboarding.step2Title}</h2>
                <p className="text-muted-foreground mb-6">{t.onboarding.step2Desc}</p>

                <div className="bg-muted/50 rounded-2xl p-4 text-left space-y-3">
                  {[
                    { num: "1", title: t.common.download + " LM Studio", desc: "lmstudio.ai" },
                    { num: "2", title: t.onboarding.loadModel, desc: "HY-MT1.5-7B" },
                    { num: "3", title: t.onboarding.startServer, desc: "Port: 1234" },
                  ].map((item) => (
                    <div key={item.num} className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-background flex items-center justify-center font-bold text-sm">
                        {item.num}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
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
