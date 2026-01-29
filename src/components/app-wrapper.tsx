"use client"

import { ReactNode, useEffect } from "react"
import { useOnboarding } from "@/contexts/onboarding-context"
import { Onboarding } from "@/components/onboarding"

export function AppWrapper({ children }: { children: ReactNode }) {
  const { hasCompletedOnboarding } = useOnboarding()

  useEffect(() => {
    const savedAmoled = localStorage.getItem("localce-amoled")
    if (savedAmoled === "true") {
      document.documentElement.classList.add("amoled")
    }
  }, [])

  if (!hasCompletedOnboarding) {
    return <Onboarding />
  }

  return <>{children}</>
}
