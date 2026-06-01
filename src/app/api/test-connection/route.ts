import { NextResponse } from 'next/server'
import {
  type ProviderType,
  PROVIDERS,
  getHeaders,
} from '@/lib/providers'

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0']
const PRIVATE_RE = /^(10\.|127\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[0-1]\.|192\.168\.)/

function isLocalHost(h: string): boolean {
  if (LOCAL_HOSTS.includes(h)) return true
  if (h.endsWith('.local') || h.endsWith('.localhost')) return true
  if (PRIVATE_RE.test(h)) return true
  return false
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

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      switch (provider) {
        case 'openai': {
          const headers = getHeaders(provider, apiKey)
          const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            signal: controller.signal,
            headers,
          })
          clearTimeout(timeoutId)
          if (response.ok) {
            const data = await response.json()
            return NextResponse.json({ success: true, models: data?.data?.length || 0, message: 'Connected to OpenAI' })
          }
          if (response.status === 401) return NextResponse.json({ success: false, error: 'Invalid API key.' }, { status: 401 })
          return NextResponse.json({ success: false, error: `OpenAI returned ${response.status}` }, { status: 502 })
        }

        case 'anthropic': {
          const parsed = new URL(url)
          const hostname = parsed.hostname.toLowerCase()
          const ALLOWED = ['api.anthropic.com']
          if (!ALLOWED.includes(hostname)) throw new Error('Invalid host')
          const port = parsed.port ? ':' + parsed.port : ''
          const headers = getHeaders(provider, apiKey)
          const response = await fetch('https://' + hostname + port + '/v1/messages', {
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
            return NextResponse.json({ success: true, models: 0, message: 'Connected to Anthropic API' })
          }
          if (response.status === 401) return NextResponse.json({ success: false, error: 'Invalid API key.' }, { status: 401 })
          return NextResponse.json({ success: false, error: `Anthropic returned ${response.status}` }, { status: 502 })
        }

        case 'gemini': {
          const parsed = new URL(url)
          const hostname = parsed.hostname.toLowerCase()
          const ALLOWED = ['generativelanguage.googleapis.com']
          if (!ALLOWED.includes(hostname)) throw new Error('Invalid host')
          const port = parsed.port ? ':' + parsed.port : ''
          const response = await fetch('https://' + hostname + port + '/v1beta/models?key=' + (apiKey || ''), {
            method: 'GET',
            signal: controller.signal,
            headers: { 'Accept': 'application/json' },
          })
          clearTimeout(timeoutId)
          if (response.ok) {
            const data = await response.json()
            return NextResponse.json({ success: true, models: data?.models?.length || 0, message: 'Connected to Google Gemini API' })
          }
          if (response.status === 400 || response.status === 403) return NextResponse.json({ success: false, error: 'Invalid API key.' }, { status: 401 })
          return NextResponse.json({ success: false, error: `Gemini returned ${response.status}` }, { status: 502 })
        }

        case 'ollama': {
          const parsed = new URL(url)
          const hostname = parsed.hostname.toLowerCase()
          const LOCAL = ['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0']
          if (!LOCAL.includes(hostname) && !hostname.endsWith('.local') && !hostname.endsWith('.localhost') && !PRIVATE_RE.test(hostname)) {
            throw new Error('Invalid host')
          }
          const port = parsed.port ? ':' + parsed.port : ''
          const response = await fetch('http://' + hostname + port + '/api/tags', {
            method: 'GET',
            signal: controller.signal,
            headers: { 'Accept': 'application/json' },
          })
          clearTimeout(timeoutId)
          if (response.ok) {
            const data = await response.json()
            return NextResponse.json({ success: true, models: data?.models?.length || 0, message: 'Connected to Ollama' })
          }
          return NextResponse.json({ success: false, error: `Ollama returned ${response.status}` }, { status: 502 })
        }

        default: {
          const parsed = new URL(url)
          const hostname = parsed.hostname.toLowerCase()
          const LOCAL = ['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0']
          if (!LOCAL.includes(hostname) && !hostname.endsWith('.local') && !hostname.endsWith('.localhost') && !PRIVATE_RE.test(hostname)) {
            throw new Error('Invalid host')
          }
          const port = parsed.port ? ':' + parsed.port : ''
          const headers: Record<string, string> = { 'Accept': 'application/json' }
          if (apiKey) headers['Authorization'] = 'Bearer ' + apiKey

          const response = await fetch('http://' + hostname + port + '/v1/models', {
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

          const healthResponse = await fetch('http://' + hostname + port + '/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(apiKey ? { 'Authorization': 'Bearer ' + apiKey } : {}),
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
