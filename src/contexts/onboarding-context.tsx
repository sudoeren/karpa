"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type OnboardingContextType = {
  hasCompletedOnboarding: boolean
  completeOnboarding: () => void
  resetOnboarding: () => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true) // Default to true to prevent flash
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const completed = localStorage.getItem('localce-onboarding-completed')
    setHasCompletedOnboarding(completed === 'true')
  }, [])

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true)
    localStorage.setItem('localce-onboarding-completed', 'true')
  }

  const resetOnboarding = () => {
    setHasCompletedOnboarding(false)
    localStorage.removeItem('localce-onboarding-completed')
  }

  if (!mounted) {
    return null
  }

  return (
    <OnboardingContext.Provider value={{ hasCompletedOnboarding, completeOnboarding, resetOnboarding }}>
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
