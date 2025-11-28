'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PlayCelebrationProps {
  isActive: boolean
  onComplete: () => void
}

// Excited 3D character SVG
function ExcitedCharacter() {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="w-48 h-48"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ 
        scale: [0, 1.2, 1],
        rotate: [180, -10, 10, 0],
      }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Body */}
      <defs>
        <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD93D" />
          <stop offset="100%" stopColor="#FF9F43" />
        </linearGradient>
        <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#74B9FF" />
          <stop offset="100%" stopColor="#0984E3" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.3"/>
        </filter>
      </defs>
      
      {/* Shadow */}
      <ellipse cx="100" cy="185" rx="40" ry="10" fill="rgba(0,0,0,0.2)" />
      
      {/* Legs */}
      <motion.rect
        x="75" y="140" width="20" height="40" rx="10" fill="#2D3436"
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ duration: 0.3, repeat: Infinity }}
        style={{ transformOrigin: '85px 140px' }}
      />
      <motion.rect
        x="105" y="140" width="20" height="40" rx="10" fill="#2D3436"
        animate={{ rotate: [5, -5, 5] }}
        transition={{ duration: 0.3, repeat: Infinity }}
        style={{ transformOrigin: '115px 140px' }}
      />
      
      {/* Body/Shirt */}
      <ellipse cx="100" cy="120" rx="35" ry="40" fill="url(#shirtGrad)" filter="url(#shadow)" />
      
      {/* Arms raised in celebration */}
      <motion.g
        animate={{ rotate: [-15, 15, -15] }}
        transition={{ duration: 0.4, repeat: Infinity }}
        style={{ transformOrigin: '65px 100px' }}
      >
        <rect x="45" y="70" width="18" height="50" rx="9" fill="url(#bodyGrad)" />
        <circle cx="54" cy="65" r="12" fill="url(#bodyGrad)" />
      </motion.g>
      <motion.g
        animate={{ rotate: [15, -15, 15] }}
        transition={{ duration: 0.4, repeat: Infinity }}
        style={{ transformOrigin: '135px 100px' }}
      >
        <rect x="137" y="70" width="18" height="50" rx="9" fill="url(#bodyGrad)" />
        <circle cx="146" cy="65" r="12" fill="url(#bodyGrad)" />
      </motion.g>
      
      {/* Head */}
      <circle cx="100" cy="55" r="40" fill="url(#bodyGrad)" filter="url(#shadow)" />
      
      {/* Happy Eyes */}
      <motion.g
        animate={{ scaleY: [1, 0.1, 1] }}
        transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 2 }}
      >
        <ellipse cx="85" cy="50" rx="8" ry="10" fill="#2D3436" />
        <ellipse cx="115" cy="50" rx="8" ry="10" fill="#2D3436" />
        <circle cx="87" cy="47" r="3" fill="white" />
        <circle cx="117" cy="47" r="3" fill="white" />
      </motion.g>
      
      {/* Big Smile */}
      <motion.path
        d="M 75 65 Q 100 95 125 65"
        fill="none"
        stroke="#2D3436"
        strokeWidth="4"
        strokeLinecap="round"
        animate={{ d: ["M 75 65 Q 100 95 125 65", "M 75 68 Q 100 100 125 68", "M 75 65 Q 100 95 125 65"] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      />
      
      {/* Rosy Cheeks */}
      <circle cx="70" cy="60" r="8" fill="#FF6B6B" opacity="0.5" />
      <circle cx="130" cy="60" r="8" fill="#FF6B6B" opacity="0.5" />
      
      {/* Party Hat */}
      <motion.g
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ duration: 0.3, repeat: Infinity }}
        style={{ transformOrigin: '100px 20px' }}
      >
        <polygon points="100,0 80,35 120,35" fill="#E84393" />
        <circle cx="100" cy="0" r="6" fill="#FFD93D" />
        <rect x="85" y="30" width="30" height="8" fill="#6C5CE7" />
      </motion.g>
    </motion.svg>
  )
}

// Floating coins animation
function FloatingCoins() {
  const coins = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: Math.random() * 200 - 100,
    delay: Math.random() * 0.5,
  }))

  return (
    <>
      {coins.map((coin) => (
        <motion.div
          key={coin.id}
          className="absolute"
          initial={{ 
            x: coin.x, 
            y: 100, 
            scale: 0,
            rotate: 0 
          }}
          animate={{ 
            y: -150, 
            scale: [0, 1, 1, 0],
            rotate: 360,
            opacity: [0, 1, 1, 0]
          }}
          transition={{ 
            duration: 1.5, 
            delay: coin.delay,
            ease: "easeOut"
          }}
        >
          <svg viewBox="0 0 40 40" className="w-10 h-10">
            <defs>
              <linearGradient id={`coinGrad${coin.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="50%" stopColor="#FFA500" />
                <stop offset="100%" stopColor="#FFD700" />
              </linearGradient>
            </defs>
            <circle cx="20" cy="20" r="18" fill={`url(#coinGrad${coin.id})`} stroke="#DAA520" strokeWidth="2" />
            <text x="20" y="26" textAnchor="middle" fill="#8B4513" fontSize="16" fontWeight="bold">$</text>
          </svg>
        </motion.div>
      ))}
    </>
  )
}

// Sparkles animation
function Sparkles() {
  const sparkles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.cos((i / 12) * Math.PI * 2) * 120,
    y: Math.sin((i / 12) * Math.PI * 2) * 120,
    delay: i * 0.05,
    size: 8 + Math.random() * 8,
  }))

  return (
    <>
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          className="absolute"
          initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
          animate={{ 
            x: sparkle.x, 
            y: sparkle.y, 
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 0.8, 
            delay: sparkle.delay,
            ease: "easeOut"
          }}
        >
          <svg viewBox="0 0 24 24" style={{ width: sparkle.size, height: sparkle.size }}>
            <path
              d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"
              fill={['#FFD93D', '#FF6B6B', '#74B9FF', '#A29BFE', '#55EFC4'][sparkle.id % 5]}
            />
          </svg>
        </motion.div>
      ))}
    </>
  )
}

export function PlayCelebration({ isActive, onComplete }: PlayCelebrationProps) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={() => {
            setTimeout(onComplete, 2000)
          }}
        >
          {/* Background overlay */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Celebration content */}
          <div className="relative flex flex-col items-center">
            {/* Sparkles */}
            <Sparkles />
            
            {/* Floating coins */}
            <FloatingCoins />
            
            {/* Excited character */}
            <ExcitedCharacter />
            
            {/* Text */}
            <motion.div
              className="mt-4 text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.h2
                className="text-3xl font-bold text-white mb-2"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                🎉 Let&apos;s Go! 🎉
              </motion.h2>
              <p className="text-gray-300 text-lg">Complete the task to earn rewards!</p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook to manage celebration state
export function usePlayCelebration() {
  const [isActive, setIsActive] = useState(false)

  const triggerCelebration = useCallback(() => {
    setIsActive(true)
  }, [])

  const onComplete = useCallback(() => {
    setIsActive(false)
  }, [])

  return {
    isActive,
    triggerCelebration,
    onComplete,
  }
}
