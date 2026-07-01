import { NextResponse } from 'next/server'
import {
  type ProviderType,
  PROVIDERS,
  getHeaders,
  getChatCompletionUrl,
  getModelsUrl,
} from '@/lib/providers'
import { validateProviderUrl, stripTrailingSlash } from '@/lib/url-validation'

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

    // Validate that the user-supplied base URL is safe to fetch. After this
    // succeeds, the URL is provably on an allowed host and is used to build
    // the outbound fetch URL — that's the whole point of the validation.
    try {
      validateProviderUrl(url, provider)
    } catch (validationError) {
      return NextResponse.json(
        { success: false, error: (validationError as Error).message },
        { status: 400 }
      )
    }

    const baseUrl = stripTrailingSlash(url)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      switch (provider) {
        case 'openai': {
          const headers = getHeaders(provider, apiKey)
          const response = await fetch(getModelsUrl(provider, baseUrl) || 'https://api.openai.com/v1/models', {
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
          const response = await fetch(baseUrl + '/v1/messages', {
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
          const headers: Record<string, string> = { 'Accept': 'application/json' }
          if (apiKey) headers['x-goog-api-key'] = apiKey
          const response = await fetch(
            baseUrl + '/v1beta/models',
            {
              method: 'GET',
              signal: controller.signal,
              headers,
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
          const response = await fetch(baseUrl + '/api/tags', {
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

          const response = await fetch(baseUrl + '/v1/models', {
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

          const healthResponse = await fetch(getChatCompletionUrl(provider, baseUrl), {
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
          const headers: Record<string, string> = { 'Accept': 'application/json' }
          if (apiKey) headers['Authorization'] = 'Bearer ' + apiKey

          const response = await fetch(baseUrl + '/v1/models', {
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

          const healthResponse = await fetch(getChatCompletionUrl(provider, baseUrl), {
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
