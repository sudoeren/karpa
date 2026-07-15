import {
  type ProviderType,
  PROVIDERS,
  getHeaders,
  getChatCompletionUrl,
  getModelsUrl,
} from "@/lib/providers"

export interface TestConnectionParams {
  url: string
  provider?: ProviderType
  apiKey?: string
}

export interface TestConnectionResult {
  success: boolean
  models?: number
  message?: string
  error?: string
}

export async function clientTestConnection(params: TestConnectionParams): Promise<TestConnectionResult> {
  const { url, provider: providerParam, apiKey } = params

  if (!url) {
    return { success: false, error: "URL is required" }
  }

  const provider: ProviderType = providerParam || "lmstudio"
  const providerInfo = PROVIDERS[provider]

  if (!providerInfo) {
    return { success: false, error: `Unknown provider: ${provider}` }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    switch (provider) {
      case "openai": {
        const headers = getHeaders(provider, apiKey)
        const response = await fetch("https://api.openai.com/v1/models", {
          method: "GET",
          signal: controller.signal,
          headers,
        })
        clearTimeout(timeoutId)
        if (response.ok) {
          const data = await response.json()
          return { success: true, models: data?.data?.length || 0, message: "Connected to OpenAI" }
        }
        if (response.status === 401) return { success: false, error: "Invalid API key." }
        return { success: false, error: "OpenAI returned " + response.status }
      }

      case "anthropic": {
        const headers = getHeaders(provider, apiKey)
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 1,
            messages: [{ role: "user", content: "ping" }],
          }),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        if (response.ok || response.status === 400 || response.status === 422) {
          return { success: true, models: 0, message: "Connected to Anthropic API" }
        }
        if (response.status === 401) return { success: false, error: "Invalid API key." }
        return { success: false, error: "Anthropic returned " + response.status }
      }

      case "gemini": {
        const headers: Record<string, string> = { Accept: "application/json" }
        if (apiKey) headers["x-goog-api-key"] = apiKey
        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models",
          {
            method: "GET",
            signal: controller.signal,
            headers,
          }
        )
        clearTimeout(timeoutId)
        if (response.ok) {
          const data = await response.json()
          return { success: true, models: data?.models?.length || 0, message: "Connected to Google Gemini API" }
        }
        if (response.status === 400 || response.status === 403) return { success: false, error: "Invalid API key." }
        return { success: false, error: "Gemini returned " + response.status }
      }

      case "ollama": {
        const response = await fetch(getModelsUrl(provider, url)!, {
          method: "GET",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        })
        clearTimeout(timeoutId)
        if (response.ok) {
          const data = await response.json()
          return { success: true, models: data?.models?.length || 0, message: "Connected to Ollama" }
        }
        return { success: false, error: "Ollama returned " + response.status }
      }

      case "lmstudio": {
        const headers: Record<string, string> = { Accept: "application/json" }
        if (apiKey) headers["Authorization"] = "Bearer " + apiKey

        const response = await fetch(getModelsUrl(provider, url)!, {
          method: "GET",
          signal: controller.signal,
          headers,
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          return {
            success: true,
            models: data?.data?.length || 0,
            message: `Connected to ${providerInfo.name}`,
          }
        }

        if (response.status === 401) {
          return {
            success: false,
            error: "Invalid API key. Please check your API key.",
          }
        }

        const healthResponse = await fetch(getChatCompletionUrl(provider, url), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { Authorization: "Bearer " + apiKey } : {}),
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 1,
          }),
        })

        if (healthResponse.ok || healthResponse.status === 400 || healthResponse.status === 422) {
          return {
            success: true,
            models: 0,
            message: `${providerInfo.name} is running but no model info available`,
          }
        }

        return { success: false, error: "Server returned " + response.status }
      }

      case "openrouter": {
        const headers = getHeaders(provider, apiKey)
        const response = await fetch("https://openrouter.ai/api/v1/models", {
          method: "GET",
          signal: controller.signal,
          headers: { ...headers, Accept: "application/json" },
        })
        clearTimeout(timeoutId)
        if (response.ok) {
          const data = await response.json()
          return { success: true, models: data?.data?.length || 0, message: "Connected to OpenRouter" }
        }
        if (response.status === 401) return { success: false, error: "Invalid API key." }
        return { success: false, error: "OpenRouter returned " + response.status }
      }

      case "custom": {
        const headers: Record<string, string> = { Accept: "application/json" }
        if (apiKey) headers["Authorization"] = "Bearer " + apiKey

        const response = await fetch(getModelsUrl(provider, url)!, {
          method: "GET",
          signal: controller.signal,
          headers,
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          return {
            success: true,
            models: data?.data?.length || 0,
            message: `Connected to ${providerInfo.name}`,
          }
        }

        if (response.status === 401) {
          return {
            success: false,
            error: "Invalid API key. Please check your API key.",
          }
        }

        const healthResponse = await fetch(getChatCompletionUrl(provider, url), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { Authorization: "Bearer " + apiKey } : {}),
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 1,
          }),
        })

        if (healthResponse.ok || healthResponse.status === 400 || healthResponse.status === 422) {
          return {
            success: true,
            models: 0,
            message: `${providerInfo.name} is running but no model info available`,
          }
        }

        return { success: false, error: "Server returned " + response.status }
      }
    }

    return { success: false, error: "Unhandled provider" }
  } catch (fetchError) {
    clearTimeout(timeoutId)

    if ((fetchError as Error).name === "AbortError") {
      return { success: false, error: "Connection timed out" }
    }

    const providerName = providerInfo.name
    return { success: false, error: `Cannot reach ${providerName}. Is the server running?` }
  }
}
