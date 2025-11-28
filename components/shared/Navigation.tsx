'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, Wallet, Trophy, User } from 'lucide-react'
import { clsx } from 'clsx'
import { useThemeStore } from '@/lib/stores/themeStore'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/rewards', icon: Trophy, label: 'Rewards' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function Navigation() {
  const pathname = usePathname()
  const { theme } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <nav className={clsx(
      'fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t safe-area-bottom',
      isDark ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
    )}>
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className="relative flex flex-col items-center gap-1 py-2 px-4"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className={clsx(
                      'absolute inset-0 rounded-xl',
                      isDark ? 'bg-purple-500/20' : 'bg-purple-100'
                    )}
                    transition={{ type: 'spring', duration: 0.5 }}
                  />
                )}
                <Icon
                  className={clsx(
                    'w-6 h-6 relative z-10 transition-colors',
                    isActive 
                      ? (isDark ? 'text-purple-400' : 'text-purple-600')
                      : (isDark ? 'text-gray-500' : 'text-gray-400')
                  )}
                />
                <span
                  className={clsx(
                    'text-xs font-medium relative z-10 transition-colors',
                    isActive 
                      ? (isDark ? 'text-purple-400' : 'text-purple-600')
                      : (isDark ? 'text-gray-500' : 'text-gray-500')
                  )}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
