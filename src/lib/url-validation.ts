export function stripTrailingSlash(s: string): string {
  let i = s.length
  while (i > 0 && s[i - 1] === '/') i--
  return s.slice(0, i)
}

const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0']

const PRIVATE_IPV4_RE =
  /^(10\.|127\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[0-1]\.|192\.168\.)/

const CANONICAL_CLOUD_HOSTS: Record<string, string> = {
  openai: 'api.openai.com',
  anthropic: 'api.anthropic.com',
  gemini: 'generativelanguage.googleapis.com',
  openrouter: 'openrouter.ai',
}

export type ProviderKey = keyof typeof CANONICAL_CLOUD_HOSTS | 'lmstudio' | 'ollama' | 'custom'

/**
 * Validate that a user-supplied base URL is safe to fetch.
 *
 * Cloud providers are pinned to their canonical hostnames. Local providers
 * must point to loopback, `*.local`/`*.localhost`, or an RFC1918 private
 * address. Throws on any other host.
 *
 * This intentionally combines allow-list validation WITH use of the URL in
 * the outbound fetch: SSRF protection requires the host to be provably
 * allowed, and CodeQL accepts a validated URL as a clean source.
 */
export function validateProviderUrl(url: string, provider: string): void {
  if (!url || !url.trim()) {
    throw new Error(`${provider} URL is required. Please enter a valid URL in Settings.`)
  }
  const parsed = new URL(url)
  const hostname = parsed.hostname.toLowerCase()

  const canonical = CANONICAL_CLOUD_HOSTS[provider]
  if (canonical) {
    if (hostname !== canonical) {
      throw new Error(`Invalid ${provider} host: ${hostname}`)
    }
    return
  }

  if (
    LOOPBACK_HOSTS.indexOf(hostname) === -1 &&
    hostname.slice(-6) !== '.local' &&
    hostname.slice(-10) !== '.localhost' &&
    !PRIVATE_IPV4_RE.test(hostname)
  ) {
    throw new Error('URL must point to a local or private address')
  }
}
