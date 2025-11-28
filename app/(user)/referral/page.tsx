'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Copy, 
  Share2, 
  Users, 
  DollarSign, 
  Gift,
  CheckCircle,
  Clock
} from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'
import { useThemeStore } from '@/lib/stores/themeStore'

interface Referral {
  id: string
  reward_amount: number
  status: 'pending' | 'completed' | 'rejected'
  created_at: string
  referred: {
    display_name: string | null
    email: string
  } | null
}

interface ReferralData {
  referralCode: string
  referralCount: number
  referralEarnings: number
  rewardPerReferral: number
  referrals: Referral[]
}

const REWARD_PER_REFERRAL = 0.02

export default function ReferralPage() {
  const router = useRouter()
  const { theme } = useThemeStore()
  const isDark = theme === 'dark'
  
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<ReferralData | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadReferralData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/referral')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to load referral data')
      }

      setData(result)
    } catch (err) {
      console.error('Load referral error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load referral data')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadReferralData()
  }, [loadReferralData])

  const handleCopyCode = async () => {
    if (!data?.referralCode) return
    
    try {
      await navigator.clipboard.writeText(data.referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = data.referralCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async () => {
    if (!data?.referralCode) return
    
    const shareText = `Join me on TaskApp and start earning! Use my referral code: ${data.referralCode} to sign up and we both earn rewards! 🎉💰`
    const shareUrl = `${window.location.origin}/register?ref=${data.referralCode}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join TaskApp',
          text: shareText,
          url: shareUrl,
        })
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy link
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const bgClass = isDark ? 'bg-[#0a0a0a]' : 'bg-gray-100'

  if (isLoading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4`}>
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={loadReferralData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${bgClass} pb-24`}>
      {/* Header */}
      <div className="p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <button
            onClick={() => router.back()}
            className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
              isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-200 hover:bg-gray-300'
            )}
          >
            <ArrowLeft className={clsx('w-5 h-5', isDark ? 'text-white' : 'text-gray-700')} />
          </button>
          <div>
            <h1 className={clsx('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
              Refer & Earn
            </h1>
            <p className={clsx('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Invite friends and earn rewards
            </p>
          </div>
        </motion.div>

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card variant="glass" className="bg-gradient-to-br from-green-500 to-emerald-600 border-green-400/30 overflow-hidden">
            <CardContent className="py-6 relative">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">Earn per referral</p>
                    <p className="text-3xl font-bold text-white">${REWARD_PER_REFERRAL.toFixed(2)}</p>
                  </div>
                </div>
                
                <p className="text-white/90 text-sm mb-4">
                  Share your referral code with friends. When they sign up and join, you both earn rewards!
                </p>

                {/* Referral Code */}
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/70 text-xs mb-2">Your Referral Code</p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-mono font-bold text-white tracking-wider flex-1">
                      {data?.referralCode || '--------'}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className={clsx(
                        'p-2 rounded-lg transition-colors',
                        copied ? 'bg-green-400 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                      )}
                    >
                      {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Share Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Button
            onClick={handleShare}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Share2 className="w-5 h-5 mr-2" />
            Share Referral Link
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          <Card variant="glass" className={isDark ? '' : 'bg-white border border-gray-200'}>
            <CardContent className="py-4">
              <div className={clsx('flex items-center gap-2 text-sm mb-1', isDark ? 'text-gray-400' : 'text-gray-600')}>
                <Users className="w-4 h-4 text-blue-500" />
                <span>Total Referrals</span>
              </div>
              <p className="text-2xl font-bold text-blue-500">
                {data?.referralCount || 0}
              </p>
            </CardContent>
          </Card>
          <Card variant="glass" className={isDark ? '' : 'bg-white border border-gray-200'}>
            <CardContent className="py-4">
              <div className={clsx('flex items-center gap-2 text-sm mb-1', isDark ? 'text-gray-400' : 'text-gray-600')}>
                <DollarSign className="w-4 h-4 text-green-500" />
                <span>Total Earned</span>
              </div>
              <p className="text-2xl font-bold text-green-500">
                ${(data?.referralEarnings || 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <h2 className={clsx('text-lg font-semibold mb-4', isDark ? 'text-white' : 'text-gray-900')}>
            How it works
          </h2>
          <Card variant="glass" className={isDark ? '' : 'bg-white border border-gray-200'}>
            <CardContent className="py-4 space-y-4">
              <Step number={1} title="Share your code" description="Send your unique referral code to friends" isDark={isDark} />
              <Step number={2} title="Friend signs up" description="They create an account using your code" isDark={isDark} />
              <Step number={3} title="You earn $0.02" description="Get rewarded instantly when they join!" isDark={isDark} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Referral History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className={clsx('text-lg font-semibold mb-4', isDark ? 'text-white' : 'text-gray-900')}>
            Referral History
          </h2>
          
          {data?.referrals && data.referrals.length > 0 ? (
            <div className="space-y-3">
              {data.referrals.map((referral) => (
                <ReferralItem key={referral.id} referral={referral} isDark={isDark} />
              ))}
            </div>
          ) : (
            <Card variant="glass" className={isDark ? '' : 'bg-white border border-gray-200'}>
              <CardContent className="py-8 text-center">
                <Users className={clsx('w-12 h-12 mx-auto mb-3', isDark ? 'text-gray-600' : 'text-gray-400')} />
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  No referrals yet
                </p>
                <p className={clsx('text-sm mt-1', isDark ? 'text-gray-500' : 'text-gray-500')}>
                  Share your code to start earning!
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  )
}

function Step({ number, title, description, isDark }: { number: number; title: string; description: string; isDark: boolean }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
        <span className="text-white font-bold text-sm">{number}</span>
      </div>
      <div>
        <p className={clsx('font-medium', isDark ? 'text-white' : 'text-gray-900')}>{title}</p>
        <p className={clsx('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>{description}</p>
      </div>
    </div>
  )
}

function ReferralItem({ referral, isDark }: { referral: Referral; isDark: boolean }) {
  const displayName = referral.referred?.display_name || referral.referred?.email?.split('@')[0] || 'User'
  const date = new Date(referral.created_at).toLocaleDateString()
  
  return (
    <Card variant="glass" className={isDark ? '' : 'bg-white border border-gray-200'}>
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center',
              isDark ? 'bg-green-500/20' : 'bg-green-100'
            )}>
              <Users className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className={clsx('font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                {displayName}
              </p>
              <div className={clsx('flex items-center gap-1 text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>
                <Clock className="w-3 h-3" />
                <span>{date}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-green-500 font-bold">+${referral.reward_amount.toFixed(2)}</p>
            <p className={clsx(
              'text-xs capitalize',
              referral.status === 'completed' ? 'text-green-500' : 
              referral.status === 'pending' ? 'text-yellow-500' : 'text-red-500'
            )}>
              {referral.status}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
