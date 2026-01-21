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

export async function POST(req: Request) {
  try {
    const { text, targetLanguage, tone, sourceLanguage } = await req.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Text and target language are required.' },
        { status: 400 }
      );
    }

    const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://localhost:1234/v1/chat/completions';
    const MODEL_NAME = process.env.LM_STUDIO_MODEL || 'hy-mt1.5-7b/HY-MT1.5-7B-Q4_K_M.gguf';
    const TEMPERATURE = parseFloat(process.env.LM_STUDIO_TEMPERATURE || '0.2');

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
Translate the following text:`;

    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: text
      }
    ];

    // Retry logic for robustness
    let lastError: Error | null = null;
    const maxRetries = 2;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
        
        const response = await fetch(LM_STUDIO_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: MODEL_NAME,
            messages: messages,
            temperature: TEMPERATURE,
            max_tokens: 4096,
            stream: false,
            stop: ["Note:", "Please note", "\n\nI've", "\n\nLet me know"]
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`LM Studio Error (attempt ${attempt + 1}):`, errorText);
          
          if (response.status === 503 || response.status === 429) {
            // Service unavailable or rate limited - retry after delay
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
              continue;
            }
          }
          
          return NextResponse.json(
            { error: `LM Studio Error: ${response.status}` }, 
            { status: response.status }
          );
        }

        const data = await response.json();
        
        if (!data.choices || data.choices.length === 0) {
          if (attempt < maxRetries) {
            continue;
          }
          return NextResponse.json({ error: "No translation returned." }, { status: 500 });
        }

        let translation = data.choices[0]?.message?.content?.trim();
        
        // Clean up the translation output
        translation = cleanTranslation(translation);
        
        if (!translation) {
          if (attempt < maxRetries) {
            continue;
          }
          return NextResponse.json({ error: "Empty translation returned." }, { status: 500 });
        }

        return NextResponse.json({ 
          translation,
          model: MODEL_NAME,
          sourceDetected: sourceLanguage === "Auto Detect" ? "auto" : sourceLanguage
        });
        
      } catch (fetchError: any) {
        lastError = fetchError;
        console.error(`Translation fetch error (attempt ${attempt + 1}):`, fetchError);
        
        if (fetchError.name === 'AbortError') {
          return NextResponse.json(
            { error: 'Translation request timed out. Please try again.' },
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

  } catch (error: any) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}