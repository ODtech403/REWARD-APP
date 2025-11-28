'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  Wallet, 
  Gift, 
  User, 
  Menu, 
  X, 
  LogOut, 
  HelpCircle, 
  Settings,
  CreditCard,
  Shield,
  ChevronRight,
  Info
} from 'lucide-react'
import { clsx } from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/userStore'
import type { Profile } from '@/lib/types'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/rewards', icon: Gift, label: 'Rewards' },
  { href: '/profile', icon: User, label: 'Profile' },
]

const menuItems = [
  { href: '/wallet', icon: CreditCard, label: 'Withdrawal', description: 'Withdraw your earnings' },
  { href: '/about', icon: Info, label: 'About', description: 'Learn how to use the app' },
  { href: '/settings', icon: Settings, label: 'Settings', description: 'App preferences' },
  { href: '/support', icon: HelpCircle, label: 'Customer Support', description: 'Get help 24/7' },
  { href: '/security', icon: Shield, label: 'Security', description: 'Account security' },
]

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { user, walletBalance, setUser, setBalance } = useUserStore()

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const supabase = createClient()
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

        if (authError || !authUser) {
          setIsLoading(false)
          return
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (profileError || !profileData) {
          console.error('Failed to load profile:', profileError)
          setIsLoading(false)
          return
        }

        const profile = profileData as unknown as Profile

        setUser({
          id: profile.id,
          email: profile.email,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
          role: profile.role,
          walletBalance: Number(profile.wallet_balance),
          createdAt: new Date(profile.created_at),
        })
        setBalance(Number(profile.wallet_balance))
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading user profile:', error)
        setIsLoading(false)
      }
    }

    loadUserProfile()
  }, [setUser, setBalance])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Header Bar - Green Notification Banner */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-green-500 to-emerald-400 shadow-sm">
        <div className="flex items-center px-4 py-3 gap-3">
          {/* Menu Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>

          {/* User Icon */}
          <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm">👤</span>
          </div>

          {/* Notification Text */}
          <p className="text-white text-sm flex-1 truncate">
            User completed &quot;Share your experience&quot; task and earned $0.50!
          </p>

          {/* Settings */}
          <button className="p-2 rounded-full hover:bg-white/20 transition-colors">
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {/* Menu Drawer Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/40 z-50"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="bg-gradient-to-br from-green-400 to-green-600 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Menu</h2>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* User Info */}
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/50">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">{user?.displayName || 'User'}</p>
                    <p className="text-white/80 text-sm">{user?.email}</p>
                  </div>
                </div>

                {/* Balance Card */}
                <div className="mt-4 p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                  <p className="text-white/80 text-sm">Your Balance</p>
                  <p className="text-3xl font-bold text-white">${walletBalance.toFixed(2)}</p>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-4 space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                      <item.icon className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 font-medium">{item.label}</p>
                      <p className="text-gray-500 text-sm">{item.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </Link>
                ))}
              </div>

              {/* Logout Button */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-red-50 transition-colors text-red-500"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pb-20">
        {children}
      </main>

      {/* Bottom Navigation - Clean White */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-pb">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[64px]',
                  isActive
                    ? 'text-green-600'
                    : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <motion.div
                  animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                  className={clsx(
                    'p-2 rounded-xl transition-colors',
                    isActive ? 'bg-green-50' : ''
                  )}
                >
                  <item.icon className="w-5 h-5" />
                </motion.div>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
