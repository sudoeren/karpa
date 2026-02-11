import { NextResponse } from 'next/server';
import { splitIntoChunks, cleanTranslation } from '@/lib/utils';
import {
  type ProviderType,
  PROVIDERS,
  getChatCompletionUrl,
  getHeaders,
  buildRequestBody,
  getGeminiUrl,
  extractTranslation,
} from '@/lib/providers';

// Translate a single chunk
async function translateChunk(
  text: string,
  targetLanguage: string,
  tone: string | undefined,
  sourceLanguage: string | undefined,
  provider: ProviderType,
  apiUrl: string,
  apiKey: string | undefined,
  modelName: string,
  temperature: number,
  chunkIndex?: number,
  totalChunks?: number
): Promise<string> {
  // Build tone instruction
  let toneInstruction = "";
  if (tone) {
    switch (tone) {
      case "formal":
        toneInstruction = "Use formal, professional language appropriate for business or official documents. Avoid contractions and colloquialisms.";
        break;
      case "casual":
        toneInstruction = "Use casual, friendly language as if speaking to a friend. Contractions and colloquialisms are acceptable.";
        break;
      case "technical":
        toneInstruction = "Use precise technical terminology. Maintain accuracy of technical terms and jargon.";
        break;
      case "concise":
        toneInstruction = "Be concise and direct. Simplify complex sentences while preserving meaning.";
        break;
      default:
        toneInstruction = "";
    }
  }

  // Build source language context
  const sourceContext = sourceLanguage && sourceLanguage !== "Auto Detect" 
    ? `The source text is in ${sourceLanguage}. ` 
    : "";

  // Chunk context for multi-part translations
  const chunkContext = totalChunks && totalChunks > 1 
    ? `This is part ${chunkIndex! + 1} of ${totalChunks} of a longer text. Maintain consistency with other parts.` 
    : "";

  // Improved system prompt for better translation quality
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

Translate the following text now:`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: text }
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for long texts

  try {
    // Build URL based on provider
    let fetchUrl: string;
    if (provider === 'gemini') {
      if (!apiKey) throw new Error('Gemini requires an API key.');
      fetchUrl = getGeminiUrl(apiUrl, modelName, apiKey);
    } else {
      fetchUrl = getChatCompletionUrl(provider, apiUrl);
    }

    const headers = getHeaders(provider, apiKey);
    const body = buildRequestBody(provider, modelName, messages, temperature);

    const response = await fetch(fetchUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      const providerName = PROVIDERS[provider]?.name || provider;
      throw new Error(`${providerName} Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    let translation = extractTranslation(provider, data);
    
    if (!translation) {
      throw new Error("No translation returned.");
    }

    translation = cleanTranslation(translation);
    
    if (!translation) {
      throw new Error("Empty translation returned.");
    }

    return translation;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(req: Request) {
  try {
    const { text, targetLanguage, tone, sourceLanguage, model, apiUrl, temperature, provider: providerParam, apiKey } = await req.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Text and target language are required.' },
        { status: 400 }
      );
    }

    // If text is only whitespace, return it as is (preserves formatting)
    if (!text.trim()) {
      return NextResponse.json({ 
        translation: text,
        model: 'skipped-whitespace',
        sourceDetected: 'auto'
      });
    }

    // Determine provider
    const provider: ProviderType = providerParam || process.env.LLM_PROVIDER as ProviderType || 'lmstudio';
    const providerInfo = PROVIDERS[provider];

    if (!providerInfo) {
      return NextResponse.json(
        { error: `Unknown provider: ${provider}` },
        { status: 400 }
      );
    }

    // Determine URL
    let API_URL = apiUrl || process.env.LLM_API_URL || process.env.LM_STUDIO_URL || providerInfo.defaultUrl;
    if (API_URL.endsWith('/')) API_URL = API_URL.slice(0, -1);

    // Determine API key
    const API_KEY = apiKey || process.env.LLM_API_KEY || undefined;

    // Validate API key requirement
    if (providerInfo.requiresApiKey && !API_KEY) {
      return NextResponse.json(
        { error: `${providerInfo.name} requires an API key. Please add it in Settings.` },
        { status: 401 }
      );
    }

    const MODEL_NAME = model || process.env.LLM_MODEL || process.env.LM_STUDIO_MODEL || providerInfo.defaultModel;
    
    if (!MODEL_NAME) {
      return NextResponse.json(
        { error: 'No model selected. Please select a model in Settings.' },
        { status: 400 }
      );
    }

    const TEMPERATURE = temperature !== undefined ? parseFloat(temperature) : parseFloat(process.env.LLM_TEMPERATURE || process.env.LM_STUDIO_TEMPERATURE || '0.2');

    // Split text into chunks for long translations
    const chunks = splitIntoChunks(text, 2000);
    const isLongText = chunks.length > 1;

    // Retry logic for robustness
    let lastError: Error | null = null;
    const maxRetries = 2;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (isLongText) {
          // Translate chunks sequentially for consistency
          const translatedChunks: string[] = [];
          
          for (let i = 0; i < chunks.length; i++) {
            const translatedChunk = await translateChunk(
              chunks[i],
              targetLanguage,
              tone,
              sourceLanguage,
              provider,
              API_URL,
              API_KEY,
              MODEL_NAME,
              TEMPERATURE,
              i,
              chunks.length
            );
            translatedChunks.push(translatedChunk);
          }

          // Join chunks with appropriate separators
          const translation = translatedChunks.join('\n\n');

          return NextResponse.json({ 
            translation,
            model: MODEL_NAME,
            sourceDetected: sourceLanguage === "Auto Detect" ? "auto" : sourceLanguage,
            chunks: chunks.length
          });
        } else {
          // Single chunk translation
          const translation = await translateChunk(
            text,
            targetLanguage,
            tone,
            sourceLanguage,
            provider,
            API_URL,
            API_KEY,
            MODEL_NAME,
            TEMPERATURE
          );

          return NextResponse.json({ 
            translation,
            model: MODEL_NAME,
            sourceDetected: sourceLanguage === "Auto Detect" ? "auto" : sourceLanguage
          });
        }
        
      } catch (fetchError) {
        lastError = fetchError as Error;
        console.error(`Translation fetch error (attempt ${attempt + 1}):`, fetchError);
        
        if ((fetchError as Error).name === 'AbortError') {
          return NextResponse.json(
            { error: 'Translation request timed out. Please try again with shorter text.' },
            { status: 504 }
          );
        }
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
      }
    }

    // If we get here, all retries failed
    const providerName = PROVIDERS[provider]?.name || provider;
    console.error('All translation attempts failed:', lastError);
    return NextResponse.json(
      { error: `Failed to connect to ${providerName}. Make sure it is running and accessible.` },
      { status: 503 }
    );

  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
