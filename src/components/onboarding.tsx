"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { useOnboarding } from "@/contexts/onboarding-context"
import { 
  Languages, Shield, Zap, ArrowRight, Check, Globe
} from "lucide-react"
import { cn } from "@/lib/utils"

export function Onboarding() {
  const [step, setStep] = useState(0)
  const { t, language, setLanguage } = useLanguage()
  const { completeOnboarding } = useOnboarding()

  const handleComplete = () => {
    completeOnboarding()
  }

  const nextStep = () => {
    if (step < 2) {
      setStep(step + 1)
    } else {
      handleComplete()
    }
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
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                i === step ? "w-8 bg-primary" : "w-2 bg-muted"
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              {/* Logo */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center size-24 rounded-3xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground mb-6 shadow-2xl shadow-primary/25"
              >
                <Languages className="size-12" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold mb-2"
              >
                Localce
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground mb-8"
              >
                {t.onboarding.welcomeDesc}
              </motion.p>

              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 gap-3 mb-8"
              >
                {[
                  { icon: Shield, text: t.onboarding.step1Title },
                  { icon: Zap, text: "AI Powered" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-card/50 border"
                  >
                    <div className="p-2 rounded-xl bg-primary/10">
                      <item.icon className="size-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{item.text}</span>
                  </div>
                ))}
              </motion.div>

              <Button
                onClick={nextStep}
                size="lg"
                className="w-full h-14 rounded-2xl text-base font-medium gap-2"
              >
                {t.onboarding.getStarted}
                <ArrowRight className="size-5" />
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center size-20 rounded-2xl bg-green-500/10 mb-6"
              >
                <Zap className="size-10 text-green-500" />
              </motion.div>

              <h2 className="text-2xl font-bold mb-2">{t.onboarding.step2Title}</h2>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                {t.onboarding.step2Desc}
              </p>

              {/* Connection Info */}
              <div className="bg-card/50 border rounded-2xl p-6 mb-8 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-10 rounded-xl bg-muted flex items-center justify-center">
                    <span className="text-lg font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Download LM Studio</p>
                    <p className="text-xs text-muted-foreground">lmstudio.ai</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-10 rounded-xl bg-muted flex items-center justify-center">
                    <span className="text-lg font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Load a translation model</p>
                    <p className="text-xs text-muted-foreground">HY-MT1.5-7B recommended</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-muted flex items-center justify-center">
                    <span className="text-lg font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Start the server</p>
                    <p className="text-xs text-muted-foreground">Default port: 1234</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={nextStep}
                size="lg"
                className="w-full h-14 rounded-2xl text-base font-medium gap-2"
              >
                {t.common.next}
                <ArrowRight className="size-5" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center size-20 rounded-2xl bg-violet-500/10 mb-6"
              >
                <Globe className="size-10 text-violet-500" />
              </motion.div>

              <h2 className="text-2xl font-bold mb-2">{t.onboarding.step3Title}</h2>
              <p className="text-muted-foreground mb-8">
                {t.onboarding.step3Desc}
              </p>

              {/* Language Selection */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { code: "en" as const, name: "English", flag: "GB" },
                  { code: "tr" as const, name: "Turkce", flag: "TR" },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={cn(
                      "flex items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all",
                      language === lang.code
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-card/50 hover:bg-muted/50"
                    )}
                  >
                    <span className="text-2xl">{lang.flag === "GB" ? "🇬🇧" : "🇹🇷"}</span>
                    <span className="font-medium">{lang.name}</span>
                    {language === lang.code && (
                      <Check className="size-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>

              <Button
                onClick={handleComplete}
                size="lg"
                className="w-full h-14 rounded-2xl text-base font-medium gap-2 bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90"
              >
                {t.onboarding.letsGo}
                <ArrowRight className="size-5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip */}
        {step < 2 && (
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
