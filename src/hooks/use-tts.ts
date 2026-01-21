"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface Voice {
  voice: SpeechSynthesisVoice
  lang: string
  name: string
}

interface UseTTSReturn {
  speak: (text: string, language: string) => void
  stop: () => void
  pause: () => void
  resume: () => void
  isSpeaking: boolean
  isPaused: boolean
  isSupported: boolean
  voices: Voice[]
  currentVoice: Voice | null
  setVoice: (voice: Voice) => void
  rate: number
  setRate: (rate: number) => void
  pitch: number
  setPitch: (pitch: number) => void
}

// Language code mapping
const languageMap: Record<string, string[]> = {
  "English": ["en-US", "en-GB", "en-AU", "en"],
  "Turkish": ["tr-TR", "tr"],
  "Spanish": ["es-ES", "es-MX", "es"],
  "French": ["fr-FR", "fr-CA", "fr"],
  "German": ["de-DE", "de"],
  "Italian": ["it-IT", "it"],
  "Portuguese": ["pt-BR", "pt-PT", "pt"],
  "Russian": ["ru-RU", "ru"],
  "Japanese": ["ja-JP", "ja"],
  "Chinese": ["zh-CN", "zh-TW", "zh"],
  "Korean": ["ko-KR", "ko"],
  "Arabic": ["ar-SA", "ar"],
  "Auto Detect": ["en-US"],
}

export function useTTS(): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [voices, setVoices] = useState<Voice[]>([])
  const [currentVoice, setCurrentVoice] = useState<Voice | null>(null)
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window

  // Load voices
  useEffect(() => {
    if (!isSupported) return

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices()
      const mappedVoices: Voice[] = availableVoices.map(voice => ({
        voice,
        lang: voice.lang,
        name: voice.name
      }))
      setVoices(mappedVoices)
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [isSupported])

  // Find best voice for language
  const findBestVoice = useCallback((language: string): SpeechSynthesisVoice | null => {
    if (!isSupported || voices.length === 0) return null

    const langCodes = languageMap[language] || ["en-US"]
    
    // Priority: exact match > starts with > any match
    for (const code of langCodes) {
      // Exact match
      const exactMatch = voices.find(v => v.lang === code)
      if (exactMatch) return exactMatch.voice

      // Starts with
      const startsWithMatch = voices.find(v => v.lang.startsWith(code.split("-")[0]))
      if (startsWithMatch) return startsWithMatch.voice
    }

    // Fallback to first English voice or any voice
    return voices.find(v => v.lang.startsWith("en"))?.voice || voices[0]?.voice || null
  }, [voices, isSupported])

  const speak = useCallback((text: string, language: string) => {
    if (!isSupported || !text.trim()) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utteranceRef.current = utterance

    // Set voice
    const voice = currentVoice?.voice || findBestVoice(language)
    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang
    } else {
      // Fallback language setting
      const langCodes = languageMap[language] || ["en-US"]
      utterance.lang = langCodes[0]
    }

    // Set rate and pitch
    utterance.rate = rate
    utterance.pitch = pitch

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true)
      setIsPaused(false)
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      setIsPaused(false)
    }

    utterance.onerror = (event) => {
      console.error("TTS Error:", event.error)
      setIsSpeaking(false)
      setIsPaused(false)
    }

    utterance.onpause = () => {
      setIsPaused(true)
    }

    utterance.onresume = () => {
      setIsPaused(false)
    }

    // Speak
    window.speechSynthesis.speak(utterance)
  }, [isSupported, currentVoice, findBestVoice, rate, pitch])

  const stop = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    setIsPaused(false)
  }, [isSupported])

  const pause = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.pause()
    setIsPaused(true)
  }, [isSupported])

  const resume = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.resume()
    setIsPaused(false)
  }, [isSupported])

  const setVoice = useCallback((voice: Voice) => {
    setCurrentVoice(voice)
  }, [])

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
    voices,
    currentVoice,
    setVoice,
    rate,
    setRate,
    pitch,
    setPitch
  }
}
