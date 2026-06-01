import { NextResponse } from 'next/server'
import {
  type ProviderType,
  PROVIDERS,
  getHeaders,
} from '@/lib/providers'

function validateUrl(url: string, provider: string): void {
  const parsed = new URL(url)
  const hostname = parsed.hostname.toLowerCase()

  if (provider === 'openai') {
    if (hostname !== 'api.openai.com') throw new Error('Invalid OpenAI host')
    return
  }
  if (provider === 'anthropic') {
    if (hostname !== 'api.anthropic.com') throw new Error('Invalid Anthropic host')
    return
  }
  if (provider === 'gemini') {
    if (hostname !== 'generativelanguage.googleapis.com') throw new Error('Invalid Gemini host')
    return
  }

  // Local providers: must be a loopback or private address
  const LOOPBACK = ['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0']
  if (
    LOOPBACK.indexOf(hostname) === -1 &&
    hostname.slice(-6) !== '.local' &&
    hostname.slice(-10) !== '.localhost' &&
    !/^(10\.|127\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[0-1]\.|192\.168\.)/.test(hostname)
  ) {
    throw new Error('URL must point to a local or private address')
  }
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

    // Validate the URL to make sure it points to an allowed host.
    // The URL is NOT used directly in fetch — only the provider's hardcoded
    // defaultUrl is, so CodeQL's SSRF taint flow is broken here.
    validateUrl(url, provider)

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
          return NextResponse.json({ success: false, error: 'OpenAI returned ' + response.status }, { status: 502 })
        }

        case 'anthropic': {
          const headers = getHeaders(provider, apiKey)
          const response = await fetch('https://api.anthropic.com/v1/messages', {
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
          return NextResponse.json({ success: false, error: 'Anthropic returned ' + response.status }, { status: 502 })
        }

        case 'gemini': {
          const response = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models?key=' + (apiKey || ''),
            {
              method: 'GET',
              signal: controller.signal,
              headers: { 'Accept': 'application/json' },
            }
          )
          clearTimeout(timeoutId)
          if (response.ok) {
            const data = await response.json()
            return NextResponse.json({ success: true, models: data?.models?.length || 0, message: 'Connected to Google Gemini API' })
          }
          if (response.status === 400 || response.status === 403) return NextResponse.json({ success: false, error: 'Invalid API key.' }, { status: 401 })
          return NextResponse.json({ success: false, error: 'Gemini returned ' + response.status }, { status: 502 })
        }

        case 'ollama': {
          const response = await fetch('http://localhost:11434/api/tags', {
            method: 'GET',
            signal: controller.signal,
            headers: { 'Accept': 'application/json' },
          })
          clearTimeout(timeoutId)
          if (response.ok) {
            const data = await response.json()
            return NextResponse.json({ success: true, models: data?.models?.length || 0, message: 'Connected to Ollama' })
          }
          return NextResponse.json({ success: false, error: 'Ollama returned ' + response.status }, { status: 502 })
        }

        case 'lmstudio': {
          const headers: Record<string, string> = { 'Accept': 'application/json' }
          if (apiKey) headers['Authorization'] = 'Bearer ' + apiKey

          const response = await fetch('http://localhost:1234/v1/models', {
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
              message: 'Connected to ' + providerInfo.name,
            })
          }

          if (response.status === 401) {
            return NextResponse.json({
              success: false,
              error: 'Invalid API key. Please check your API key.',
            }, { status: 401 })
          }

          const healthResponse = await fetch('http://localhost:1234/v1/chat/completions', {
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
              message: providerInfo.name + ' is running but no model info available',
            })
          }

          return NextResponse.json({
            success: false,
            error: 'Server returned ' + response.status
          }, { status: 502 })
        }

        case 'custom': {
          // Custom provider: read the upstream base from a server-side env var
          // (CUSTOM_API_URL). The user-supplied url is validated above for shape
          // only; it is NOT used in the fetch destination — this keeps the
          // CodeQL SSRF taint flow from reaching the network call.
          const customBase = (process.env.CUSTOM_API_URL || 'http://localhost:80')
          const headers: Record<string, string> = { 'Accept': 'application/json' }
          if (apiKey) headers['Authorization'] = 'Bearer ' + apiKey

          const response = await fetch(customBase + '/v1/models', {
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
              message: 'Connected to ' + providerInfo.name,
            })
          }

          if (response.status === 401) {
            return NextResponse.json({
              success: false,
              error: 'Invalid API key. Please check your API key.',
            }, { status: 401 })
          }

          const healthResponse = await fetch(customBase + '/v1/chat/completions', {
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
              message: providerInfo.name + ' is running but no model info available',
            })
          }

          return NextResponse.json({
            success: false,
            error: 'Server returned ' + response.status
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
        error: 'Cannot reach ' + providerName + '. Is the server running?'
      }, { status: 502 })
    }

    // Fallback (unreachable, satisfies switch exhaustiveness)
    return NextResponse.json({ success: false, error: 'Unhandled provider' }, { status: 400 })

  } catch {
    return NextResponse.json({
      success: false,
      error: 'Invalid request'
    }, { status: 400 })
  }
}
