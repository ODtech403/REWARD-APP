'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Bell,
  Moon,
  Sun,
  Globe,
  Smartphone,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useThemeStore } from '@/lib/stores/themeStore'

interface SettingToggle {
  id: string
  icon: typeof Bell
  title: string
  description: string
  enabled: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const { theme, toggleTheme } = useThemeStore()
  const isDarkMode = theme === 'dark'

  const [settings, setSettings] = useState<SettingToggle[]>([
    {
      id: 'push_notifications',
      icon: Bell,
      title: 'Push Notifications',
      description: 'Receive alerts for new tasks and rewards',
      enabled: true,
    },
    {
      id: 'email_notifications',
      icon: Globe,
      title: 'Email Notifications',
      description: 'Get updates via email',
      enabled: false,
    },
    {
      id: 'task_reminders',
      icon: Smartphone,
      title: 'Task Reminders',
      description: 'Remind me about available tasks',
      enabled: true,
    },
  ])

  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    )
  }

  // Theme-based classes
  const bgClass = isDarkMode ? 'bg-[#0a0a0a]' : 'bg-gray-100'
  const cardClass = isDarkMode
    ? 'bg-[#1a1a1a] border-white/10'
    : 'bg-white border-gray-200'
  const textClass = isDarkMode ? 'text-white' : 'text-gray-800'
  const textSecondaryClass = isDarkMode ? 'text-gray-400' : 'text-gray-600'
  const borderClass = isDarkMode ? 'border-white/10' : 'border-gray-200'
  const hoverClass = isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'
  const iconBgClass = isDarkMode ? 'bg-green-500/10' : 'bg-green-50'
  const iconTextClass = isDarkMode ? 'text-green-400' : 'text-green-600'

  return (
    <div className={`min-h-screen ${bgClass} pb-24`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-400 px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-white/80 text-sm">Manage your preferences</p>
          </div>
        </motion.div>
      </div>

      <div className="p-4 space-y-4">
        {/* Appearance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl overflow-hidden border ${cardClass}`}
        >
          <div className={`px-5 py-4 border-b ${borderClass}`}>
            <h2 className={`font-semibold ${textClass}`}>Appearance</h2>
          </div>

          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={toggleTheme}
            className={`w-full flex items-center gap-4 p-4 ${hoverClass} transition-colors`}
          >
            <div
              className={`w-10 h-10 rounded-xl ${isDarkMode ? 'bg-purple-500/10' : 'bg-purple-50'} flex items-center justify-center`}
            >
              {isDarkMode ? (
                <Moon
                  className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}
                />
              ) : (
                <Sun
                  className={`w-5 h-5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}
                />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className={`font-medium ${textClass}`}>
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </p>
              <p className={`text-sm ${textSecondaryClass}`}>
                {isDarkMode
                  ? 'Switch to light theme'
                  : 'Switch to dark theme'}
              </p>
            </div>
            {isDarkMode ? (
              <ToggleRight className="w-8 h-8 text-purple-500" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-gray-400" />
            )}
          </motion.button>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl overflow-hidden border ${cardClass}`}
        >
          <div className={`px-5 py-4 border-b ${borderClass}`}>
            <h2 className={`font-semibold ${textClass}`}>Notifications</h2>
          </div>

          {settings.map((setting, index) => (
            <motion.button
              key={setting.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}
              onClick={() => toggleSetting(setting.id)}
              className={`w-full flex items-center gap-4 p-4 ${hoverClass} transition-colors border-b ${isDarkMode ? 'border-white/5' : 'border-gray-100'} last:border-0`}
            >
              <div
                className={`w-10 h-10 rounded-xl ${iconBgClass} flex items-center justify-center`}
              >
                <setting.icon className={`w-5 h-5 ${iconTextClass}`} />
              </div>
              <div className="flex-1 text-left">
                <p className={`font-medium ${textClass}`}>{setting.title}</p>
                <p className={`text-sm ${textSecondaryClass}`}>
                  {setting.description}
                </p>
              </div>
              {setting.enabled ? (
                <ToggleRight className="w-8 h-8 text-green-500" />
              ) : (
                <ToggleLeft
                  className={`w-8 h-8 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}
                />
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`rounded-2xl overflow-hidden border ${cardClass}`}
        >
          <div className={`px-5 py-4 border-b ${borderClass}`}>
            <h2 className={`font-semibold ${textClass}`}>App Information</h2>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className={textSecondaryClass}>Version</span>
              <span className={`font-medium ${textClass}`}>1.0.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={textSecondaryClass}>Build</span>
              <span className={`font-medium ${textClass}`}>2024.11.27</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
