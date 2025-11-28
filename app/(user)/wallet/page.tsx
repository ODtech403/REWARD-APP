'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { motion } from 'framer-motion'
import { 
  Wallet, 
  ArrowLeft, 
  TrendingUp,
  Coins,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  DollarSign
} from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { TransactionHistory } from '@/components/user/TransactionHistory'
import { Skeleton } from '@/components/shared/LoadingSkeleton'
import { useUserStore } from '@/lib/stores/userStore'
import { useThemeStore } from '@/lib/stores/themeStore'
import { useRealtimeSubscriptions } from '@/lib/hooks'
import type { Transaction } from '@/lib/types'
import type { Database } from '@/lib/types/database'
import { 
  MINIMUM_WITHDRAWAL, 
  calculateAmountNeeded, 
  isWithdrawalEligible,
  calculateWithdrawalProgress 
} from '@/lib/utils/withdrawal'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function UserWalletPage() {
  const router = useRouter()
  const { user, walletBalance, setUser, setBalance } = useUserStore()
  const { theme } = useThemeStore()
  const isDark = theme === 'dark'
  
  // Show cached data immediately
  const hasCachedData = user !== null
  const [isLoading, setIsLoading] = useState(!hasCachedData)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const handleBalanceChange = useCallback((newBalance: number) => {
    setBalance(newBalance)
  }, [setBalance])

  useRealtimeSubscriptions({
    userId: user?.id,
    enabled: !isLoading && !!user?.id,
    onBalanceChange: handleBalanceChange,
  })

  const loadWalletData = useCallback(async (showRefreshing = false) => {
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    try {
      if (showRefreshing) {
        setIsRefreshing(true)
      } else if (!hasCachedData) {
        setIsLoading(true)
      }
      setError(null)

      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        router.push('/login')
        return
      }

      // Fetch profile and transactions in parallel for faster loading
      const [profileResult, transactionsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', authUser.id).single(),
        supabase.from('transactions').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }).limit(50)
      ] as const)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profileData = profileResult as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transactionsData = transactionsResult as any

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

      if (transactionsData.error) {
        console.error('Failed to load transactions:', transactionsData.error)
      }

      setTransactions((transactionsData.data || []) as Transaction[])
    } catch (err) {
      console.error('Wallet load error:', err)
      if (!hasCachedData) {
        setError(err instanceof Error ? err.message : 'Failed to load wallet')
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [router, setUser, setBalance, hasCachedData])

  useEffect(() => {
    loadWalletData()
  }, [loadWalletData])

  const handleRefresh = () => {
    loadWalletData(true)
  }

  const totalEarned = transactions
    .filter((t) => t.transaction_type === 'reward')
    .reduce((sum, t) => sum + t.amount, 0)


  const bgClass = isDark ? 'bg-[#0a0a0a]' : 'bg-gray-100'

  // Only show loading skeleton if no cached data
  if (isLoading && !hasCachedData) {
    return (
      <div className={`min-h-screen ${bgClass} p-4`}>
        <Skeleton className="h-12 w-32 mb-6" />
        <Skeleton className="h-40 mb-6" />
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    )
  }

  if (error && !hasCachedData) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4`}>
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => loadWalletData()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${bgClass} pb-20`}>
      {/* Header */}
      <div className="p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <button
            onClick={() => router.push('/dashboard')}
            className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
              isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-200 hover:bg-gray-300'
            )}
          >
            <ArrowLeft className={clsx('w-5 h-5', isDark ? 'text-white' : 'text-gray-700')} />
          </button>
          <div>
            <h1 className={clsx('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>My Wallet</h1>
            <p className={clsx('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>Track your earnings and transactions</p>
          </div>
        </motion.div>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card variant="glass" className="bg-gradient-to-r from-green-400 to-green-500 border-green-500/30">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-white/80 mb-2">
                    <Wallet className="w-5 h-5" />
                    <span>Available Balance</span>
                  </div>
                  <p className="text-4xl font-bold text-white">
                    ${walletBalance.toFixed(2)}
                  </p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30"
                >
                  <Coins className="w-8 h-8 text-yellow-900" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Withdrawal Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <Card variant="glass" className={clsx(
            'border',
            isWithdrawalEligible(walletBalance) 
              ? 'bg-green-500/10 border-green-500/30' 
              : isDark ? 'bg-orange-500/10 border-orange-500/30' : 'bg-purple-50 border-purple-200'
          )}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className={clsx(
                    'w-5 h-5',
                    isWithdrawalEligible(walletBalance) ? 'text-green-500' : 'text-orange-500'
                  )} />
                  <span className={clsx('font-medium', isDark ? 'text-white' : 'text-gray-900')}>Withdrawal Status</span>
                </div>
                {isWithdrawalEligible(walletBalance) ? (
                  <div className="flex items-center gap-1 text-green-500">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Eligible</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-orange-500">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Not Yet</span>
                  </div>
                )}
              </div>
              
              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Progress to minimum</span>
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>${walletBalance.toFixed(2)} / ${MINIMUM_WITHDRAWAL.toFixed(2)}</span>
                </div>
                <div className={clsx('h-2 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-gray-200')}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${calculateWithdrawalProgress(walletBalance)}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className={clsx(
                      'h-full rounded-full',
                      isWithdrawalEligible(walletBalance) ? 'bg-green-500' : 'bg-orange-500'
                    )}
                  />
                </div>
              </div>

              {isWithdrawalEligible(walletBalance) ? (
                <p className="text-green-500 text-sm">
                  🎉 You can withdraw your earnings now!
                </p>
              ) : (
                <p className="text-orange-500 text-sm">
                  Earn ${calculateAmountNeeded(walletBalance).toFixed(2)} more to reach the minimum withdrawal of ${MINIMUM_WITHDRAWAL.toFixed(2)}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          <Card variant="glass" className={isDark ? '' : 'bg-white border border-gray-200'}>
            <CardContent className="py-4">
              <div className={clsx('flex items-center gap-2 text-sm mb-1', isDark ? 'text-gray-400' : 'text-gray-600')}>
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span>Total Earned</span>
              </div>
              <p className="text-xl font-bold text-green-500">
                ${totalEarned.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card variant="glass" className={isDark ? '' : 'bg-white border border-gray-200'}>
            <CardContent className="py-4">
              <div className={clsx('flex items-center gap-2 text-sm mb-1', isDark ? 'text-gray-400' : 'text-gray-600')}>
                <Coins className="w-4 h-4 text-purple-500" />
                <span>Tasks Completed</span>
              </div>
              <p className="text-xl font-bold text-purple-500">
                {transactions.filter((t) => t.transaction_type === 'reward').length}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transaction History Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className={clsx('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>Transaction History</h2>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-200 hover:bg-gray-300',
                isRefreshing && 'opacity-50 cursor-not-allowed'
              )}
            >
              <RefreshCw className={clsx('w-4 h-4', isDark ? 'text-gray-400' : 'text-gray-600', isRefreshing && 'animate-spin')} />
            </button>
          </div>
          
          <TransactionHistory transactions={transactions} isDark={isDark} />
        </motion.div>
      </div>
    </div>
  )
}
