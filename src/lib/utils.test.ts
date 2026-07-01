import { describe, it, expect } from 'vitest';
import { cleanTranslation, splitIntoChunks } from './utils';

describe('cleanTranslation', () => {
  it('should remove common LLM prefixes', () => {
    const inputs = [
      "Here is the translation: Hello world",
      "Translation: Hello world",
      "Sure, here is the translation: Hello world",
      "Certainly! Hello world"
    ];
    inputs.forEach(input => {
      expect(cleanTranslation(input)).toBe("Hello world");
    });
  });

  it('should remove common LLM suffixes', () => {
    const input = "Hello world\n\nNote: This is a translation.";
    expect(cleanTranslation(input)).toBe("Hello world");
  });

  it('should remove markdown code blocks', () => {
    const input = "```\nHello world\n```";
    expect(cleanTranslation(input)).toBe("Hello world");
  });

  it('should remove surrounding quotes', () => {
    expect(cleanTranslation('"Hello world"')).toBe("Hello world");
    expect(cleanTranslation("'Hello world'")).toBe("Hello world");
  });

  it('should return original text if no cleaning needed', () => {
    expect(cleanTranslation("Hello world")).toBe("Hello world");
  });

  it('should strip Turkish and Spanish prefixes', () => {
    expect(cleanTranslation("İşte çeviri: Merhaba dünya")).toBe("Merhaba dünya");
    expect(cleanTranslation("Aquí está la traducción: Hola mundo")).toBe("Hola mundo");
  });

  it('should strip French and German prefixes', () => {
    expect(cleanTranslation("Voici la traduction: Bonjour le monde")).toBe("Bonjour le monde");
    expect(cleanTranslation("Hier ist die Übersetzung: Hallo Welt")).toBe("Hallo Welt");
  });
});

describe('splitIntoChunks', () => {
  it('should not split text smaller than maxChunkSize', () => {
    const text = "Short text";
    expect(splitIntoChunks(text, 100)).toEqual(["Short text"]);
  });

  it('should split long text into chunks', () => {
    const longText = "a".repeat(150);
    const chunks = splitIntoChunks(longText, 100);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].length).toBeLessThanOrEqual(100);
  });
  
  it('should try to split at newlines', () => {
      const part1 = "a".repeat(40);
      const part2 = "b".repeat(40);
      const text = part1 + "\n\n" + part2;
      // Max chunk size 50, so it should split at \n\n
      const chunks = splitIntoChunks(text, 50);
      expect(chunks).toEqual([part1, part2]);
  });

  it('should preserve single newlines when preserveFormatting=true', () => {
    const line1 = "a".repeat(30);
    const line2 = "b".repeat(30);
    const line3 = "c".repeat(30);
    const text = line1 + "\n" + line2 + "\n" + line3;
    // Max chunk size forces a split between line2 and line3; the \n must
    // still be present at the boundary so the joined output matches the input.
    const chunks = splitIntoChunks(text, 70, true);
    expect(chunks.join("")).toBe(text);
  });
});