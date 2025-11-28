'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      // Navigate immediately without waiting for refresh
      router.push('/dashboard')
    } catch (err) {
      console.error('Login error:', err)
      setError('Unable to connect. Please check your internet connection.')
      setLoading(false)
    }
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
        <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-gray-400">Sign in to continue earning rewards</p>
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

      {/* Login Form */}
      <form onSubmit={handleLogin} className="space-y-5">
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
              placeholder="Enter your password"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            />
          </div>
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
            'Sign In'
          )}
        </motion.button>
      </form>

      {/* Register Link */}
      <p className="text-center text-gray-400 mt-6">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
        >
          Sign Up
        </Link>
      </p>
    </div>
  )
}
