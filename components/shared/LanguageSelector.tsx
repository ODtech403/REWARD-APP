'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Check, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import { 
  useLanguageStore, 
  SUPPORTED_LANGUAGES, 
  type LanguageCode 
} from '@/lib/stores/languageStore'

interface LanguageSelectorProps {
  isDark?: boolean
  variant?: 'menu' | 'dropdown'
}

export function LanguageSelector({ isDark = true, variant = 'dropdown' }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguageStore()
  const [isOpen, setIsOpen] = useState(false)

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0]

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code)
    setIsOpen(false)
  }

  if (variant === 'menu') {
    return (
      <div className="space-y-2">
        <p className={clsx('text-sm font-medium px-4', isDark ? 'text-gray-400' : 'text-gray-600')}>
          Select Language
        </p>
        <div className="grid grid-cols-2 gap-2 px-4">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={clsx(
                'flex items-center gap-2 p-3 rounded-xl transition-all',
                language === lang.code
                  ? 'bg-green-500/20 border border-green-500/30'
                  : isDark 
                    ? 'bg-white/5 border border-white/10 hover:bg-white/10'
                    : 'bg-gray-100 border border-gray-200 hover:bg-gray-200'
              )}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className={clsx(
                'text-sm font-medium truncate',
                isDark ? 'text-white' : 'text-gray-900'
              )}>
                {lang.nativeName}
              </span>
              {language === lang.code && (
                <Check className="w-4 h-4 text-green-500 ml-auto" />
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-2 px-3 py-2 rounded-xl transition-all',
          isDark 
            ? 'bg-white/5 hover:bg-white/10 border border-white/10'
            : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
        )}
      >
        <Globe className={clsx('w-4 h-4', isDark ? 'text-gray-400' : 'text-gray-600')} />
        <span className="text-lg">{currentLang.flag}</span>
        <span className={clsx('text-sm font-medium', isDark ? 'text-white' : 'text-gray-900')}>
          {currentLang.code.toUpperCase()}
        </span>
        <ChevronDown className={clsx(
          'w-4 h-4 transition-transform',
          isDark ? 'text-gray-400' : 'text-gray-600',
          isOpen && 'rotate-180'
        )} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={clsx(
                'absolute right-0 mt-2 w-48 rounded-xl shadow-xl z-50 overflow-hidden',
                isDark ? 'bg-[#1a1a1a] border border-white/10' : 'bg-white border border-gray-200'
              )}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 transition-colors',
                    language === lang.code
                      ? 'bg-green-500/20'
                      : isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                  )}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className={clsx(
                    'text-sm font-medium flex-1 text-left',
                    isDark ? 'text-white' : 'text-gray-900'
                  )}>
                    {lang.nativeName}
                  </span>
                  {language === lang.code && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
