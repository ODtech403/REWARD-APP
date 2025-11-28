'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Filter } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { CampaignCard } from '@/components/advertiser'
import { useAdvertiserStore } from '@/lib/stores/advertiserStore'
import { createClient } from '@/lib/supabase/client'
import type { Campaign } from '@/lib/types'
import { clsx } from 'clsx'

type FilterStatus = 'all' | 'active' | 'paused' | 'depleted'

export default function CampaignsPage() {
  const { campaigns, setCampaigns } = useAdvertiserStore()
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')

  useEffect(() => {
    const fetchCampaigns = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data } = await supabase
          .from('campaigns')
          .select('*')
          .eq('advertiser_id', user.id)
          .order('created_at', { ascending: false })

        if (data) {
          setCampaigns(data as Campaign[])
        }
      }
      setIsLoading(false)
    }

    fetchCampaigns()
  }, [setCampaigns])

  const filteredCampaigns = filter === 'all' 
    ? campaigns 
    : campaigns.filter(c => c.status === filter)

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
          <h1 className="text-3xl font-bold text-white">Campaigns</h1>
          <p className="text-gray-400 mt-1">Manage all your advertising campaigns</p>
        </div>
        <Link href="/campaigns/new">
          <Button>
            <Plus className="w-4 h-4" />
            Create Campaign
          </Button>
        </Link>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 mb-6"
      >
        <Filter className="w-4 h-4 text-gray-400" />
        {(['all', 'active', 'paused', 'depleted'] as FilterStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
              filter === status
                ? 'bg-purple-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </motion.div>

      {/* Campaigns Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {filteredCampaigns.length === 0 ? (
          <Card variant="glass">
            <CardContent className="py-12 text-center">
              <p className="text-gray-400 mb-4">
                {filter === 'all' 
                  ? 'No campaigns yet' 
                  : `No ${filter} campaigns`}
              </p>
              {filter === 'all' && (
                <Link href="/campaigns/new">
                  <Button>Create Your First Campaign</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCampaigns.map((campaign) => (
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
