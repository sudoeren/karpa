// Provider types and configurations for multi-LLM support

import { stripTrailingSlash } from '@/lib/url-validation'

export type ProviderType = 
  | 'lmstudio' 
  | 'ollama' 
  | 'openai' 
  | 'anthropic' 
  | 'gemini' 
  | 'openrouter'
  | 'custom'

export interface ProviderConfig {
  provider: ProviderType
  apiUrl: string
  apiKey?: string
  model: string
  temperature: number
}

export interface ProviderInfo {
  id: ProviderType
  name: string
  description: string
  defaultUrl: string
  requiresApiKey: boolean
  defaultModel: string
  modelsEndpoint: string | null // null means models must be entered manually
  placeholder: string
}

export const PROVIDERS: Record<ProviderType, ProviderInfo> = {
  lmstudio: {
    id: 'lmstudio',
    name: 'LM Studio',
    description: 'Local LLM server with OpenAI-compatible API',
    defaultUrl: 'http://localhost:1234',
    requiresApiKey: false,
    defaultModel: '',
    modelsEndpoint: '/v1/models',
    placeholder: 'http://localhost:1234',
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama',
    description: 'Run LLMs locally with Ollama',
    defaultUrl: 'http://localhost:11434',
    requiresApiKey: false,
    defaultModel: '',
    modelsEndpoint: '/api/tags',
    placeholder: 'http://localhost:11434',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o, GPT-4o-mini and other OpenAI models',
    defaultUrl: 'https://api.openai.com',
    requiresApiKey: true,
    defaultModel: 'gpt-4o-mini',
    modelsEndpoint: '/v1/models',
    placeholder: 'https://api.openai.com',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 3.5 Sonnet, Claude 3 Haiku and more',
    defaultUrl: 'https://api.anthropic.com',
    requiresApiKey: true,
    defaultModel: 'claude-sonnet-4-20250514',
    modelsEndpoint: null,
    placeholder: 'https://api.anthropic.com',
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini Pro, Gemini Flash and other Google models',
    defaultUrl: 'https://generativelanguage.googleapis.com',
    requiresApiKey: true,
    defaultModel: 'gemini-2.0-flash',
    modelsEndpoint: null,
    placeholder: 'https://generativelanguage.googleapis.com',
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Unified API for 200+ models via OpenRouter',
    defaultUrl: 'https://openrouter.ai/api',
    requiresApiKey: true,
    defaultModel: 'amazon/nova-2-lite-v1',
    modelsEndpoint: '/v1/models',
    placeholder: 'https://openrouter.ai/api',
  },
  custom: {
    id: 'custom',
    name: 'Custom (OpenAI Compatible)',
    description: 'Any OpenAI-compatible API endpoint',
    defaultUrl: '',
    requiresApiKey: false,
    defaultModel: '',
    modelsEndpoint: '/v1/models',
    placeholder: 'http://your-server:port',
  },
}

// Well-known models for providers that don't have a models endpoint
export const KNOWN_MODELS: Partial<Record<ProviderType, string[]>> = {
  anthropic: [
    'claude-sonnet-4-20250514',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229',
    'claude-3-haiku-20240307',
  ],
  gemini: [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
  ],
  openai: [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo',
  ],
}

// Helper to get default config for a provider
export function getDefaultConfig(provider: ProviderType): ProviderConfig {
  const info = PROVIDERS[provider]
  return {
    provider,
    apiUrl: info.defaultUrl,
    apiKey: undefined,
    model: info.defaultModel,
    temperature: 0.2,
  }
}

// Build chat completion URL for a provider
export function getChatCompletionUrl(provider: ProviderType, baseUrl: string): string {
  let url = stripTrailingSlash(baseUrl)

  switch (provider) {
    case 'lmstudio':
    case 'openai':
    case 'openrouter':
    case 'custom':
      if (!url.endsWith('/v1/chat/completions')) {
        if (url.endsWith('/v1')) url += '/chat/completions'
        else url += '/v1/chat/completions'
      }
      return url

    case 'ollama':
      // Ollama supports OpenAI-compatible endpoint
      if (!url.endsWith('/v1/chat/completions')) {
        if (url.endsWith('/v1')) url += '/chat/completions'
        else url += '/v1/chat/completions'
      }
      return url

    case 'anthropic':
      if (!url.endsWith('/v1/messages')) {
        url += '/v1/messages'
      }
      return url

    case 'gemini':
      // Gemini uses a different URL pattern
      return url

    default:
      return url + '/v1/chat/completions'
  }
}

// Build headers for a provider
export function getHeaders(provider: ProviderType, apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  switch (provider) {
    case 'openai':
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
      break
    case 'anthropic':
      if (apiKey) {
        headers['x-api-key'] = apiKey
        headers['anthropic-version'] = '2023-06-01'
      }
      break
    case 'gemini':
      // API key goes in x-goog-api-key header (keeps it out of the URL)
      if (apiKey) headers['x-goog-api-key'] = apiKey
      break
    case 'openrouter':
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`
        headers['HTTP-Referer'] = 'https://karpa.erenustaoglu.com'
        headers['X-Title'] = 'Karpa'
      }
      break
    case 'custom':
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
      break
    // lmstudio and ollama don't need auth headers
  }

  return headers
}

// Build request body for a provider
export function buildRequestBody(
  provider: ProviderType,
  model: string,
  messages: { role: string; content: string }[],
  temperature: number
): object {
  switch (provider) {
    case 'anthropic': {
      // Anthropic uses a different message format
      const systemMessage = messages.find(m => m.role === 'system')
      const userMessages = messages.filter(m => m.role !== 'system')
      return {
        model,
        max_tokens: 4096,
        system: systemMessage?.content || '',
        messages: userMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature,
      }
    }

    case 'gemini': {
      // Gemini uses a different format
      const systemMsg = messages.find(m => m.role === 'system')
      const userMsgs = messages.filter(m => m.role !== 'system')
      return {
        contents: userMsgs.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        })),
        systemInstruction: systemMsg ? {
          parts: [{ text: systemMsg.content }],
        } : undefined,
        generationConfig: {
          temperature,
          maxOutputTokens: 4096,
        },
      }
    }

    default:
      // OpenAI-compatible format (LM Studio, Ollama, OpenAI, Custom)
      return {
        model,
        messages,
        temperature,
        max_tokens: 4096,
        stream: false,
        stop: ["Note:", "Please note", "\n\nI've", "\n\nLet me know"],
      }
  }
}

// Build the full URL for Gemini API calls
export function getGeminiUrl(baseUrl: string, model: string, apiKey: string): string {
  const url = stripTrailingSlash(baseUrl)
  return `${url}/v1beta/models/${model}:generateContent?key=${apiKey}`
}

// Extract translation text from provider response
export function extractTranslation(provider: ProviderType, data: any): string | null {
  switch (provider) {
    case 'anthropic':
      return data?.content?.[0]?.text?.trim() || null

    case 'gemini':
      return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null

    default:
      // OpenAI-compatible format
      return data?.choices?.[0]?.message?.content?.trim() || null
  }
}

// Get models list URL for a provider
export function getModelsUrl(provider: ProviderType, baseUrl: string): string | null {
  const url = stripTrailingSlash(baseUrl)
  const info = PROVIDERS[provider]

  if (!info.modelsEndpoint) return null

  switch (provider) {
    case 'ollama':
      return `${url}/api/tags`
    default:
      return `${url}${info.modelsEndpoint}`
  }
}

// Parse models response for a provider
export function parseModelsResponse(provider: ProviderType, data: any): { id: string; object: string }[] {
  switch (provider) {
    case 'ollama':
      return (data?.models || []).map((m: any) => ({
        id: m.name || m.model,
        object: 'model',
      }))
    default:
      // OpenAI-compatible format
      return (data?.data || []).map((m: any) => ({
        id: m.id,
        object: m.object || 'model',
      }))
  }
}
