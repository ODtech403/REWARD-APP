import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/lib/types'

interface CooldownEntry {
  taskId: string
  endsAt: Date
}

interface UserState {
  user: User | null
  walletBalance: number
  cooldowns: Map<string, Date>
  isLoading: boolean
  
  // Actions
  setUser: (user: User | null) => void
  updateBalance: (amount: number) => void
  setBalance: (balance: number) => void
  setCooldown: (taskId: string, endTime: Date) => void
  clearCooldown: (taskId: string) => void
  clearExpiredCooldowns: () => void
  isTaskOnCooldown: (taskId: string) => boolean
  getCooldownEndTime: (taskId: string) => Date | null
  setLoading: (loading: boolean) => void
  reset: () => void
}

// Helper to serialize/deserialize Map for persistence
const serializeCooldowns = (cooldowns: Map<string, Date>): CooldownEntry[] => {
  return Array.from(cooldowns.entries()).map(([taskId, endsAt]) => ({
    taskId,
    endsAt,
  }))
}

const deserializeCooldowns = (entries: CooldownEntry[]): Map<string, Date> => {
  const map = new Map<string, Date>()
  entries.forEach(({ taskId, endsAt }) => {
    map.set(taskId, new Date(endsAt))
  })
  return map
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      walletBalance: 0,
      cooldowns: new Map(),
      isLoading: true,

      setUser: (user) => set({ 
        user, 
        walletBalance: user?.walletBalance ?? 0,
        isLoading: false 
      }),

      updateBalance: (amount) => set((state) => ({
        walletBalance: state.walletBalance + amount,
      })),

      setBalance: (balance) => set({ walletBalance: balance }),

      setCooldown: (taskId, endTime) => set((state) => {
        const newCooldowns = new Map(state.cooldowns)
        newCooldowns.set(taskId, endTime)
        return { cooldowns: newCooldowns }
      }),

      clearCooldown: (taskId) => set((state) => {
        const newCooldowns = new Map(state.cooldowns)
        newCooldowns.delete(taskId)
        return { cooldowns: newCooldowns }
      }),

      clearExpiredCooldowns: () => set((state) => {
        const now = new Date()
        const newCooldowns = new Map<string, Date>()
        state.cooldowns.forEach((endTime, taskId) => {
          if (endTime > now) {
            newCooldowns.set(taskId, endTime)
          }
        })
        return { cooldowns: newCooldowns }
      }),

      isTaskOnCooldown: (taskId) => {
        const endTime = get().cooldowns.get(taskId)
        if (!endTime) return false
        return endTime > new Date()
      },

      getCooldownEndTime: (taskId) => {
        const endTime = get().cooldowns.get(taskId)
        if (!endTime || endTime <= new Date()) return null
        return endTime
      },

      setLoading: (loading) => set({ isLoading: loading }),

      reset: () => set({
        user: null,
        walletBalance: 0,
        cooldowns: new Map(),
        isLoading: false,
      }),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        user: state.user,
        walletBalance: state.walletBalance,
        cooldowns: serializeCooldowns(state.cooldowns),
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as { 
          user?: User | null
          walletBalance?: number
          cooldowns?: CooldownEntry[] 
        }
        return {
          ...current,
          user: persistedState?.user ?? null,
          walletBalance: persistedState?.walletBalance ?? 0,
          cooldowns: persistedState?.cooldowns 
            ? deserializeCooldowns(persistedState.cooldowns)
            : new Map(),
        }
      },
    }
  )
)
