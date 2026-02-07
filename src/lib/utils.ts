import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function splitIntoChunks(text: string, maxChunkSize: number = 2000): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > maxChunkSize) {
          if (currentChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
          }
          
          // If the sentence itself is longer than maxChunkSize, hard split it
          if (sentence.length > maxChunkSize) {
             let remaining = sentence;
             while (remaining.length > maxChunkSize) {
               chunks.push(remaining.substring(0, maxChunkSize));
               remaining = remaining.substring(maxChunkSize);
             }
             currentChunk = remaining;
          } else {
             currentChunk = sentence;
          }
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
      }
    } else if (currentChunk.length + paragraph.length + 2 > maxChunkSize) {
      chunks.push(currentChunk.trim());
      // Check if paragraph needs hard split
      if (paragraph.length > maxChunkSize) {
          let remaining = paragraph;
          while (remaining.length > maxChunkSize) {
               chunks.push(remaining.substring(0, maxChunkSize));
               remaining = remaining.substring(maxChunkSize);
          }
          currentChunk = remaining;
      } else {
          currentChunk = paragraph;
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export function cleanTranslation(text: string): string {
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
    /^Here is the translation:?\s*/i // Specific fix for the failing test case
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
