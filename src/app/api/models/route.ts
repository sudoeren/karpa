import { NextResponse } from 'next/server'
import {
  type ProviderType,
  PROVIDERS,
  KNOWN_MODELS,
  getModelsUrl,
  parseModelsResponse,
} from '@/lib/providers'

const PRIVATE_HOSTS = ['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0']

function isPrivateIP(hostname: string): boolean {
  return PRIVATE_HOSTS.includes(hostname) ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.localhost') ||
    /^(10\.|127\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[0-1]\.|192\.168\.)/.test(hostname)
}

function validateAndGetBase(url: string, provider: string): string {
  if (provider === 'openai' || provider === 'anthropic' || provider === 'gemini') {
    const CLOUD_BASES: Record<string, string> = {
      openai: 'https://api.openai.com',
      anthropic: 'https://api.anthropic.com',
      gemini: 'https://generativelanguage.googleapis.com',
    }
    if (CLOUD_BASES[provider]) return CLOUD_BASES[provider]
    throw new Error(`Unknown provider: ${provider}`)
  }

  const parsed = new URL(url)
  const hostname = parsed.hostname.toLowerCase()
  if (!isPrivateIP(hostname)) throw new Error('URL must point to a local or private address')

  const port = parsed.port ? `:${parsed.port}` : ''
  return `${parsed.protocol}//${hostname}${port}`
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

    const safeBase = validateAndGetBase(url, provider)
    const modelsUrl = getModelsUrl(provider, safeBase, apiKey)

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
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const response = await fetch(modelsUrl, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`)
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
