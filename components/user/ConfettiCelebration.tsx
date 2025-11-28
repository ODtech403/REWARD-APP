'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConfettiPiece {
  id: number
  x: number
  color: string
  delay: number
  rotation: number
  size: number
}

interface ConfettiCelebrationProps {
  isActive: boolean
  duration?: number
  onComplete?: () => void
}

const CONFETTI_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#FFE66D', // Yellow
  '#95E1D3', // Mint
  '#F38181', // Coral
  '#AA96DA', // Purple
  '#FCBAD3', // Pink
  '#A8D8EA', // Light Blue
]

function generateConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100, // percentage across screen
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    delay: Math.random() * 0.5,
    rotation: Math.random() * 360,
    size: 8 + Math.random() * 8,
  }))
}

export function ConfettiCelebration({
  isActive,
  duration = 3000,
  onComplete,
}: ConfettiCelebrationProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([])
  const [isVisible, setIsVisible] = useState(false)

  const handleComplete = useCallback(() => {
    onComplete?.()
  }, [onComplete])

  useEffect(() => {
    if (isActive) {
      setConfetti(generateConfetti(50))
      setIsVisible(true)

      const timer = setTimeout(() => {
        setIsVisible(false)
        handleComplete()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isActive, duration, handleComplete])

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {confetti.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{
                x: `${piece.x}vw`,
                y: -20,
                rotate: piece.rotation,
                opacity: 1,
              }}
              animate={{
                y: '110vh',
                rotate: piece.rotation + 720,
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 2.5 + Math.random(),
                delay: piece.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              style={{
                position: 'absolute',
                width: piece.size,
                height: piece.size * 0.6,
                backgroundColor: piece.color,
                borderRadius: 2,
              }}
            />
          ))}

          {/* Burst effect from center */}
          {Array.from({ length: 20 }).map((_, i) => {
            const angle = (i / 20) * Math.PI * 2
            const distance = 150 + Math.random() * 100
            return (
              <motion.div
                key={`burst-${i}`}
                initial={{
                  x: '50vw',
                  y: '50vh',
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  x: `calc(50vw + ${Math.cos(angle) * distance}px)`,
                  y: `calc(50vh + ${Math.sin(angle) * distance}px)`,
                  scale: [0, 1.5, 0],
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 0.8,
                  ease: 'easeOut',
                }}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                }}
              />
            )
          })}
        </div>
      )}
    </AnimatePresence>
  )
}

// Hook to trigger confetti from anywhere
export function useConfetti() {
  const [isActive, setIsActive] = useState(false)

  const triggerConfetti = useCallback(() => {
    setIsActive(true)
  }, [])

  const onComplete = useCallback(() => {
    setIsActive(false)
  }, [])

  return { isActive, triggerConfetti, onComplete }
}
