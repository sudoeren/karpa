const ALLOWED_CLOUD_HOSTS: Record<string, string[]> = {
  openai: ['api.openai.com', 'api.openai.com.'],
  anthropic: ['api.anthropic.com', 'api.anthropic.com.'],
  gemini: ['generativelanguage.googleapis.com', 'generativelanguage.googleapis.com.'],
}

function isPrivateIP(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]' ||
    hostname === '0.0.0.0' ||
    hostname.startsWith('127.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.16.') ||
    hostname.startsWith('172.17.') ||
    hostname.startsWith('172.18.') ||
    hostname.startsWith('172.19.') ||
    hostname.startsWith('172.20.') ||
    hostname.startsWith('172.21.') ||
    hostname.startsWith('172.22.') ||
    hostname.startsWith('172.23.') ||
    hostname.startsWith('172.24.') ||
    hostname.startsWith('172.25.') ||
    hostname.startsWith('172.26.') ||
    hostname.startsWith('172.27.') ||
    hostname.startsWith('172.28.') ||
    hostname.startsWith('172.29.') ||
    hostname.startsWith('172.30.') ||
    hostname.startsWith('172.31.') ||
    hostname.startsWith('192.168.') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.localhost')
  )
}

function isHostnameAnIP(hostname: string): boolean {
  // IPv4
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return true
  // IPv6
  if (hostname.includes(':')) return true
  return false
}

export function validateUrl(url: string, provider: string): string {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('Invalid URL format')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('URL must use http or https protocol')
  }

  const hostname = parsed.hostname.toLowerCase()

  if (provider === 'lmstudio' || provider === 'ollama' || provider === 'custom') {
    if (!isPrivateIP(hostname) && !hostname.endsWith('.local') && !hostname.endsWith('.localhost')) {
      // For local/custom providers, allow private IPs and local hostnames
      // Block public IPs to prevent SSRF to cloud metadata endpoints etc.
      if (isHostnameAnIP(hostname) && !isPrivateIP(hostname)) {
        throw new Error('URL must point to a local or private address')
      }
    }
  } else {
    const allowedHosts = ALLOWED_CLOUD_HOSTS[provider]
    if (!allowedHosts || !allowedHosts.includes(hostname)) {
      throw new Error(`Invalid host for ${provider} provider`)
    }
  }

  return url
}

export function stripTrailingSlash(s: string): string {
  let i = s.length
  while (i > 0 && s[i - 1] === '/') i--
  return s.slice(0, i)
}
