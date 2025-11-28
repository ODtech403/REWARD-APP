'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/userStore'
import { useTaskStore } from '@/lib/stores/taskStore'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type Campaign = Database['public']['Tables']['campaigns']['Row']

interface UseRealtimeSubscriptionsOptions {
  userId?: string
  enabled?: boolean
  onBalanceChange?: (newBalance: number, previousBalance: number) => void
  onCampaignChange?: (campaign: Campaign, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
}

/**
 * Hook for managing Supabase real-time subscriptions
 * Subscribes to:
 * - Profile balance changes for the current user
 * - Campaign status changes for the task feed
 */
export function useRealtimeSubscriptions({
  userId,
  enabled = true,
  onBalanceChange,
  onCampaignChange,
}: UseRealtimeSubscriptionsOptions = {}) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const { setBalance, walletBalance } = useUserStore()
  const { updateTask, removeTask, addTask } = useTaskStore()
  const previousBalanceRef = useRef(walletBalance)

  // Handle profile changes (balance updates)
  const handleProfileChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Profile>) => {
      if (payload.eventType === 'UPDATE' && payload.new) {
        const newProfile = payload.new as Profile
        const newBalance = Number(newProfile.wallet_balance)
        const previousBalance = previousBalanceRef.current

        if (newBalance !== previousBalance) {
          setBalance(newBalance)
          previousBalanceRef.current = newBalance
          onBalanceChange?.(newBalance, previousBalance)
        }
      }
    },
    [setBalance, onBalanceChange]
  )

  // Handle campaign changes (status, budget updates)
  const handleCampaignChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Campaign>) => {
      const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'

      if (eventType === 'UPDATE' && payload.new) {
        const updatedCampaign = payload.new as Campaign

        // Update the task in the store
        updateTask(updatedCampaign.id, {
          status: updatedCampaign.status,
          spent_amount: updatedCampaign.spent_amount,
          total_budget: updatedCampaign.total_budget,
          completed_count: updatedCampaign.completed_count,
        })

        // Check if campaign should be removed from feed
        const remainingBudget = updatedCampaign.total_budget - updatedCampaign.spent_amount
        const shouldRemove =
          updatedCampaign.status === 'paused' ||
          updatedCampaign.status === 'depleted' ||
          remainingBudget < updatedCampaign.cost_per_action

        if (shouldRemove) {
          // Remove from tasks list using the removeTask action
          removeTask(updatedCampaign.id)
        }

        onCampaignChange?.(updatedCampaign, eventType)
      } else if (eventType === 'INSERT' && payload.new) {
        const newCampaign = payload.new as Campaign

        // Only add if it's an active campaign with budget
        if (newCampaign.status === 'active') {
          const remainingBudget = newCampaign.total_budget - newCampaign.spent_amount
          if (remainingBudget >= newCampaign.cost_per_action) {
            // Add to tasks with default values using the addTask action
            const newTask = {
              ...newCampaign,
              userCooldownEndsAt: null,
              isAvailable: true,
              userRating: 4.5,
            }
            addTask(newTask)
          }
        }

        onCampaignChange?.(newCampaign, eventType)
      } else if (eventType === 'DELETE' && payload.old) {
        const deletedCampaign = payload.old as Campaign
        // Remove from tasks list using the removeTask action
        removeTask(deletedCampaign.id)

        onCampaignChange?.(deletedCampaign, eventType)
      }
    },
    [updateTask, removeTask, addTask, onCampaignChange]
  )


  // Set up subscriptions
  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()

    // Create a single channel for all subscriptions
    const channel = supabase.channel('realtime-updates', {
      config: {
        broadcast: { self: true },
      },
    })

    // Subscribe to profile changes for the current user
    if (userId) {
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        handleProfileChange
      )
    }

    // Subscribe to campaign changes (all campaigns for task feed)
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns',
        },
        handleCampaignChange
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          // Gracefully handle subscription errors - app continues to work without realtime
          // This is expected when Supabase realtime is not configured or unavailable
          setIsSubscribed(false)
        }
      })

    channelRef.current = channel

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
        setIsSubscribed(false)
      }
    }
  }, [userId, enabled, handleProfileChange, handleCampaignChange])

  // Update previous balance ref when wallet balance changes
  useEffect(() => {
    previousBalanceRef.current = walletBalance
  }, [walletBalance])

  // Manual unsubscribe function
  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      const supabase = createClient()
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
      setIsSubscribed(false)
    }
  }, [])

  return {
    unsubscribe,
    isSubscribed,
  }
}

/**
 * Hook specifically for balance updates with animation callback
 */
export function useBalanceSubscription(userId?: string) {
  const balanceChangeCallbackRef = useRef<((amount: number) => void) | null>(null)

  const setOnBalanceChange = useCallback((callback: (amount: number) => void) => {
    balanceChangeCallbackRef.current = callback
  }, [])

  const handleBalanceChange = useCallback((newBalance: number, previousBalance: number) => {
    const diff = newBalance - previousBalance
    if (diff > 0 && balanceChangeCallbackRef.current) {
      balanceChangeCallbackRef.current(diff)
    }
  }, [])

  const { unsubscribe, isSubscribed } = useRealtimeSubscriptions({
    userId,
    enabled: !!userId,
    onBalanceChange: handleBalanceChange,
  })

  return {
    setOnBalanceChange,
    unsubscribe,
    isSubscribed,
  }
}

/**
 * Hook specifically for campaign/task feed updates
 */
export function useCampaignSubscription(
  onCampaignRemoved?: (campaignId: string) => void
) {
  const handleCampaignChange = useCallback(
    (campaign: Campaign, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => {
      if (eventType === 'UPDATE') {
        const remainingBudget = campaign.total_budget - campaign.spent_amount
        const shouldRemove =
          campaign.status === 'paused' ||
          campaign.status === 'depleted' ||
          remainingBudget < campaign.cost_per_action

        if (shouldRemove && onCampaignRemoved) {
          onCampaignRemoved(campaign.id)
        }
      } else if (eventType === 'DELETE' && onCampaignRemoved) {
        onCampaignRemoved(campaign.id)
      }
    },
    [onCampaignRemoved]
  )

  const { unsubscribe, isSubscribed } = useRealtimeSubscriptions({
    enabled: true,
    onCampaignChange: handleCampaignChange,
  })

  return {
    unsubscribe,
    isSubscribed,
  }
}
