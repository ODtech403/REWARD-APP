'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock } from 'lucide-react'
import { clsx } from 'clsx'

interface CooldownTimerProps {
  endTime: Date
  onExpire: () => void
  className?: string
  showIcon?: boolean
}

function formatTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00'

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const pad = (n: number) => n.toString().padStart(2, '0')

  // Format as HH:MM:SS if hours > 0, otherwise MM:SS
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  }
  return `${pad(minutes)}:${pad(seconds)}`
}

function calculateRemainingSeconds(endTime: Date): number {
  const now = new Date()
  const diff = endTime.getTime() - now.getTime()
  return Math.max(0, Math.floor(diff / 1000))
}

export function CooldownTimer({ endTime, onExpire, className, showIcon = true }: CooldownTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() => 
    calculateRemainingSeconds(endTime)
  )

  const handleExpire = useCallback(() => {
    onExpire()
  }, [onExpire])

  useEffect(() => {
    // Recalculate when endTime changes
    setRemainingSeconds(calculateRemainingSeconds(endTime))
  }, [endTime])

  useEffect(() => {
    if (remainingSeconds <= 0) {
      handleExpire()
      return
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        const newValue = prev - 1
        if (newValue <= 0) {
          clearInterval(interval)
          // Use setTimeout to avoid calling onExpire during render
          setTimeout(handleExpire, 0)
          return 0
        }
        return newValue
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [remainingSeconds, handleExpire])

  if (remainingSeconds <= 0) {
    return null
  }

  return (
    <div
      className={clsx(
        'flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5',
        className
      )}
    >
      {showIcon && <Clock className="w-4 h-4 text-white/70" />}
      <span className="text-white font-mono text-sm font-medium">
        {formatTime(remainingSeconds)}
      </span>
    </div>
  )
}
