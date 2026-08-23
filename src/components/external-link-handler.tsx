"use client"

import { useEffect } from "react"
import { openExternal } from "@/lib/open-external"

export function ExternalLinkHandler() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return
      const target = e.target as HTMLElement | null
      if (!target) return
      const anchor = target.closest("a") as HTMLAnchorElement | null
      if (!anchor) return
      const href = anchor.getAttribute("href")
      if (!href) return
      // Only handle http/https external links
      if (!/^https?:\/\//.test(href)) return
      // Allow internal navigation for same origin if needed? All https are external in Tauri (no server)
      // Prevent default webview navigation and use system browser
      e.preventDefault()
      e.stopPropagation()
      openExternal(href)
    }

    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [])

  return null
}
