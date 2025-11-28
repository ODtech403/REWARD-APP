import { create } from 'zustand'
import type { Campaign, Advertiser } from '@/lib/types'

interface AdvertiserState {
  advertiser: Advertiser | null
  campaigns: Campaign[]
  walletBalance: number
  isLoading: boolean
  error: string | null

  // Actions
  setAdvertiser: (advertiser: Advertiser | null) => void
  setCampaigns: (campaigns: Campaign[]) => void
  addCampaign: (campaign: Campaign) => void
  updateCampaign: (id: string, updates: Partial<Campaign>) => void
  removeCampaign: (id: string) => void
  updateBalance: (amount: number) => void
  setBalance: (balance: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void

  // Selectors
  getActiveCampaigns: () => Campaign[]
  getPausedCampaigns: () => Campaign[]
  getDepletedCampaigns: () => Campaign[]
  getCampaignById: (id: string) => Campaign | undefined
  getTotalSpent: () => number
  getTotalCompletions: () => number
}

export const useAdvertiserStore = create<AdvertiserState>()((set, get) => ({
  advertiser: null,
  campaigns: [],
  walletBalance: 0,
  isLoading: true,
  error: null,

  setAdvertiser: (advertiser) => set({
    advertiser,
    walletBalance: advertiser?.walletBalance ?? 0,
    isLoading: false,
  }),

  setCampaigns: (campaigns) => set({ campaigns }),

  addCampaign: (campaign) => set((state) => ({
    campaigns: [campaign, ...state.campaigns],
  })),

  updateCampaign: (id, updates) => set((state) => ({
    campaigns: state.campaigns.map((campaign) =>
      campaign.id === id ? { ...campaign, ...updates } : campaign
    ),
  })),

  removeCampaign: (id) => set((state) => ({
    campaigns: state.campaigns.filter((campaign) => campaign.id !== id),
  })),

  updateBalance: (amount) => set((state) => ({
    walletBalance: state.walletBalance + amount,
  })),

  setBalance: (balance) => set({ walletBalance: balance }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error, isLoading: false }),

  reset: () => set({
    advertiser: null,
    campaigns: [],
    walletBalance: 0,
    isLoading: false,
    error: null,
  }),

  getActiveCampaigns: () => {
    return get().campaigns.filter((c) => c.status === 'active')
  },

  getPausedCampaigns: () => {
    return get().campaigns.filter((c) => c.status === 'paused')
  },

  getDepletedCampaigns: () => {
    return get().campaigns.filter((c) => c.status === 'depleted')
  },

  getCampaignById: (id) => {
    return get().campaigns.find((c) => c.id === id)
  },

  getTotalSpent: () => {
    return get().campaigns.reduce((sum, c) => sum + c.spent_amount, 0)
  },

  getTotalCompletions: () => {
    return get().campaigns.reduce((sum, c) => sum + c.completed_count, 0)
  },
}))
