'use client'

import { useEffect } from 'react'
import { useLanguageStore, type LanguageCode } from '@/lib/stores/languageStore'

export function LanguageDetector() {
  const { isDetected, setLanguage, setDetected } = useLanguageStore()

  useEffect(() => {
    // Only detect once if not already detected
    if (isDetected) return

    async function detectLanguage() {
      try {
        // First try browser language
        const browserLang = navigator.language.split('-')[0] as LanguageCode
        const supportedLangs: LanguageCode[] = ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ar', 'hi', 'ru', 'ja']
        
        if (supportedLangs.includes(browserLang)) {
          setLanguage(browserLang)
          setDetected(true)
          return
        }

        // Then try IP-based detection
        const response = await fetch('/api/detect-language')
        if (response.ok) {
          const data = await response.json()
          if (data.detected && supportedLangs.includes(data.language)) {
            setLanguage(data.language)
          }
        }
        setDetected(true)
      } catch (error) {
        console.log('Language detection failed:', error)
        setDetected(true)
      }
    }

    detectLanguage()
  }, [isDetected, setLanguage, setDetected])

  return null
}
