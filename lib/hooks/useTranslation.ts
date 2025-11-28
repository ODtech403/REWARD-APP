'use client'

import { useCallback } from 'react'
import { useLanguageStore } from '@/lib/stores/languageStore'
import { getTranslation, type TranslationKey } from '@/lib/i18n/translations'

export function useTranslation() {
  const { language } = useLanguageStore()

  const t = useCallback(
    (key: TranslationKey): string => {
      return getTranslation(language, key)
    },
    [language]
  )

  return { t, language }
}
