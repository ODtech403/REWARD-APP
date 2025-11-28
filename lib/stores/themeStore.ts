'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark', // Default to dark mode
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
    }),
    {
      name: 'theme-storage',
    }
  )
)

// Theme utility classes
export const themeClasses = {
  dark: {
    bg: 'bg-[#0a0a0a]',
    card: 'bg-[#1a1a1a] border-white/10',
    text: 'text-white',
    textSecondary: 'text-gray-400',
    textMuted: 'text-gray-500',
    border: 'border-white/10',
    hover: 'hover:bg-white/5',
    input: 'bg-[#0a0a0a] border-white/10 text-white placeholder-gray-500',
    iconBg: (color: string) => `bg-${color}-500/10`,
    iconText: (color: string) => `text-${color}-400`,
  },
  light: {
    bg: 'bg-gray-100',
    card: 'bg-white border-gray-200',
    text: 'text-gray-800',
    textSecondary: 'text-gray-600',
    textMuted: 'text-gray-500',
    border: 'border-gray-200',
    hover: 'hover:bg-gray-50',
    input: 'bg-white border-gray-200 text-gray-800 placeholder-gray-400',
    iconBg: (color: string) => `bg-${color}-50`,
    iconText: (color: string) => `text-${color}-600`,
  },
}

// Hook to get current theme classes
export function useThemeClasses() {
  const { theme } = useThemeStore()
  return themeClasses[theme]
}
