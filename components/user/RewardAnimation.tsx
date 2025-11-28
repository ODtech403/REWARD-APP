'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Coins } from 'lucide-react'

interface RewardAnimationProps {
  amount: number
  isVisible: boolean
  onComplete?: () => void
  startPosition?: { x: number; y: number }
  endPosition?: { x: number; y: number }
}

export function RewardAnimation({
  amount,
  isVisible,
  onComplete,
  startPosition = { x: 0, y: 0 },
  endPosition = { x: 0, y: -100 },
}: RewardAnimationProps) {
  const [coins, setCoins] = useState<number[]>([])

  useEffect(() => {
    if (isVisible) {
      // Generate coin IDs for animation
      const numCoins = Math.min(Math.ceil(amount * 2), 8)
      setCoins(Array.from({ length: numCoins }, (_, i) => i))
    } else {
      setCoins([])
    }
  }, [isVisible, amount])

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {/* Flying coins */}
          {coins.map((coinId, index) => (
            <motion.div
              key={coinId}
              initial={{
                x: startPosition.x,
                y: startPosition.y,
                scale: 0,
                opacity: 0,
              }}
              animate={{
                x: [
                  startPosition.x,
                  startPosition.x + (Math.random() - 0.5) * 100,
                  endPosition.x,
                ],
                y: [
                  startPosition.y,
                  startPosition.y - 50 - Math.random() * 50,
                  endPosition.y,
                ],
                scale: [0, 1.2, 1, 0.8],
                opacity: [0, 1, 1, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 1.2,
                delay: index * 0.1,
                ease: 'easeOut',
              }}
              className="absolute"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/50">
                <Coins className="w-4 h-4 text-yellow-800" />
              </div>
            </motion.div>
          ))}

          {/* Amount text */}
          <motion.div
            initial={{
              x: startPosition.x,
              y: startPosition.y - 20,
              scale: 0,
              opacity: 0,
            }}
            animate={{
              y: startPosition.y - 80,
              scale: [0, 1.3, 1],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 1.5,
              ease: 'easeOut',
            }}
            className="absolute"
          >
            <span className="text-2xl font-bold text-green-400 drop-shadow-lg">
              +${amount.toFixed(2)}
            </span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// Hook to trigger reward animation from anywhere
export function useRewardAnimation() {
  const [animationState, setAnimationState] = useState<{
    isVisible: boolean
    amount: number
    startPosition: { x: number; y: number }
    endPosition: { x: number; y: number }
  }>({
    isVisible: false,
    amount: 0,
    startPosition: { x: 0, y: 0 },
    endPosition: { x: 0, y: 0 },
  })

  const triggerAnimation = (
    amount: number,
    startElement?: HTMLElement | null,
    endElement?: HTMLElement | null
  ) => {
    const startRect = startElement?.getBoundingClientRect()
    const endRect = endElement?.getBoundingClientRect()

    setAnimationState({
      isVisible: true,
      amount,
      startPosition: startRect
        ? { x: startRect.left + startRect.width / 2, y: startRect.top + startRect.height / 2 }
        : { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      endPosition: endRect
        ? { x: endRect.left + endRect.width / 2, y: endRect.top }
        : { x: window.innerWidth / 2, y: 50 },
    })

    // Auto-hide after animation
    setTimeout(() => {
      setAnimationState((prev) => ({ ...prev, isVisible: false }))
    }, 1500)
  }

  return { animationState, triggerAnimation }
}
