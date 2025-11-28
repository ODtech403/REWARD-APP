import type { Database } from './database'

// Extract types from database schema
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Campaign = Database['public']['Tables']['campaigns']['Row']
export type TaskCompletion = Database['public']['Tables']['task_completions']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type Deposit = Database['public']['Tables']['deposits']['Row']
export type Referral = Database['public']['Tables']['referrals']['Row']

// Extended types for UI
export interface Task extends Campaign {
  userCooldownEndsAt: Date | null
  isAvailable: boolean
  userRating: number
  category?: Category
}

export interface User {
  id: string
  email: string
  displayName: string | null
  avatarUrl: string | null
  role: 'user' | 'advertiser' | 'admin'
  walletBalance: number
  createdAt: Date
}

export interface Advertiser extends User {
  role: 'advertiser'
}

// Campaign creation draft
export interface CampaignDraft {
  title: string
  description: string
  categoryId: string
  campaignType: Campaign['campaign_type']
  totalBudget: number
  costPerAction: number
  cooldownSeconds: number
  estimatedDurationMinutes: number
  maxCompletionsPerUser: number
  thumbnailUrl?: string
  gradientStart?: string
  gradientEnd?: string
  promotionUrl: string // Direct link, app store URL, or website to promote
}

// API types
export interface APIErrorResponse {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

export interface TaskCompletionResult {
  success: boolean
  newBalance: number
  cooldownEndsAt: Date
  rewardAmount: number
  errorMessage?: string
}

// Component prop types
export interface TaskCardProps {
  task: Task
  onSelect: (taskId: string) => void
}

export interface CategoryScrollProps {
  categories: Category[]
  selectedCategory: string | null
  onSelect: (categoryId: string | null) => void
}

export interface MascotState {
  state: 'idle' | 'celebrating' | 'pointing' | 'sleeping'
}

export interface CooldownTimerProps {
  endTime: Date
  onExpire: () => void
}

// Gradient presets for task cards
export const GRADIENT_PRESETS = [
  { start: '#8B7ECC', end: '#A99DD8' }, // Purple
  { start: '#7B9FE8', end: '#9B8DCF' }, // Blue-Purple
  { start: '#9D8DC7', end: '#B8AEDD' }, // Soft Purple
  { start: '#A88FCC', end: '#C4A8E0' }, // Mauve
  { start: '#E879C0', end: '#B47EC9' }, // Pink-Purple
  { start: '#4A90E2', end: '#50C9E8' }, // Blue-Cyan
  { start: '#FF6B9D', end: '#FFA7C4' }, // Coral-Pink
  { start: '#FF6B58', end: '#FF8E7A' }, // Orange-Red
] as const

// Category colors
export const CATEGORY_COLORS = {
  surveys: '#FFE5EC',
  videos: '#E0E7FF',
  tasks: '#F3E8FF',
  games: '#E8F0FE',
  offers: '#FEF3E8',
} as const
