'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Loader2, Briefcase, Gift } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

type UserRole = 'user' | 'advertiser'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [role, setRole] = useState<UserRole>('user')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get referral code from URL if present
  useEffect(() => {
    const refCode = searchParams.get('ref')
    if (refCode) {
      setReferralCode(refCode.toUpperCase())
    }
  }, [searchParams])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          role: role,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // If registration successful and referral code provided, apply it
    if (data.user && referralCode.trim()) {
      try {
        const response = await fetch('/api/referral', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referralCode: referralCode.trim() }),
        })
        
        if (!response.ok) {
          const result = await response.json()
          console.log('Referral application note:', result.error?.message)
          // Don't block registration if referral fails
        }
      } catch (err) {
        console.log('Referral application error:', err)
        // Don't block registration if referral fails
      }
    }

    router.refresh()
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
      {/* Logo/Brand */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0, y: -20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="mb-4"
        >
          <Image
            src="/app-icon.svg"
            alt="TaskReward"
            width={120}
            height={120}
            className="mx-auto drop-shadow-2xl"
            priority
          />
        </motion.div>
        <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-gray-400">Start earning rewards today</p>
      </div>

      {/* Role Selection */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <motion.button
          type="button"
          onClick={() => setRole('user')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
            role === 'user'
              ? 'bg-purple-500/20 border-purple-500/50 text-white'
              : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
          }`}
        >
          <User className="w-6 h-6" />
          <span className="text-sm font-medium">Earn Rewards</span>
        </motion.button>
        <motion.button
          type="button"
          onClick={() => setRole('advertiser')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
            role === 'advertiser'
              ? 'bg-blue-500/20 border-blue-500/50 text-white'
              : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
          }`}
        >
          <Briefcase className="w-6 h-6" />
          <span className="text-sm font-medium">Advertiser</span>
        </motion.button>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6"
        >
          <p className="text-red-400 text-sm text-center">{error}</p>
        </motion.div>
      )}

      {/* Register Form */}
      <form onSubmit={handleRegister} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Display Name
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
              minLength={6}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            />
          </div>
        </div>

        {/* Referral Code (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Referral Code <span className="text-gray-500">(optional)</span>
          </label>
          <div className="relative">
            <Gift className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              placeholder="Enter referral code"
              maxLength={12}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all uppercase tracking-wider"
            />
          </div>
          {referralCode && (
            <p className="text-green-400 text-xs mt-1">
              🎁 You&apos;ll be connected with your referrer!
            </p>
          )}
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-purple-500/25"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            `Create ${role === 'advertiser' ? 'Advertiser' : ''} Account`
          )}
        </motion.button>
      </form>

      {/* Login Link */}
      <p className="text-center text-gray-400 mt-6">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
        >
          Sign In
        </Link>
      </p>
    </div>
  )
}
