"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type OnboardingContextType = {
  hasCompletedOnboarding: boolean
  completeOnboarding: (nativeLang?: string, targetLang?: string) => void
  resetOnboarding: () => void
  nativeLanguage: string
  targetLanguage: string
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true) // Default to true to prevent flash
  const [nativeLanguage, setNativeLanguage] = useState("Turkish")
  const [targetLanguage, setTargetLanguage] = useState("English")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    const completed = localStorage.getItem('karpa-onboarding-completed')
    const savedNative = localStorage.getItem('karpa-native-language')
    const savedTarget = localStorage.getItem('karpa-target-language')
    
    setHasCompletedOnboarding(completed === 'true')
    if (savedNative) setNativeLanguage(savedNative)
    if (savedTarget) setTargetLanguage(savedTarget)
  }, [])

  const completeOnboarding = (nativeLang?: string, targetLang?: string) => {
    setHasCompletedOnboarding(true)
    localStorage.setItem('karpa-onboarding-completed', 'true')
    
    if (nativeLang) {
      setNativeLanguage(nativeLang)
      localStorage.setItem('karpa-native-language', nativeLang)
    }
    if (targetLang) {
      setTargetLanguage(targetLang)
      localStorage.setItem('karpa-target-language', targetLang)
    }
  }

  const resetOnboarding = () => {
    setHasCompletedOnboarding(false)
    localStorage.removeItem('karpa-onboarding-completed')
    localStorage.removeItem('karpa-native-language')
    localStorage.removeItem('karpa-target-language')
  }

  if (!mounted) {
    return null
  }

  return (
    <OnboardingContext.Provider value={{ 
      hasCompletedOnboarding, 
      completeOnboarding, 
      resetOnboarding,
      nativeLanguage,
      targetLanguage
    }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}
