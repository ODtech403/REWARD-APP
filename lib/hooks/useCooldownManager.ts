'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useUserStore } from '@/lib/stores/userStore'
import { useTaskStore } from '@/lib/stores/taskStore'

interface CooldownTimer {
  taskId: string
  timeoutId: NodeJS.Timeout
  endsAt: Date
}

/**
 * Hook for managing cooldown expiry timers
 * Sets up client-side timers for each cooldown and auto-refreshes task availability on expiry
 */
export function useCooldownManager() {
  const timersRef = useRef<Map<string, CooldownTimer>>(new Map())
  const { cooldowns, clearCooldown, clearExpiredCooldowns } = useUserStore()
  const { updateTask, tasks } = useTaskStore()

  // Handle cooldown expiry for a specific task
  const handleCooldownExpiry = useCallback(
    (taskId: string) => {
      // Clear from user store
      clearCooldown(taskId)

      // Update task availability in task store
      updateTask(taskId, {
        userCooldownEndsAt: null,
        isAvailable: true,
      })

      // Remove from local timers
      timersRef.current.delete(taskId)

      console.log(`Cooldown expired for task: ${taskId}`)
    },
    [clearCooldown, updateTask]
  )

  // Set up a timer for a specific cooldown
  const setupTimer = useCallback(
    (taskId: string, endsAt: Date) => {
      // Clear existing timer if any
      const existingTimer = timersRef.current.get(taskId)
      if (existingTimer) {
        clearTimeout(existingTimer.timeoutId)
      }

      const now = new Date()
      const remainingMs = endsAt.getTime() - now.getTime()

      // If already expired, handle immediately
      if (remainingMs <= 0) {
        handleCooldownExpiry(taskId)
        return
      }

      // Set up new timer
      const timeoutId = setTimeout(() => {
        handleCooldownExpiry(taskId)
      }, remainingMs)

      timersRef.current.set(taskId, {
        taskId,
        timeoutId,
        endsAt,
      })
    },
    [handleCooldownExpiry]
  )

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((timer) => {
      clearTimeout(timer.timeoutId)
    })
    timersRef.current.clear()
  }, [])

  // Clear expired cooldowns once on mount
  const hasInitialized = useRef(false)
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      clearExpiredCooldowns()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Set up timers for all cooldowns
  useEffect(() => {
    // Set up timers for each active cooldown
    cooldowns.forEach((endsAt, taskId) => {
      setupTimer(taskId, endsAt)
    })

    // Cleanup on unmount
    return () => {
      clearAllTimers()
    }
  }, [cooldowns, setupTimer, clearAllTimers])

  // Manually trigger a cooldown check
  const checkCooldowns = useCallback(() => {
    const now = new Date()
    cooldowns.forEach((endsAt, taskId) => {
      if (endsAt <= now) {
        handleCooldownExpiry(taskId)
      }
    })
  }, [cooldowns, handleCooldownExpiry])

  // Add a new cooldown
  const addCooldown = useCallback(
    (taskId: string, endsAt: Date) => {
      setupTimer(taskId, endsAt)
    },
    [setupTimer]
  )

  // Get remaining time for a specific task
  const getRemainingTime = useCallback(
    (taskId: string): number => {
      const endsAt = cooldowns.get(taskId)
      if (!endsAt) return 0

      const now = new Date()
      const remainingMs = endsAt.getTime() - now.getTime()
      return Math.max(0, remainingMs)
    },
    [cooldowns]
  )

  // Check if a task is on cooldown
  const isOnCooldown = useCallback(
    (taskId: string): boolean => {
      return getRemainingTime(taskId) > 0
    },
    [getRemainingTime]
  )

  return {
    checkCooldowns,
    addCooldown,
    getRemainingTime,
    isOnCooldown,
    clearAllTimers,
    activeCooldowns: cooldowns.size,
  }
}

/**
 * Hook for a single task's cooldown with auto-refresh
 */
export function useTaskCooldown(taskId: string, initialEndsAt?: Date | null) {
  const { setCooldown, clearCooldown, getCooldownEndTime, isTaskOnCooldown } = useUserStore()
  const { updateTask } = useTaskStore()
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const handleExpiry = useCallback(() => {
    clearCooldown(taskId)
    updateTask(taskId, {
      userCooldownEndsAt: null,
      isAvailable: true,
    })
    timerRef.current = null
  }, [taskId, clearCooldown, updateTask])

  // Set up timer when cooldown changes
  useEffect(() => {
    const endsAt = getCooldownEndTime(taskId) || initialEndsAt

    if (!endsAt) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    const now = new Date()
    const remainingMs = endsAt.getTime() - now.getTime()

    if (remainingMs <= 0) {
      handleExpiry()
      return
    }

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // Set new timer
    timerRef.current = setTimeout(handleExpiry, remainingMs)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [taskId, initialEndsAt, getCooldownEndTime, handleExpiry])

  return {
    isOnCooldown: isTaskOnCooldown(taskId),
    cooldownEndsAt: getCooldownEndTime(taskId),
    setCooldown: (endsAt: Date) => setCooldown(taskId, endsAt),
    clearCooldown: () => clearCooldown(taskId),
  }
}
