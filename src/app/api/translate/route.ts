import { NextResponse } from 'next/server';

// Post-process LLM output to clean up common issues
function cleanTranslation(text: string): string {
  if (!text) return text;
  
  let cleaned = text;
  
  // Remove common prefixes that LLMs add
  const prefixPatterns = [
    /^(Here'?s?\s+(the\s+)?translation:?\s*)/i,
    /^(Translation:?\s*)/i,
    /^(Translated\s+text:?\s*)/i,
    /^(The\s+translation\s+(is|would\s+be):?\s*)/i,
    /^(In\s+\w+:?\s*)/i,
    /^(Sure[,!]?\s*(here'?s?\s+(the\s+)?translation)?:?\s*)/i,
    /^(Of\s+course[,!]?\s*)/i,
    /^(Certainly[,!]?\s*)/i,
  ];
  
  for (const pattern of prefixPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Remove common suffixes
  const suffixPatterns = [
    /(\n+Note:.*$)/i,
    /(\n+Please\s+note.*$)/i,
    /(\n+I'?ve?\s+translated.*$)/i,
    /(\n+Let\s+me\s+know.*$)/i,
    /(\n+Hope\s+this\s+helps.*$)/i,
  ];
  
  for (const pattern of suffixPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Remove markdown code blocks if present
  cleaned = cleaned.replace(/^```[\w]*\n?/gm, '').replace(/\n?```$/gm, '');
  
  // Remove quotes if the entire text is quoted
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  
  return cleaned.trim();
}

// Split text into chunks for long translations
function splitIntoChunks(text: string, maxChunkSize: number = 2000): string[] {
  // If text is short enough, return as single chunk
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  
  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    // If a single paragraph is too long, split by sentences
    if (paragraph.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // Split by sentences
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > maxChunkSize) {
          if (currentChunk) {
            chunks.push(currentChunk.trim());
          }
          currentChunk = sentence;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
      }
    } else if (currentChunk.length + paragraph.length + 2 > maxChunkSize) {
      // Start new chunk
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      // Add to current chunk
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  // Don't forget the last chunk
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Translate a single chunk
async function translateChunk(
  text: string,
  targetLanguage: string,
  tone: string | undefined,
  sourceLanguage: string | undefined,
  lmStudioUrl: string,
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
  const systemPrompt = `You are an expert translator. Your task is to translate text accurately and naturally into ${targetLanguage}.

RULES:
1. Output ONLY the translated text - no explanations, notes, or commentary
2. Preserve the original formatting (paragraphs, line breaks, punctuation)
3. Maintain the meaning and intent of the original text
4. Use natural, fluent ${targetLanguage} that a native speaker would use
5. Do not add any prefixes like "Translation:" or "Here's the translation"
6. Do not wrap the translation in quotes or code blocks
${toneInstruction ? `7. ${toneInstruction}` : ""}
${sourceContext}
${chunkContext}
Translate the following text:`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: text }
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for long texts

  try {
    const response = await fetch(lmStudioUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        messages: messages,
        temperature: temperature,
        max_tokens: 4096,
        stream: false,
        stop: ["Note:", "Please note", "\n\nI've", "\n\nLet me know"]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LM Studio Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error("No translation returned.");
    }

    let translation = data.choices[0]?.message?.content?.trim();
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
    const { text, targetLanguage, tone, sourceLanguage, model, apiUrl, temperature } = await req.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Text and target language are required.' },
        { status: 400 }
      );
    }

    // Determine URL: remove trailing slash if present, add /v1/chat/completions if missing
    let LM_STUDIO_URL = apiUrl || process.env.LM_STUDIO_URL || 'http://localhost:1234';
    if (LM_STUDIO_URL.endsWith('/')) LM_STUDIO_URL = LM_STUDIO_URL.slice(0, -1);
    if (!LM_STUDIO_URL.endsWith('/v1/chat/completions')) {
        // If it ends with /v1, add /chat/completions
        if (LM_STUDIO_URL.endsWith('/v1')) LM_STUDIO_URL += '/chat/completions';
        // Otherwise assume base URL and add full path
        else LM_STUDIO_URL += '/v1/chat/completions';
    }

    const MODEL_NAME = model || process.env.LM_STUDIO_MODEL || 'hy-mt1.5-7b/HY-MT1.5-7B-Q4_K_M.gguf';
    const TEMPERATURE = temperature !== undefined ? parseFloat(temperature) : parseFloat(process.env.LM_STUDIO_TEMPERATURE || '0.2');

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
              LM_STUDIO_URL,
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
            LM_STUDIO_URL,
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
    console.error('All translation attempts failed:', lastError);
    return NextResponse.json(
      { error: 'Failed to connect to LM Studio. Make sure it is running on port 1234.' },
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
