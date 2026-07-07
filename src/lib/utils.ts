import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function splitIntoChunks(text: string, maxChunkSize: number = 2000, preserveFormatting: boolean = false): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  const paragraphs = preserveFormatting ? text.split(/(\n)/) : text.split(/\n\n+/); // Split by newline keeping separators if preserving
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    // If preserving formatting, paragraph might be just a newline
    if (preserveFormatting && paragraph === '\n') {
       if (currentChunk.length + 1 > maxChunkSize) {
          chunks.push(currentChunk);
          currentChunk = '\n';
       } else {
          currentChunk += '\n';
       }
       continue;
    }

    if (paragraph.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(preserveFormatting ? currentChunk : currentChunk.trim());
        currentChunk = '';
      }
      
      // Hard split logic
      let remaining = paragraph;
      while (remaining.length > maxChunkSize) {
           // Find nearest space or newline to split safely if possible
           let splitIndex = maxChunkSize;
           if (!preserveFormatting) {
               // Try to find a sentence ending
               const match = remaining.substring(0, maxChunkSize).match(/(?<=[.!?])\s+$/);
               if (match && match.index !== undefined) splitIndex = match.index;
           }
           
           chunks.push(remaining.substring(0, splitIndex));
           remaining = remaining.substring(splitIndex);
      }
      currentChunk = remaining;

    } else if (currentChunk.length + paragraph.length + (preserveFormatting ? 0 : 2) > maxChunkSize) {
      chunks.push(preserveFormatting ? currentChunk : currentChunk.trim());
      currentChunk = paragraph;
    } else {
      if (preserveFormatting) {
        currentChunk += paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
  }

  if (currentChunk) {
    chunks.push(preserveFormatting ? currentChunk : currentChunk.trim());
  }

  return chunks;
}

export function decodeApiKey(key: string): string {
  try { return atob(key) } catch { return key }
}

export function cleanTranslation(text: string): string {
  if (!text) return text;

  let cleaned = text;

  // Remove common prefixes that LLMs add. The patterns are case-insensitive
  // and tolerant of optional trailing punctuation/whitespace so they catch
  // the common variants ("Here is the translation:", "İşte çeviri:", etc.).
  const prefixPatterns = [
    // English
    /^(Here(?:\s*(?:'s|is|are))?\s*(?:the\s+|a\s+)?translation:?\s*)/i,
    /^(Translation:?\s*)/i,
    /^(Translated\s+text:?\s*)/i,
    /^(The\s+translation\s+(is|would\s+be):?\s*)/i,
    /^(In\s+\w+:?\s*)/i,
    /^(Sure[,!]?\s*(here(?:\s*(?:'s|is|are))?\s*(?:the\s+|a\s+)?translation)?:?\s*)/i,
    /^(Of\s+course[,!]?\s*)/i,
    /^(Certainly[,!]?\s*)/i,
    /^(Absolutely[,!]?\s*)/i,
    // Turkish
    /^(İşte\s+çeviri[:\s]*)/i,
    /^(Çeviri[:\s]*)/i,
    /^(Çevrilmiş\s+metin[:\s]*)/i,
    /^(Tabii[,!]?\s*)/i,
    /^(Elbette[,!]?\s*)/i,
    // Spanish
    /^(Aquí\s+(está|es)\s+la\s+traducción[:\s]*)/i,
    /^(Traducción[:\s]*)/i,
    /^(Por\s+supuesto[,!]?\s*)/i,
    /^(Claro[,!]?\s*)/i,
    // French
    /^(Voici\s+la\s+traduction[:\s]*)/i,
    /^(Traduction[:\s]*)/i,
    /^(Bien\s+sûr[,!]?\s*)/i,
    /^(Certainement[,!]?\s*)/i,
    // German
    /^(Hier\s+ist\s+die\s+Übersetzung[:\s]*)/i,
    /^(Übersetzung[:\s]*)/i,
    /^(Übersetzter\s+Text[:\s]*)/i,
    /^(Natürlich[,!]?\s*)/i,
    // Italian
    /^(Ecco\s+la\s+traduzione[:\s]*)/i,
    /^(Traduzione[:\s]*)/i,
    /^(Certamente[,!]?\s*)/i,
    // Portuguese
    /^(Aqui\s+está\s+a\s+tradução[:\s]*)/i,
    /^(Tradução[:\s]*)/i,
    // Russian
    /^(Вот\s+перевод[:\s]*)/iu,
    /^(Перевод[:\s]*)/iu,
    /^(Переведённый\s+текст[:\s]*)/iu,
    // Japanese
    /^(こちらが翻訳(です|になります)?[:\s]*)/,
    /^(翻訳(です|結果)?[:\s]*)/,
    // Chinese
    /^(这是翻译(结果|如下)?[:\s]*)/,
    /^(以下是?翻译[:\s]*)/,
    /^(翻译(如下|结果)?[:\s]*)/,
    // Korean
    /^(다음은\s*번역(입니다|결과)?[:\s]*)/,
    /^(번역[:\s]*)/,
    // Arabic
    /^(ها\s*هو\s*الترجمة[:\s]*)/u,
    /^(الترجمة[:\s]*)/u,
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
    /(\n+Not[:\s].*$)/i,
    /(\n+Nota[:\s].*$)/i,
    /(\n+Notiz[:\s].*$)/i,
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
