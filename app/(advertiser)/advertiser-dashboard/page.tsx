'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, TrendingUp, Users, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { CampaignCard } from '@/components/advertiser'
import { useAdvertiserStore } from '@/lib/stores/advertiserStore'
import { createClient } from '@/lib/supabase/client'
import type { Campaign } from '@/lib/types'

export default function AdvertiserDashboardPage() {
  const { walletBalance, campaigns, setCampaigns } = useAdvertiserStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          console.error('Auth error:', authError)
          setIsLoading(false)
          return
        }
        
        if (user) {
          const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('advertiser_id', user.id)
            .order('created_at', { ascending: false })

          if (error) {
            console.error('Error fetching campaigns:', error)
          } else if (data) {
            setCampaigns(data as Campaign[])
          }
        }
      } catch (error) {
        console.error('Error in fetchCampaigns:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCampaigns()
  }, [setCampaigns])

  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent_amount, 0)
  const totalCompletions = campaigns.reduce((sum, c) => sum + c.completed_count, 0)
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length

  // Sort campaigns: active first, then by budget (higher first), expired/depleted at bottom
  const sortedCampaigns = [...campaigns].sort((a, b) => {
    // Status priority: active > paused > draft > depleted > completed
    const statusPriority: Record<string, number> = {
      active: 0,
      paused: 1,
      draft: 2,
      depleted: 3,
      completed: 4,
    }
    const statusDiff = (statusPriority[a.status] || 5) - (statusPriority[b.status] || 5)
    if (statusDiff !== 0) return statusDiff
    
    // Within same status, sort by remaining budget (higher first)
    const aRemaining = a.total_budget - a.spent_amount
    const bRemaining = b.total_budget - b.spent_amount
    return bRemaining - aRemaining
  })

  const handlePause = (id: string) => {
    console.log('Pause campaign:', id)
  }

  const handleAddFunds = (id: string) => {
    console.log('Add funds to campaign:', id)
  }

  const handleViewAnalytics = (id: string) => {
    console.log('View analytics for campaign:', id)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Manage your campaigns and track performance</p>
        </div>
        <Link href="/campaigns/new">
          <Button>
            <Plus className="w-4 h-4" />
            Create Campaign
          </Button>
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      >
        <StatCard
          icon={DollarSign}
          label="Wallet Balance"
          value={`$${walletBalance.toFixed(2)}`}
          color="purple"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Spent"
          value={`$${totalSpent.toFixed(2)}`}
          color="blue"
        />
        <StatCard
          icon={Users}
          label="Total Completions"
          value={totalCompletions.toLocaleString()}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Active Campaigns"
          value={activeCampaigns.toString()}
          color="orange"
        />
      </motion.div>

      {/* Campaigns */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold text-white mb-4">Your Campaigns</h2>
        {campaigns.length === 0 ? (
          <Card variant="glass">
            <CardContent className="py-12 text-center">
              <p className="text-gray-400 mb-4">No campaigns yet</p>
              <Link href="/campaigns/new">
                <Button>Create Your First Campaign</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onPause={handlePause}
                onAddFunds={handleAddFunds}
                onViewAnalytics={handleViewAnalytics}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  color: 'purple' | 'blue' | 'green' | 'orange'
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colors = {
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
    green: 'from-green-500/20 to-green-500/5 border-green-500/30',
    orange: 'from-orange-500/20 to-orange-500/5 border-orange-500/30',
  }

  return (
    <Card variant="glass" className={`bg-gradient-to-br ${colors[color]}`}>
      <CardContent className="py-4">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-400">{label}</span>
        </div>
        <p className="text-2xl font-bold text-white mt-2">{value}</p>
      </CardContent>
    </Card>
  )
}
