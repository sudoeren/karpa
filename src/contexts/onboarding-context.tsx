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
    setMounted(true)
    const completed = localStorage.getItem('localce-onboarding-completed')
    const savedNative = localStorage.getItem('localce-native-language')
    const savedTarget = localStorage.getItem('localce-target-language')
    
    setHasCompletedOnboarding(completed === 'true')
    if (savedNative) setNativeLanguage(savedNative)
    if (savedTarget) setTargetLanguage(savedTarget)
  }, [])

  const completeOnboarding = (nativeLang?: string, targetLang?: string) => {
    setHasCompletedOnboarding(true)
    localStorage.setItem('localce-onboarding-completed', 'true')
    
    if (nativeLang) {
      setNativeLanguage(nativeLang)
      localStorage.setItem('localce-native-language', nativeLang)
    }
    if (targetLang) {
      setTargetLanguage(targetLang)
      localStorage.setItem('localce-target-language', targetLang)
    }
  }

  const resetOnboarding = () => {
    setHasCompletedOnboarding(false)
    localStorage.removeItem('localce-onboarding-completed')
    localStorage.removeItem('localce-native-language')
    localStorage.removeItem('localce-target-language')
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
