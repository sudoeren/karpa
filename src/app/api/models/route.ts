import { NextResponse } from 'next/server'
import {
  type ProviderType,
  PROVIDERS,
  KNOWN_MODELS,
  parseModelsResponse,
} from '@/lib/providers'

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0']
const PRIVATE_RE = /^(10\.|127\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[0-1]\.|192\.168\.)/

function isLocalHost(h: string): boolean {
  if (LOCAL_HOSTS.includes(h)) return true
  if (h.endsWith('.local') || h.endsWith('.localhost')) return true
  if (PRIVATE_RE.test(h)) return true
  return false
}

function buildModelsUrl(provider: ProviderType, url: string, apiKey: string | undefined): string | null {
  if (provider === 'openai') {
    return 'https://api.openai.com/v1/models'
  }
  if (provider === 'anthropic') {
    return null
  }
  if (provider === 'gemini') {
    if (!apiKey) return 'https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey
    return 'https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey
  }
  const parsed = new URL(url)
  const hostname = parsed.hostname.toLowerCase()
  if (!isLocalHost(hostname)) throw new Error('URL must point to a local or private address')
  const port = parsed.port ? ':' + parsed.port : ''
  return 'http://' + hostname + port + '/v1/models'
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
      return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 })
    }

    if (!providerInfo.modelsEndpoint) {
      const knownModels = KNOWN_MODELS[provider] || []
      return NextResponse.json({
        success: true,
        models: knownModels.map(id => ({ id, object: 'model' })),
      })
    }

    const modelsUrl = buildModelsUrl(provider, url, apiKey)

    if (!modelsUrl) {
      return NextResponse.json({
        success: true,
        models: (KNOWN_MODELS[provider] || []).map(id => ({ id, object: 'model' })),
      })
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (apiKey && (provider === 'openai' || provider === 'custom')) {
      headers['Authorization'] = 'Bearer ' + apiKey
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
