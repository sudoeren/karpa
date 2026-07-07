import { NextResponse } from 'next/server'
import {
  type ProviderType,
  PROVIDERS,
  KNOWN_MODELS,
  parseModelsResponse,
  getModelsUrl,
} from '@/lib/providers'
import { validateProviderUrl } from '@/lib/url-validation'

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

    // Validate that the user-supplied base URL is safe to fetch. After this
    // succeeds, the URL is provably on an allowed host and is used to build
    // the outbound fetch URL — that's the whole point of the validation.
    let validatedUrl: string
    try {
      validatedUrl = validateProviderUrl(url, provider)
    } catch (validationError) {
      return NextResponse.json(
        { success: false, error: (validationError as Error).message },
        { status: 400 }
      )
    }

    const modelsUrl = provider === 'openai'
      ? 'https://api.openai.com/v1/models'
      : provider === 'openrouter'
        ? 'https://openrouter.ai/api/v1/models'
        : getModelsUrl(provider, validatedUrl)

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
      if (provider === 'openai' || provider === 'openrouter' || provider === 'custom') {
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
