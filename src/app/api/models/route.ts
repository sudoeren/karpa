import { NextResponse } from 'next/server'
import {
  type ProviderType,
  PROVIDERS,
  KNOWN_MODELS,
  parseModelsResponse,
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

// Resolve the models-list URL for a provider. Built from hardcoded constants
// or server-side env vars — the user-supplied url is never part of fetch.
function resolveModelsUrl(provider: ProviderType): string | null {
  const info = PROVIDERS[provider]
  if (!info.modelsEndpoint) return null

  if (provider === 'openai') {
    return 'https://api.openai.com' + info.modelsEndpoint
  }
  if (provider === 'anthropic') {
    return null
  }
  if (provider === 'gemini') {
    return 'https://generativelanguage.googleapis.com/v1beta/models'
  }
  if (provider === 'ollama') {
    return (process.env.OLLAMA_API_URL || 'http://localhost:11434') + info.modelsEndpoint
  }
  if (provider === 'lmstudio') {
    return (process.env.LM_STUDIO_API_URL || 'http://localhost:1234') + info.modelsEndpoint
  }
  // custom
  return (process.env.CUSTOM_API_URL || 'http://localhost:80') + info.modelsEndpoint
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { url, provider: providerParam, apiKey } = body

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const provider: ProviderType = providerParam || 'lmstudio'
    const providerInfo = PROVIDERS[provider]

    if (!providerInfo) {
      return NextResponse.json({ error: 'Unknown provider: ' + provider }, { status: 400 })
    }

    if (!providerInfo.modelsEndpoint) {
      const knownModels = KNOWN_MODELS[provider] || []
      return NextResponse.json({
        success: true,
        models: knownModels.map(id => ({ id, object: 'model' })),
      })
    }

    // Validate url for shape only — it is NOT used to build the fetch URL.
    validateUrl(url, provider)

    const modelsUrl = resolveModelsUrl(provider)

    if (!modelsUrl) {
      return NextResponse.json({
        success: true,
        models: (KNOWN_MODELS[provider] || []).map(id => ({ id, object: 'model' })),
      })
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (apiKey) {
      if (provider === 'openai' || provider === 'custom') {
        headers['Authorization'] = 'Bearer ' + apiKey
      } else if (provider === 'gemini') {
        headers['x-goog-api-key'] = apiKey
      }
    }

    const response = await fetch(modelsUrl, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error('Failed to fetch models: ' + response.statusText)
    }

    const data = await response.json()
    const models = parseModelsResponse(provider, data)

    return NextResponse.json({
      success: true,
      models,
    })

  } catch (error) {
    console.error('Model fetch error:', error)
    return NextResponse.json({
      success: false,
      error: (error as Error).message || 'Failed to fetch models'
    }, { status: 500 })
  }
}
