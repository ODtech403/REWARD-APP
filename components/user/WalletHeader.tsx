'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Coins, TrendingUp, TrendingDown } from 'lucide-react'
import { clsx } from 'clsx'

interface WalletHeaderProps {
  balance: number
  className?: string
  /** Optional callback when balance animation completes */
  onAnimationComplete?: () => void
}

export function WalletHeader({ balance, className, onAnimationComplete }: WalletHeaderProps) {
  const [displayBalance, setDisplayBalance] = useState(balance)
  const [isAnimating, setIsAnimating] = useState(false)
  const [balanceDiff, setBalanceDiff] = useState<number | null>(null)
  const [showPulse, setShowPulse] = useState(false)
  const prevBalanceRef = useRef(balance)
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup function for animation timeout
  const clearAnimationTimeout = useCallback(() => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
      animationTimeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    const prevBalance = prevBalanceRef.current

    if (balance !== prevBalance) {
      const diff = balance - prevBalance
      setBalanceDiff(diff)
      setIsAnimating(true)
      
      // Show pulse effect for positive changes
      if (diff > 0) {
        setShowPulse(true)
      }

      // Animate the balance change
      const duration = 600 // ms
      const steps = 24
      const stepDuration = duration / steps
      const increment = diff / steps

      let currentStep = 0
      const interval = setInterval(() => {
        currentStep++
        if (currentStep >= steps) {
          setDisplayBalance(balance)
          clearInterval(interval)
          
          // Clear any existing timeout
          clearAnimationTimeout()
          
          // Hide the diff indicator after animation
          animationTimeoutRef.current = setTimeout(() => {
            setBalanceDiff(null)
            setIsAnimating(false)
            setShowPulse(false)
            onAnimationComplete?.()
          }, 1500)
        } else {
          setDisplayBalance((prev) => prev + increment)
        }
      }, stepDuration)

      prevBalanceRef.current = balance

      return () => {
        clearInterval(interval)
        clearAnimationTimeout()
      }
    }
  }, [balance, clearAnimationTimeout, onAnimationComplete])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearAnimationTimeout()
  }, [clearAnimationTimeout])

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-2xl p-4',
        'bg-gradient-to-r from-purple-600/90 to-blue-600/90',
        'backdrop-blur-xl border border-white/10',
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-300/20 rounded-full blur-2xl" />
      </div>

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Coin icon with animation */}
          <motion.div
            animate={
              isAnimating
                ? {
                    rotate: [0, 15, -15, 10, -10, 0],
                    scale: [1, 1.2, 1.1, 1.15, 1],
                  }
                : {}
            }
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className={clsx(
              'w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300',
              showPulse
                ? 'bg-yellow-300 shadow-yellow-400/50 shadow-xl'
                : 'bg-yellow-400/90'
            )}
          >
            <Coins className="w-6 h-6 text-yellow-900" />
          </motion.div>

          <div>
            <p className="text-white/70 text-sm font-medium">Your Balance</p>
            <div className="flex items-center gap-2">
              <motion.span
                key={Math.round(displayBalance * 100)}
                initial={isAnimating ? { scale: 1.15, color: '#86efac' } : false}
                animate={{ scale: 1, color: '#ffffff' }}
                transition={{ duration: 0.3 }}
                className="text-white text-2xl font-bold"
              >
                ${displayBalance.toFixed(2)}
              </motion.span>

              {/* Balance change indicator - shows +amount for credits */}
              <AnimatePresence mode="wait">
                {balanceDiff !== null && balanceDiff > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex items-center gap-1 text-green-300 text-sm font-semibold bg-green-500/20 px-2 py-0.5 rounded-full"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>+${balanceDiff.toFixed(2)}</span>
                  </motion.div>
                )}
                {balanceDiff !== null && balanceDiff < 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex items-center gap-1 text-red-300 text-sm font-semibold bg-red-500/20 px-2 py-0.5 rounded-full"
                  >
                    <TrendingDown className="w-4 h-4" />
                    <span>${balanceDiff.toFixed(2)}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Optional: Quick action button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white text-sm font-medium transition-colors"
        >
          Withdraw
        </motion.button>
      </div>
    </div>
  )
}
