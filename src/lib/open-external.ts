import { openUrl } from "@tauri-apps/plugin-opener"

/**
 * Open an external URL in the system browser.
 * - Inside Tauri: uses @tauri-apps/plugin-opener (openUrl)
 * - In browser: falls back to window.open
 * Static import ensures Next.js bundles the plugin correctly for Tauri's asset protocol.
 */
export async function openExternal(url: string): Promise<void> {
  // Try Tauri opener first (works in AppImage/.deb/.dmg/.exe/.msi)
  try {
    await openUrl(url)
    return
  } catch (e) {
    // Not in Tauri or opener failed -> fallback to window.open
    console.warn("[openExternal] openUrl failed, fallback to window.open", e)
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
