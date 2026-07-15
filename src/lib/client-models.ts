import {
  type ProviderType,
  PROVIDERS,
  KNOWN_MODELS,
  parseModelsResponse,
  getModelsUrl,
} from "@/lib/providers"

export interface FetchModelsParams {
  url: string
  provider?: ProviderType
  apiKey?: string
}

export interface FetchModelsResult {
  success: boolean
  models: { id: string; object: string }[]
  error?: string
}

export async function clientFetchModels(params: FetchModelsParams): Promise<FetchModelsResult> {
  const { url, provider: providerParam, apiKey } = params

  if (!url) {
    return { success: false, models: [], error: "URL is required" }
  }

  const provider: ProviderType = providerParam || "lmstudio"
  const providerInfo = PROVIDERS[provider]

  if (!providerInfo) {
    return { success: false, models: [], error: `Unknown provider: ${provider}` }
  }

  if (!providerInfo.modelsEndpoint) {
    const knownModels = KNOWN_MODELS[provider] || []
    return {
      success: true,
      models: knownModels.map(id => ({ id, object: "model" })),
    }
  }

  const modelsUrl =
    provider === "openai"
      ? "https://api.openai.com/v1/models"
      : provider === "openrouter"
        ? "https://openrouter.ai/api/v1/models"
        : getModelsUrl(provider, url)

  if (!modelsUrl) {
    return {
      success: true,
      models: (KNOWN_MODELS[provider] || []).map(id => ({ id, object: "model" })),
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (apiKey) {
    if (provider === "openai" || provider === "openrouter" || provider === "custom") {
      headers["Authorization"] = "Bearer " + apiKey
    } else if (provider === "gemini") {
      headers["x-goog-api-key"] = apiKey
    }
  }

  try {
    const response = await fetch(modelsUrl, {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      throw new Error("Failed to fetch models: " + response.statusText)
    }

    const data = await response.json()
    const models = parseModelsResponse(provider, data)

    return { success: true, models }
  } catch (error) {
    return {
      success: false,
      models: [],
      error: (error as Error).message || "Failed to fetch models",
    }
  }
}
