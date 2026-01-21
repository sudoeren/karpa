"use client"

import { ReactNode } from "react"
import { useOnboarding } from "@/contexts/onboarding-context"
import { Onboarding } from "@/components/onboarding"

export function AppWrapper({ children }: { children: ReactNode }) {
  const { hasCompletedOnboarding } = useOnboarding()

  if (!hasCompletedOnboarding) {
    return <Onboarding />
  }

  return <>{children}</>
}
