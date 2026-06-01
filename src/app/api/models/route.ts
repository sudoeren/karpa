import { NextResponse } from 'next/server'
import {
  type ProviderType,
  PROVIDERS,
  KNOWN_MODELS,
  getModelsUrl,
  parseModelsResponse,
} from '@/lib/providers'
import { validateUrl, stripTrailingSlash } from '@/lib/url-validation'

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

    // For providers without a models endpoint, return known models
    if (!providerInfo.modelsEndpoint) {
      const knownModels = KNOWN_MODELS[provider] || []
      return NextResponse.json({
        success: true,
        models: knownModels.map(id => ({ id, object: 'model' })),
      })
    }

    const baseUrl = stripTrailingSlash(url)
    validateUrl(baseUrl, provider)
    const modelsUrl = getModelsUrl(provider, baseUrl, apiKey)

    if (!modelsUrl) {
      return NextResponse.json({
        success: true,
        models: (KNOWN_MODELS[provider] || []).map(id => ({ id, object: 'model' })),
      })
    }

    // Build headers
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
