'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { ConfettiCelebration, useConfetti } from '@/components/user/ConfettiCelebration'
import { Skeleton } from '@/components/shared/LoadingSkeleton'

import { CategoryScroll } from '@/components/user/CategoryScroll'
import { TaskGrid } from '@/components/user/TaskGrid'
import { useUserStore } from '@/lib/stores/userStore'
import { useTaskStore } from '@/lib/stores/taskStore'
import { useThemeStore } from '@/lib/stores/themeStore'
import { useRealtimeSubscriptions, useCooldownManager } from '@/lib/hooks'
import type { Task, Category } from '@/lib/types'
import type { Database } from '@/lib/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type CampaignRow = Database['public']['Tables']['campaigns']['Row']
type TaskCompletionRow = Database['public']['Tables']['task_completions']['Row']

export default function UserDashboard() {
  const router = useRouter()
  const { isActive: isConfettiActive, triggerConfetti, onComplete: onConfettiComplete } = useConfetti()

  const { user, walletBalance, setUser, setBalance, setCooldown } = useUserStore()
  const { tasks, categories, setTasks, setCategories } = useTaskStore()
  const { theme } = useThemeStore()
  const isDark = theme === 'dark'

  // Show cached data immediately, only show loading if no cached data
  const hasCachedData = user !== null && tasks.length > 0
  const [isLoading, setIsLoading] = useState(!hasCachedData)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useCooldownManager()

  const triggerCelebration = useCallback(() => {
    triggerConfetti()
  }, [triggerConfetti])

  const handleBalanceChange = useCallback((newBalance: number, previousBalance: number) => {
    if (newBalance - previousBalance > 0) {
      triggerCelebration()
    }
  }, [triggerCelebration])

  useRealtimeSubscriptions({
    userId: user?.id,
    enabled: !isLoading && !!user?.id,
    onBalanceChange: handleBalanceChange,
  })


  useEffect(() => {
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    async function loadDashboardData() {
      try {
        // Only show loading spinner if no cached data
        if (!hasCachedData) {
          setIsLoading(true)
        }
        setError(null)

        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !authUser) {
          router.push('/login')
          return
        }

        // Fetch all data in parallel for faster loading
        const profilePromise = supabase.from('profiles').select('*').eq('id', authUser.id).single()
        const categoriesPromise = supabase.from('categories').select('*').order('sort_order', { ascending: true })
        const campaignsPromise = supabase.from('campaigns').select(`*, category:categories(*)`).eq('status', 'active').order('total_budget', { ascending: false })
        const completionsPromise = supabase.from('task_completions').select('campaign_id, cooldown_ends_at').eq('user_id', authUser.id).gt('cooldown_ends_at', new Date().toISOString())

        const [profileResult, categoriesResult, campaignsResult, completionsResult] = await Promise.all([
          profilePromise,
          categoriesPromise,
          campaignsPromise,
          completionsPromise
        ])

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const profileData = profileResult as any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const categoriesData = categoriesResult as any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const campaignsData = campaignsResult as any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const completionsData = completionsResult as any

        if (profileData.error || !profileData.data) {
          throw new Error('Failed to load profile')
        }

        const profile = profileData.data as Profile

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
        setCategories(categoriesData.data || [])

        const completions = (completionsData.data || []) as Pick<TaskCompletionRow, 'campaign_id' | 'cooldown_ends_at'>[]

        completions.forEach((completion) => {
          setCooldown(completion.campaign_id, new Date(completion.cooldown_ends_at))
        })

        const campaigns = (campaignsData.data || []) as (CampaignRow & { category?: Category })[]
        const tasksWithCooldowns: Task[] = campaigns.map((campaign) => {
          const completion = completions.find((c) => c.campaign_id === campaign.id)
          const cooldownEndsAt = completion ? new Date(completion.cooldown_ends_at) : null
          const isOnCooldown = cooldownEndsAt && cooldownEndsAt > new Date()

          return {
            ...campaign,
            userCooldownEndsAt: cooldownEndsAt,
            isAvailable: !isOnCooldown && campaign.status === 'active',
            userRating: 4.5,
            category: campaign.category,
          }
        })

        setTasks(tasksWithCooldowns)
      } catch (err) {
        console.error('Dashboard load error:', err)
        if (!hasCachedData) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [router, setUser, setBalance, setCooldown, setTasks, setCategories, hasCachedData])

  const handleTaskSelect = (taskId: string) => {
    router.push(`/task/${taskId}`)
  }

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).triggerCelebration = triggerCelebration
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).triggerCelebration
    }
  }, [triggerCelebration])


  const bgClass = isDark ? 'bg-[#0a0a0a]' : 'bg-gray-100'

  // Only show loading skeleton if no cached data at all
  if (isLoading && !hasCachedData) {
    return (
      <div className={`min-h-screen ${bgClass}`}>
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-12 rounded-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="aspect-[3/4] rounded-2xl" />
            <Skeleton className="aspect-[3/4] rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error && !hasCachedData) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4`}>
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-purple-500 text-white rounded-full font-medium hover:bg-purple-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${bgClass} pb-20`}>
      <ConfettiCelebration isActive={isConfettiActive} onComplete={onConfettiComplete} />

      {/* Header Section */}
      <div className="p-4">
        {/* Daily Tasks Banner with Balance - Golden Yellow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden mb-4"
        >
          <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 rounded-2xl p-5 relative shadow-lg">
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-3 h-10 bg-amber-600 rounded-r-lg" />
            <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-10 bg-amber-600 rounded-l-lg" />
            <div className="absolute top-3 left-6 w-2 h-2 bg-amber-300 rounded-full" />
            <div className="absolute top-5 right-8 w-1.5 h-1.5 bg-yellow-200 rounded-full" />
            <div className="absolute bottom-4 left-10 w-1 h-1 bg-amber-500 rounded-full" />
            
            {/* 3D Task & Reward Illustration */}
            <div className="absolute right-2 top-2 w-32 h-28 pointer-events-none">
              {/* Gold Coin */}
              <div className="absolute -top-1 right-8 w-10 h-10">
                <div className="w-full h-full bg-gradient-to-br from-amber-300 to-amber-600 rounded-full shadow-lg border-3 border-amber-500 flex items-center justify-center">
                  <span className="text-amber-800 font-bold text-lg">$</span>
                </div>
              </div>
              {/* Payment Terminal */}
              <div className="absolute top-8 right-1 transform rotate-[-15deg]">
                <div className="w-20 h-10 bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg shadow-lg relative">
                  <div className="absolute -top-4 left-3 w-10 h-5 bg-gradient-to-r from-cyan-300 to-cyan-400 rounded-t-md transform skew-x-[-5deg]" />
                  <div className="absolute top-2 left-2 text-amber-600 font-bold text-sm">$</div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <div className="w-1 h-2 bg-cyan-400 rounded-full" />
                    <div className="w-1 h-2 bg-cyan-400 rounded-full" />
                  </div>
                </div>
              </div>
              {/* Shield Check */}
              <div className="absolute bottom-1 left-0 w-8 h-8">
                <div className="w-full h-full bg-white rounded-full shadow-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              {/* Pay Card */}
              <div className="absolute bottom-0 right-2 w-14 h-9 bg-gradient-to-b from-gray-50 to-gray-100 rounded-md shadow-md transform rotate-[10deg]">
                <div className="absolute top-1 left-1 w-5 h-4 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" />
                  </svg>
                </div>
                <div className="absolute bottom-1 left-1 text-[8px] text-gray-500 font-medium">Pay</div>
              </div>
              {/* Dollar Coins Stack */}
              <div className="absolute bottom-6 left-6">
                <div className="w-6 h-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full shadow-md flex items-center justify-center border-2 border-gray-300">
                  <span className="text-gray-600 font-bold text-[10px]">$</span>
                </div>
                <div className="w-6 h-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full shadow-md flex items-center justify-center border-2 border-gray-300 -mt-3">
                  <span className="text-gray-600 font-bold text-[10px]">$</span>
                </div>
              </div>
            </div>
            
            {/* Balance Display */}
            <div className="mb-3">
              <p className="text-amber-800 text-xs">Your Balance</p>
              <h2 className="text-amber-900 text-3xl font-bold">
                ${walletBalance.toFixed(2)}
              </h2>
            </div>
            
            {/* Daily Tasks Info */}
            <div className="text-center">
              <h3 className="text-amber-900 text-lg font-bold drop-shadow-sm">
                ✨ Daily Tasks ✨
              </h3>
              <p className="text-amber-800 text-sm mt-1">
                Claim your daily free Rewards!
              </p>
              <div className="flex items-center justify-center gap-2 mt-2 text-amber-900">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Refresh in: 23:59:59</span>
              </div>
            </div>
            
            {/* View Wallet Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/wallet')}
              className="mt-3 w-full px-6 py-2 bg-amber-600/30 hover:bg-amber-600/40 text-amber-900 rounded-full font-medium transition-colors"
            >
              View Wallet
            </motion.button>
          </div>
        </motion.div>

      </div>

      {/* Category Scroll */}
      <CategoryScroll
        categories={categories}
        selectedCategory={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* Task Grid */}
      <TaskGrid
        tasks={tasks}
        selectedCategory={selectedCategory}
        onTaskSelect={handleTaskSelect}
      />
    </div>
  )
}
