'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, Wallet, Trophy, User } from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/achievements', icon: Trophy, label: 'Rewards' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/5 safe-area-bottom">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center gap-1 py-2 px-4"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-purple-500/20 rounded-xl"
                    transition={{ type: 'spring', duration: 0.5 }}
                  />
                )}
                <Icon
                  className={clsx(
                    'w-6 h-6 relative z-10 transition-colors',
                    isActive ? 'text-purple-400' : 'text-gray-500'
                  )}
                />
                <span
                  className={clsx(
                    'text-xs font-medium relative z-10 transition-colors',
                    isActive ? 'text-purple-400' : 'text-gray-500'
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
