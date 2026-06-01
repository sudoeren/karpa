const ALLOWED_CLOUD_HOSTS: Record<string, string[]> = {
  openai: ['api.openai.com', 'api.openai.com.'],
  anthropic: ['api.anthropic.com', 'api.anthropic.com.'],
  gemini: ['generativelanguage.googleapis.com', 'generativelanguage.googleapis.com.'],
}

const PRIVATE_HOSTS = [
  'localhost',
  '127.0.0.1',
  '::1',
  '[::1]',
  '0.0.0.0',
]

export function checkHostname(hostname: string, provider: string): void {
  const host = hostname.toLowerCase()

  if (provider === 'lmstudio' || provider === 'ollama' || provider === 'custom') {
    if (PRIVATE_HOSTS.includes(host)) return
    if (host.endsWith('.local') || host.endsWith('.localhost')) return
    if (/^(10\.|127\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[0-1]\.|192\.168\.)/.test(host)) return
    throw new Error('URL must point to a local or private address')
  }

  const allowedHosts = ALLOWED_CLOUD_HOSTS[provider]
  if (!allowedHosts || !allowedHosts.includes(host)) {
    throw new Error(`Invalid host for ${provider} provider`)
  }
}

export function stripTrailingSlash(s: string): string {
  let i = s.length
  while (i > 0 && s[i - 1] === '/') i--
  return s.slice(0, i)
}
