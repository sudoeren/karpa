"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useOnboarding } from "@/contexts/onboarding-context"
import { useLanguage } from "@/contexts/language-context"
import { 
  Shield, 
  Server, 
  Globe, 
  Sparkles, 
  ArrowRight, 
  Check,
  Languages
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

const steps = [
  {
    icon: Shield,
    titleKey: "step1Title" as const,
    descKey: "step1Desc" as const,
    color: "from-green-500 to-emerald-600",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Server,
    titleKey: "step2Title" as const,
    descKey: "step2Desc" as const,
    color: "from-blue-500 to-cyan-600",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Globe,
    titleKey: "step3Title" as const,
    descKey: "step3Desc" as const,
    color: "from-purple-500 to-violet-600",
    bgColor: "bg-purple-500/10",
    showLanguageSelect: true,
  },
  {
    icon: Sparkles,
    titleKey: "step4Title" as const,
    descKey: "step4Desc" as const,
    color: "from-orange-500 to-amber-600",
    bgColor: "bg-orange-500/10",
    isFinal: true,
  },
]

export function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const { completeOnboarding } = useOnboarding()
  const { t, language, setLanguage } = useLanguage()

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeOnboarding()
    }
  }

  const handleSkip = () => {
    completeOnboarding()
  }

  const step = steps[currentStep]
  const Icon = step.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 w-full max-w-lg px-4">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <div className="relative size-12 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Localce"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Localce</h1>
            <p className="text-sm text-muted-foreground">AI Translator</p>
          </div>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentStep
                  ? "w-8 bg-primary"
                  : index < currentStep
                  ? "w-2 bg-primary/50"
                  : "w-2 bg-muted"
              )}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-2 shadow-2xl">
              <CardContent className="p-8">
                {/* Icon */}
                <div className={cn("mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6", step.bgColor)}>
                  <div className={cn("p-4 rounded-xl bg-gradient-to-br", step.color)}>
                    <Icon className="size-8 text-white" />
                  </div>
                </div>

                {/* Title & Description */}
                <h2 className="text-2xl font-bold text-center mb-3">
                  {t.onboarding[step.titleKey]}
                </h2>
                <p className="text-muted-foreground text-center mb-6">
                  {t.onboarding[step.descKey]}
                </p>

                {/* Language selector (Step 3) */}
                {step.showLanguageSelect && (
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                      onClick={() => setLanguage('en')}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all flex items-center gap-3",
                        language === 'en'
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted/50 hover:bg-muted"
                      )}
                    >
                      <div className="text-2xl">🇬🇧</div>
                      <div className="text-left">
                        <p className="font-medium">English</p>
                        <p className="text-xs text-muted-foreground">Interface language</p>
                      </div>
                      {language === 'en' && <Check className="ml-auto size-5 text-primary" />}
                    </button>
                    <button
                      onClick={() => setLanguage('tr')}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all flex items-center gap-3",
                        language === 'tr'
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted/50 hover:bg-muted"
                      )}
                    >
                      <div className="text-2xl">🇹🇷</div>
                      <div className="text-left">
                        <p className="font-medium">Turkce</p>
                        <p className="text-xs text-muted-foreground">Arayuz dili</p>
                      </div>
                      {language === 'tr' && <Check className="ml-auto size-5 text-primary" />}
                    </button>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  {currentStep < steps.length - 1 && (
                    <Button
                      variant="ghost"
                      onClick={handleSkip}
                      className="flex-1"
                    >
                      {t.common.skip}
                    </Button>
                  )}
                  <Button
                    onClick={handleNext}
                    className={cn(
                      "gap-2",
                      currentStep < steps.length - 1 ? "flex-1" : "w-full"
                    )}
                  >
                    {step.isFinal ? (
                      <>
                        {t.onboarding.letsGo}
                        <Sparkles className="size-4" />
                      </>
                    ) : (
                      <>
                        {t.common.next}
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          {t.onboarding.welcomeDesc}
        </p>
      </div>
    </div>
  )
}
