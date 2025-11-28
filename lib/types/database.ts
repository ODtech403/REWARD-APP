export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          role: 'user' | 'advertiser' | 'admin'
          wallet_balance: number
          referral_code: string | null
          referred_by: string | null
          referral_count: number
          referral_earnings: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'advertiser' | 'admin'
          wallet_balance?: number
          referral_code?: string | null
          referred_by?: string | null
          referral_count?: number
          referral_earnings?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'advertiser' | 'admin'
          wallet_balance?: number
          referral_code?: string | null
          referred_by?: string | null
          referral_count?: number
          referral_earnings?: number
          created_at?: string
          updated_at?: string
        }
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_id: string
          reward_amount: number
          status: 'pending' | 'completed' | 'rejected'
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_id: string
          reward_amount?: number
          status?: 'pending' | 'completed' | 'rejected'
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_id?: string
          reward_amount?: number
          status?: 'pending' | 'completed' | 'rejected'
          completed_at?: string | null
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          icon_url: string | null
          color: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon_url?: string | null
          color: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon_url?: string | null
          color?: string
          sort_order?: number
          created_at?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          advertiser_id: string
          category_id: string | null
          title: string
          description: string | null
          thumbnail_url: string | null
          promotion_url: string | null
          campaign_type: 'survey' | 'video' | 'task' | 'app_download' | 'website_visit'
          total_budget: number
          spent_amount: number
          cost_per_action: number
          target_completions: number | null
          completed_count: number
          cooldown_seconds: number
          estimated_duration_minutes: number
          max_completions_per_user: number
          difficulty: 'easy' | 'medium' | 'hard'
          status: 'draft' | 'active' | 'paused' | 'depleted' | 'completed'
          gradient_start: string
          gradient_end: string
          created_at: string
          updated_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          advertiser_id: string
          category_id?: string | null
          title: string
          description?: string | null
          thumbnail_url?: string | null
          promotion_url?: string | null
          campaign_type: 'survey' | 'video' | 'task' | 'app_download' | 'website_visit'
          total_budget: number
          spent_amount?: number
          cost_per_action: number
          target_completions?: number | null
          completed_count?: number
          cooldown_seconds?: number
          estimated_duration_minutes?: number
          max_completions_per_user?: number
          difficulty?: 'easy' | 'medium' | 'hard'
          status?: 'draft' | 'active' | 'paused' | 'depleted' | 'completed'
          gradient_start?: string
          gradient_end?: string
          created_at?: string
          updated_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          advertiser_id?: string
          category_id?: string | null
          title?: string
          description?: string | null
          thumbnail_url?: string | null
          promotion_url?: string | null
          campaign_type?: 'survey' | 'video' | 'task' | 'app_download' | 'website_visit'
          total_budget?: number
          spent_amount?: number
          cost_per_action?: number
          target_completions?: number | null
          completed_count?: number
          cooldown_seconds?: number
          estimated_duration_minutes?: number
          max_completions_per_user?: number
          difficulty?: 'easy' | 'medium' | 'hard'
          status?: 'draft' | 'active' | 'paused' | 'depleted' | 'completed'
          gradient_start?: string
          gradient_end?: string
          created_at?: string
          updated_at?: string
          expires_at?: string | null
        }
      }
      task_completions: {
        Row: {
          id: string
          user_id: string
          campaign_id: string
          completed_at: string
          cooldown_ends_at: string
          reward_amount: number
          ip_address: string | null
          device_fingerprint: string | null
        }
        Insert: {
          id?: string
          user_id: string
          campaign_id: string
          completed_at?: string
          cooldown_ends_at: string
          reward_amount: number
          ip_address?: string | null
          device_fingerprint?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          campaign_id?: string
          completed_at?: string
          cooldown_ends_at?: string
          reward_amount?: number
          ip_address?: string | null
          device_fingerprint?: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string | null
          campaign_id: string | null
          transaction_type: 'deposit' | 'withdrawal' | 'reward' | 'campaign_spend' | 'commission'
          amount: number
          balance_after: number
          description: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          campaign_id?: string | null
          transaction_type: 'deposit' | 'withdrawal' | 'reward' | 'campaign_spend' | 'commission'
          amount: number
          balance_after: number
          description?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          campaign_id?: string | null
          transaction_type?: 'deposit' | 'withdrawal' | 'reward' | 'campaign_spend' | 'commission'
          amount?: number
          balance_after?: number
          description?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      deposits: {
        Row: {
          id: string
          advertiser_id: string
          amount: number
          stripe_payment_intent_id: string | null
          status: 'pending' | 'completed' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          advertiser_id: string
          amount: number
          stripe_payment_intent_id?: string | null
          status?: 'pending' | 'completed' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          advertiser_id?: string
          amount?: number
          stripe_payment_intent_id?: string | null
          status?: 'pending' | 'completed' | 'failed'
          created_at?: string
        }
      }
    }
    Functions: Record<string, never>
    Views: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// RPC function types (defined separately for better type inference)
export interface CompleteTaskArgs {
  p_user_id: string
  p_campaign_id: string
  p_ip_address?: string
  p_device_fingerprint?: string
}

export interface CompleteTaskResult {
  success: boolean
  new_balance: number
  cooldown_ends_at: string
  reward_amount: number
  error_message?: string
}
