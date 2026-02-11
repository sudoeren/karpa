import { NextResponse } from 'next/server'
import {
  type ProviderType,
  PROVIDERS,
  getHeaders,
} from '@/lib/providers'

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
    const baseUrl = url.replace(/\/+$/, '')

    try {
      switch (provider) {
        case 'anthropic': {
          // Anthropic: test by calling messages endpoint with minimal payload
          const headers = getHeaders(provider, apiKey)
          const response = await fetch(`${baseUrl}/v1/messages`, {
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

          // Any response (even 400) means the server is reachable and API key works
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
          // Gemini: test by listing models
          const response = await fetch(
            `${baseUrl}/v1beta/models?key=${apiKey}`,
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
          // Ollama: test by hitting /api/tags
          const response = await fetch(`${baseUrl}/api/tags`, {
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
          // OpenAI-compatible: LM Studio, OpenAI, Custom
          const headers: Record<string, string> = { 'Accept': 'application/json' }
          if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

          // Try the models endpoint first
          const response = await fetch(`${baseUrl}/v1/models`, {
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
          
          // If models endpoint returns error, try health check
          const healthResponse = await fetch(`${baseUrl}/v1/chat/completions`, {
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
          
          // Server is running even if it returns 400/422 (no model loaded)
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
