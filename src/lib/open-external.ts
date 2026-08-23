/**
 * Open an external URL in the system browser.
 * - Inside Tauri: uses @tauri-apps/plugin-opener (openUrl)
 * - In browser: falls back to window.open
 * Always tries opener first, so AppImage/browser detection cannot fail.
 */
export async function openExternal(url: string): Promise<void> {
  // Try Tauri opener first (works in AppImage/.deb/.dmg/.exe/.msi)
  try {
    const { openUrl } = await import("@tauri-apps/plugin-opener")
    await openUrl(url)
    return
  } catch {
    // Not in Tauri or opener failed -> fallback to window.open
  }

  if (typeof window !== "undefined") {
    const win = window.open(url, "_blank", "noopener,noreferrer")
    // If popup blocked (Tauri webview), try location href as last resort
    if (!win) {
      try {
        window.location.href = url
      } catch {
        // ignore
      }
    }
  }
}
