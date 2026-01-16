import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, targetLanguage, tone } = await req.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Text and target language are required.' },
        { status: 400 }
      );
    }

    const LM_STUDIO_URL = 'http://localhost:1234/v1/chat/completions';

    // Tone instructions
    let toneInstruction = "";
    if (tone) {
        switch (tone) {
            case "formal":
                toneInstruction = "Use a formal, professional, and business-appropriate tone.";
                break;
            case "casual":
                toneInstruction = "Use a casual, friendly, and conversational tone.";
                break;
            case "technical":
                toneInstruction = "Use precise technical terminology and a direct style.";
                break;
            case "concise":
                toneInstruction = "Be concise and to the point. Simplify the text where possible.";
                break;
            default:
                toneInstruction = "";
        }
    }

    const messages = [
      {
        role: "system",
        content: `You are a professional translator. Translate the given text into ${targetLanguage}. ${toneInstruction} Do not provide any explanations, notes, or extra text. Only provide the direct translation.`
      },
      {
        role: "user",
        content: text
      }
    ];

    const response = await fetch(LM_STUDIO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "hy-mt1.5-7b/HY-MT1.5-7B-Q4_K_M.gguf",
        messages: messages,
        temperature: 0.2, 
        stream: false
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("LM Studio Error:", errorText);
        return NextResponse.json({ error: `LM Studio Error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
        return NextResponse.json({ error: "No translation returned." }, { status: 500 });
    }

    const translation = data.choices[0]?.message?.content?.trim();

    return NextResponse.json({ translation });

  } catch (error: any) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}