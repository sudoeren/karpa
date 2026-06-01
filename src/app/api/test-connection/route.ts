import { NextResponse } from 'next/server'
import {
  type ProviderType,
  PROVIDERS,
  getHeaders,
} from '@/lib/providers'

const PRIVATE_HOSTS = ['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0']

const CLOUD_BASES: Record<string, string> = {
  openai: 'https://api.openai.com',
  anthropic: 'https://api.anthropic.com',
  gemini: 'https://generativelanguage.googleapis.com',
}

function isPrivateIP(hostname: string): boolean {
  return PRIVATE_HOSTS.includes(hostname) ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.localhost') ||
    /^(10\.|127\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[0-1]\.|192\.168\.)/.test(hostname)
}

function getBaseUrl(url: string, provider: string): string {
  // Cloud providers use hardcoded URLs — no user input reaches fetch
  if (provider === 'openai' || provider === 'anthropic' || provider === 'gemini') {
    if (CLOUD_BASES[provider]) return CLOUD_BASES[provider]
    throw new Error(`Unknown provider: ${provider}`)
  }

  // Local providers: validate hostname against known-safe list
  const parsed = new URL(url)
  const hostname = parsed.hostname.toLowerCase()
  if (!isPrivateIP(hostname)) throw new Error('URL must point to a local or private address')

  const port = parsed.port ? `:${parsed.port}` : ''
  return `${parsed.protocol}//${hostname}${port}`
}

export async function POST(request: Request) {
  try {
    const { url, provider: providerParam, apiKey } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const provider: ProviderType = providerParam || 'lmstudio'
    const providerInfo = PROVIDERS[provider]

    if (!providerInfo) {
      return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 })
    }

    const safeBase = getBaseUrl(url, provider)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      switch (provider) {
        case 'anthropic': {
          const headers = getHeaders(provider, apiKey)
          const response = await fetch(`${safeBase}/v1/messages`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307',
              max_tokens: 1,
              messages: [{ role: 'user', content: 'ping' }],
            }),
            signal: controller.signal,
          })
          clearTimeout(timeoutId)

          if (response.ok || response.status === 400 || response.status === 422) {
            return NextResponse.json({
              success: true,
              models: 0,
              message: 'Connected to Anthropic API',
            })
          }
          
          if (response.status === 401) {
            return NextResponse.json({
              success: false,
              error: 'Invalid API key. Please check your Anthropic API key.',
            }, { status: 401 })
          }

          return NextResponse.json({
            success: false,
            error: `Anthropic API returned ${response.status}`,
          }, { status: 502 })
        }

        case 'gemini': {
          const response = await fetch(
            `${safeBase}/v1beta/models?key=${apiKey}`,
            {
              method: 'GET',
              signal: controller.signal,
              headers: { 'Accept': 'application/json' },
            }
          )
          clearTimeout(timeoutId)

          if (response.ok) {
            const data = await response.json()
            return NextResponse.json({
              success: true,
              models: data?.models?.length || 0,
              message: 'Connected to Google Gemini API',
            })
          }

          if (response.status === 400 || response.status === 403) {
            return NextResponse.json({
              success: false,
              error: 'Invalid API key. Please check your Gemini API key.',
            }, { status: 401 })
          }

          return NextResponse.json({
            success: false,
            error: `Gemini API returned ${response.status}`,
          }, { status: 502 })
        }

        case 'ollama': {
          const response = await fetch(`${safeBase}/api/tags`, {
            method: 'GET',
            signal: controller.signal,
            headers: { 'Accept': 'application/json' },
          })
          clearTimeout(timeoutId)

          if (response.ok) {
            const data = await response.json()
            return NextResponse.json({
              success: true,
              models: data?.models?.length || 0,
              message: 'Connected to Ollama',
            })
          }

          return NextResponse.json({
            success: false,
            error: `Ollama returned ${response.status}`,
          }, { status: 502 })
        }

        default: {
          const headers: Record<string, string> = { 'Accept': 'application/json' }
          if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

          const response = await fetch(`${safeBase}/v1/models`, {
            method: 'GET',
            signal: controller.signal,
            headers,
          })
          
          clearTimeout(timeoutId)

          if (response.ok) {
            const data = await response.json()
            return NextResponse.json({ 
              success: true, 
              models: data?.data?.length || 0,
              message: `Connected to ${providerInfo.name}`,
            })
          }

          if (response.status === 401) {
            return NextResponse.json({
              success: false,
              error: 'Invalid API key. Please check your API key.',
            }, { status: 401 })
          }
          
          const healthResponse = await fetch(`${safeBase}/v1/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
            },
            body: JSON.stringify({
              messages: [{ role: 'user', content: 'ping' }],
              max_tokens: 1,
            }),
          })
          
          if (healthResponse.ok || healthResponse.status === 400 || healthResponse.status === 422) {
            return NextResponse.json({ 
              success: true, 
              models: 0,
              message: `${providerInfo.name} is running but no model info available`,
            })
          }

          return NextResponse.json({ 
            success: false, 
            error: `Server returned ${response.status}` 
          }, { status: 502 })
        }
      }

    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      if ((fetchError as Error).name === 'AbortError') {
        return NextResponse.json({ 
          success: false, 
          error: 'Connection timed out' 
        }, { status: 504 })
      }
      
      const providerName = providerInfo.name
      return NextResponse.json({ 
        success: false, 
        error: `Cannot reach ${providerName}. Is the server running?` 
      }, { status: 502 })
    }

  } catch {
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid request' 
    }, { status: 400 })
  }
}
