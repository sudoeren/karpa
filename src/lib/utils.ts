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
               if (match && match.index) splitIndex = match.index;
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
