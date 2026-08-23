/**
 * Open an external URL in the system browser.
 * - Inside Tauri: uses @tauri-apps/plugin-opener
 * - In browser: falls back to window.open
 */
export async function openExternal(url: string): Promise<void> {
  try {
    // Tauri webview injects __TAURI__ / __TAURI_INTERNALS__
    const maybeTauri =
      typeof window !== "undefined" &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).__TAURI_INTERNALS__ !== undefined ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__TAURI__ !== undefined)

    if (maybeTauri) {
      const { openUrl } = await import("@tauri-apps/plugin-opener")
      await openUrl(url)
      return
    }
  } catch {
    // fall through to window.open
  }

  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer")
  }
}
