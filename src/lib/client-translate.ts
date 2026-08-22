import {
  type ProviderType,
  PROVIDERS,
  getHeaders,
  buildRequestBody,
  extractTranslation,
  getChatCompletionUrl,
  getGeminiUrl,
} from "@/lib/providers"
import { cleanTranslation } from "@/lib/utils"

function resolveFetchUrl(
  provider: ProviderType,
  baseUrl: string,
  modelName: string,
  apiKey: string | undefined
): string {
  if (provider === "gemini") {
    return getGeminiUrl(baseUrl, modelName, apiKey || "")
  }
  return getChatCompletionUrl(provider, baseUrl)
}

export interface TranslateChunkResult {
  translation: string
}

async function translateChunk(
  text: string,
  targetLanguage: string,
  tone: string | undefined,
  sourceLanguage: string | undefined,
  provider: ProviderType,
  apiKey: string | undefined,
  modelName: string,
  temperature: number,
  baseUrl: string,
  signal?: AbortSignal,
  chunkIndex?: number,
  totalChunks?: number
): Promise<TranslateChunkResult> {
  let toneInstruction = ""
  if (tone) {
    switch (tone) {
      case "formal":
        toneInstruction = "Use formal, professional language appropriate for business or official documents. Avoid contractions and colloquialisms."
        break
      case "casual":
        toneInstruction = "Use casual, friendly language as if speaking to a friend. Contractions and colloquialisms are acceptable."
        break
      case "technical":
        toneInstruction = "Use precise technical terminology. Maintain accuracy of technical terms and jargon."
        break
      case "concise":
        toneInstruction = "Be concise and direct. Simplify complex sentences while preserving meaning."
        break
      default:
        toneInstruction = ""
    }
  }

  const sourceContext = sourceLanguage && sourceLanguage !== "Auto Detect"
    ? `The source text is in ${sourceLanguage}. `
    : ""

  const chunkContext = totalChunks && totalChunks > 1
    ? `This is part ${chunkIndex! + 1} of ${totalChunks} of a longer text. Maintain consistency with other parts.`
    : ""

  const systemPrompt = `You are an expert translator. Your absolute priority is to translate the given text into ${targetLanguage.toUpperCase()}.

RULES:
1. Output ONLY the translated text in ${targetLanguage}. No explanations, no notes, no commentary.
2. Preserve all original formatting (paragraphs, line breaks, punctuation).
3. Maintain the exact meaning and intent.
4. Use natural, fluent ${targetLanguage} as spoken by a native.
5. Do NOT include any meta-talk like "Here is the translation".
6. Do NOT use markdown code blocks or quotes around the output.
${toneInstruction ? `7. ${toneInstruction}` : ""}
${sourceContext}
${chunkContext}

TARGET LANGUAGE: ${targetLanguage.toUpperCase()}

Translate the following text now:`

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: text },
  ]

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120000)

  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true })
  }

  try {
    if (provider === "gemini" && !apiKey) {
      throw new Error("Gemini requires an API key.")
    }
    const fetchUrl = resolveFetchUrl(provider, baseUrl, modelName, apiKey)

    const headers = getHeaders(provider, apiKey)
    const body = buildRequestBody(provider, modelName, messages, temperature)

    const response = await fetch(fetchUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      const providerName = PROVIDERS[provider]?.name || provider
      throw new Error(providerName + " Error: " + response.status + " - " + errorText)
    }

    const data = await response.json()

    let translation = extractTranslation(provider, data)

    if (!translation) {
      throw new Error("No translation returned.")
    }

    translation = cleanTranslation(translation)

    if (!translation) {
      throw new Error("Empty translation returned.")
    }

    return { translation }
  } finally {
    clearTimeout(timeoutId)
  }
}

export interface TranslateParams {
  text: string
  targetLanguage: string
  tone?: string
  sourceLanguage?: string
  model?: string
  temperature?: number
  provider?: ProviderType
  apiKey?: string
  apiUrl?: string
  preserveFormatting?: boolean
  signal?: AbortSignal
  onProgress?: (current: number, total: number) => void
}

export interface TranslateResult {
  translation: string
  model: string
  sourceDetected: string
  chunks?: number
}

export async function clientTranslate(params: TranslateParams): Promise<TranslateResult> {
  const { text, targetLanguage, tone, sourceLanguage, model, temperature, provider: providerParam, apiKey, apiUrl, preserveFormatting, signal, onProgress } = params

  if (!text || !targetLanguage) {
    throw new Error("Text and target language are required.")
  }

  if (!text.trim()) {
    return {
      translation: text,
      model: "skipped-whitespace",
      sourceDetected: "auto",
    }
  }

  const provider: ProviderType = providerParam || "lmstudio"
  const providerInfo = PROVIDERS[provider]

  if (!providerInfo) {
    throw new Error("Unknown provider: " + provider)
  }

  if (providerInfo.requiresApiKey && !apiKey) {
    throw new Error(providerInfo.name + " requires an API key. Please add it in Settings.")
  }

  const MODEL_NAME = model || providerInfo.defaultModel

  if (!MODEL_NAME) {
    throw new Error("No model selected. Please select a model in Settings.")
  }

  const TEMPERATURE = temperature !== undefined ? temperature : 0.2

  const baseUrl = (typeof apiUrl === "string" && apiUrl.trim()) ? apiUrl.trim() : providerInfo.defaultUrl

  const { splitIntoChunks } = await import("@/lib/utils")
  const chunks = splitIntoChunks(text, 2000, preserveFormatting === true)
  const isLongText = chunks.length > 1

  const maxRetries = 2

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (isLongText) {
        const translatedChunks: string[] = []

        for (let i = 0; i < chunks.length; i++) {
          if (signal?.aborted) throw new DOMException("Aborted", "AbortError")

          const result = await translateChunk(
            chunks[i],
            targetLanguage,
            tone,
            sourceLanguage,
            provider,
            apiKey,
            MODEL_NAME,
            TEMPERATURE,
            baseUrl,
            signal,
            i,
            chunks.length
          )
          translatedChunks.push(result.translation)
          onProgress?.(i + 1, chunks.length)
        }

        return {
          translation: translatedChunks.join("\n\n"),
          model: MODEL_NAME,
          sourceDetected: sourceLanguage === "Auto Detect" ? "auto" : sourceLanguage || "auto",
          chunks: chunks.length,
        }
      } else {
        const result = await translateChunk(
          text,
          targetLanguage,
          tone,
          sourceLanguage,
          provider,
          apiKey,
          MODEL_NAME,
          TEMPERATURE,
          baseUrl,
          signal
        )
        onProgress?.(1, 1)

        return {
          translation: result.translation,
          model: MODEL_NAME,
          sourceDetected: sourceLanguage === "Auto Detect" ? "auto" : sourceLanguage || "auto",
        }
      }
    } catch (fetchError) {
      if ((fetchError as Error).name === "AbortError") {
        throw new Error("Translation request timed out. Please try again with shorter text.")
      }

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
        continue
      }
    }
  }

  const providerName = PROVIDERS[provider]?.name || provider
  throw new Error("Failed to connect to " + providerName + ". Make sure it is running and accessible.")
}
