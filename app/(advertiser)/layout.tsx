'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAdvertiserStore } from '@/lib/stores/advertiserStore'
import { Wallet, LayoutDashboard, Megaphone, LogOut } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'
import type { Profile } from '@/lib/types'

/**
 * Advertiser Layout
 * 
 * This layout wraps all advertiser-facing pages (campaign management portal).
 * Route protection is handled by middleware (lib/supabase/middleware.ts):
 * - Unauthenticated users are redirected to /login
 * - Regular users are redirected to /dashboard
 * 
 * This component loads the advertiser profile into the Zustand store for UI display.
 * 
 * Requirements: 7.2, 7.4, 8.1
 */
export default function AdvertiserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const { walletBalance, setAdvertiser, setBalance } = useAdvertiserStore()

  useEffect(() => {
    const loadAdvertiserProfile = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        // Middleware handles auth redirects, but we still need to check for user
        // in case of race conditions during initial load
        if (authError || !user) {
          console.error('Auth error:', authError)
          setIsLoading(false)
          return
        }

        let { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        // If profile doesn't exist, create it (fallback for when trigger didn't run)
        if (profileError?.code === 'PGRST116' || !profileData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: newProfile, error: createError } = await (supabase as any)
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email!,
              display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
              role: user.user_metadata?.role || 'advertiser',
            })
            .select()
            .single()

          if (createError) {
            console.error('Failed to create profile:', createError)
            setIsLoading(false)
            return
          }
          profileData = newProfile
        }

        const profile = profileData as Profile | null

        // Middleware handles role-based redirects, but we still need profile data
        if (!profile) {
          setIsLoading(false)
          return
        }

        setAdvertiser({
          id: profile.id,
          email: profile.email,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url,
          role: profile.role as 'advertiser',
          walletBalance: profile.wallet_balance,
          createdAt: new Date(profile.created_at),
        })
        setBalance(profile.wallet_balance)
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading advertiser profile:', error)
        setIsLoading(false)
      }
    }

    loadAdvertiserProfile()
  }, [setAdvertiser, setBalance])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white/5 border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold text-white">Advertiser Portal</h1>
        </div>

        {/* Wallet Balance */}
        <div className="p-4 mx-4 mt-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-500/30">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <Wallet className="w-4 h-4" />
            <span>Wallet Balance</span>
          </div>
          <p className="text-2xl font-bold text-white">
            ${walletBalance.toLocaleString()}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <NavLink href="/advertiser-dashboard" icon={LayoutDashboard}>
            Dashboard
          </NavLink>
          <NavLink href="/campaigns" icon={Megaphone}>
            Campaigns
          </NavLink>
          <NavLink href="/advertiser-wallet" icon={Wallet}>
            Wallet
          </NavLink>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

interface NavLinkProps {
  href: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}

function NavLink({ href, icon: Icon, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
        'text-gray-400 hover:text-white hover:bg-white/10'
      )}
    >
      <Icon className="w-5 h-5" />
      <span>{children}</span>
    </Link>
  )
}
