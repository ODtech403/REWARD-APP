'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Pause, Play, PlusCircle, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, calculateBudgetProgress, isBudgetWarning } from '@/components/advertiser'
import type { Campaign } from '@/lib/types'
import { clsx } from 'clsx'

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showAddFundsModal, setShowAddFundsModal] = useState(false)
  const [addFundsAmount, setAddFundsAmount] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fetchCampaign = useCallback(async () => {
    const campaignId = params.id as string
    if (!campaignId) {
      router.push('/campaigns')
      return
    }

    const supabase = createClient()
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (data) {
      setCampaign(data as Campaign)
    } else {
      router.push('/campaigns')
    }
    setIsLoading(false)
  }, [params.id, router])

  useEffect(() => {
    fetchCampaign()
  }, [fetchCampaign])

  const handlePauseResume = async () => {
    if (!campaign) return
    setIsUpdating(true)
    setError(null)

    try {
      const newStatus = campaign.status === 'paused' ? 'active' : 'paused'
      const response = await fetch('/api/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          action: 'toggle_status',
          status: newStatus,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        setError(result.error?.message || 'Failed to update campaign')
        return
      }

      setCampaign(prev => prev ? { ...prev, status: newStatus } : null)
    } catch {
      setError('Failed to update campaign')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddFunds = async () => {
    if (!campaign) return
    const amount = parseFloat(addFundsAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setIsUpdating(true)
    setError(null)

    try {
      const response = await fetch('/api/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          action: 'add_funds',
          amount,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        setError(result.error?.message || 'Failed to add funds')
        return
      }

      // Refresh campaign data
      await fetchCampaign()
      setShowAddFundsModal(false)
      setAddFundsAmount('')
    } catch {
      setError('Failed to add funds')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading || !campaign) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
      </div>
    )
  }

  const budgetProgress = calculateBudgetProgress(campaign.spent_amount, campaign.total_budget)
  const isWarning = isBudgetWarning(campaign.spent_amount, campaign.total_budget)
  const isDepleted = campaign.status === 'depleted'
  const isPaused = campaign.status === 'paused'
  const remainingBudget = campaign.total_budget - campaign.spent_amount

  const getProgressBarColor = () => {
    if (isDepleted) return 'bg-red-500'
    if (isWarning) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{campaign.title}</h1>
              <StatusBadge status={campaign.status} />
            </div>
            <p className="text-gray-400 mt-2 capitalize">
              {campaign.campaign_type.replace('_', ' ')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              disabled={isDepleted || isUpdating}
              onClick={handlePauseResume}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button 
              variant="secondary"
              onClick={() => setShowAddFundsModal(true)}
              disabled={isUpdating}
            >
              <PlusCircle className="w-4 h-4" />
              Add Funds
            </Button>
            <Button variant="ghost">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      >
        <Card variant="glass">
          <CardContent className="py-4">
            <p className="text-sm text-gray-400">Total Budget</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(campaign.total_budget)}</p>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="py-4">
            <p className="text-sm text-gray-400">Spent</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(campaign.spent_amount)}</p>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="py-4">
            <p className="text-sm text-gray-400">Remaining</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(remainingBudget)}</p>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="py-4">
            <p className="text-sm text-gray-400">Completions</p>
            <p className="text-2xl font-bold text-white">{campaign.completed_count}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Budget Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <Card variant="glass">
          <CardContent className="py-6">
            <h2 className="text-lg font-semibold text-white mb-4">Budget Progress</h2>
            <div className="h-4 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className={clsx('h-full rounded-full', getProgressBarColor())}
                initial={{ width: 0 }}
                animate={{ width: `${budgetProgress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-gray-400">{Math.round(budgetProgress)}% spent</span>
              <span className={clsx(
                isDepleted ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-gray-400'
              )}>
                {formatCurrency(remainingBudget)} remaining
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400"
        >
          {error}
        </motion.div>
      )}

      {/* Campaign Monitor - Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <Card variant="glass">
          <CardContent className="py-6">
            <h2 className="text-lg font-semibold text-white mb-4">Campaign Preview</h2>
            <p className="text-gray-400 text-sm mb-4">This is how your campaign appears to users</p>
            
            <div className="flex gap-6">
              {/* Card Preview */}
              <div 
                className="w-48 aspect-[3/4] rounded-[18px] overflow-hidden relative flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${campaign.gradient_start} 0%, ${campaign.gradient_end} 100%)`,
                }}
              >
                {campaign.thumbnail_url && (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${campaign.thumbnail_url})` }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-0 p-3 flex flex-col justify-end">
                  <div className="absolute top-2 left-2 bg-green-500/90 rounded-full px-2 py-0.5">
                    <span className="text-white text-xs font-bold">
                      ${(campaign.cost_per_action * 0.75).toFixed(2)}
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-sm leading-tight mb-1">{campaign.title}</h3>
                  <p className="text-white/80 text-xs line-clamp-2">
                    {campaign.description || 'Complete this task to earn rewards!'}
                  </p>
                </div>
              </div>
              
              {/* Campaign Info */}
              <div className="flex-1 space-y-3">
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-xs">Type</p>
                  <p className="text-white font-medium capitalize">{campaign.campaign_type.replace('_', ' ')}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-xs">User Reward</p>
                  <p className="text-green-400 font-bold">${(campaign.cost_per_action * 0.75).toFixed(4)}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-xs">Status</p>
                  <p className={clsx(
                    'font-medium capitalize',
                    campaign.status === 'active' ? 'text-green-400' :
                    campaign.status === 'paused' ? 'text-yellow-400' :
                    campaign.status === 'depleted' ? 'text-red-400' : 'text-gray-400'
                  )}>{campaign.status}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Campaign Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card variant="glass">
          <CardContent className="py-6">
            <h2 className="text-lg font-semibold text-white mb-4">Campaign Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <DetailItem label="Campaign Type" value={campaign.campaign_type.replace('_', ' ')} />
              <DetailItem label="Cost Per Action" value={formatCurrency(campaign.cost_per_action)} />
              <DetailItem label="User Reward" value={formatCurrency(campaign.cost_per_action * 0.75)} />
              <DetailItem label="Cooldown Period" value={`${Math.round(campaign.cooldown_seconds / 60)} minutes`} />
              <DetailItem label="Est. Duration" value={`${campaign.estimated_duration_minutes} minutes`} />
              <DetailItem label="Difficulty" value={campaign.difficulty} />
              <DetailItem label="Max Per User" value={`${campaign.max_completions_per_user} time${campaign.max_completions_per_user > 1 ? 's' : ''}`} />
              <DetailItem label="Created" value={new Date(campaign.created_at).toLocaleDateString()} />
              {campaign.expires_at && (
                <DetailItem label="Expires" value={new Date(campaign.expires_at).toLocaleDateString()} />
              )}
            </div>
            
            {/* Promotion URL */}
            {campaign.promotion_url && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm text-gray-400 mb-2">Promotion URL</p>
                <a 
                  href={campaign.promotion_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 break-all"
                >
                  {campaign.promotion_url}
                </a>
              </div>
            )}
            
            {campaign.description && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm text-gray-400 mb-2">Description</p>
                <p className="text-white">{campaign.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Funds Modal */}
      <Modal
        isOpen={showAddFundsModal}
        onClose={() => {
          setShowAddFundsModal(false)
          setAddFundsAmount('')
          setError(null)
        }}
        title="Add Funds to Campaign"
      >
        <div className="space-y-4">
          <p className="text-gray-400">
            Add additional budget to this campaign. Funds will be deducted from your wallet.
          </p>
          <Input
            type="number"
            placeholder="Enter amount"
            value={addFundsAmount}
            onChange={(e) => setAddFundsAmount(e.target.value)}
            min="1"
            step="0.01"
          />
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setShowAddFundsModal(false)
                setAddFundsAmount('')
                setError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddFunds}
              disabled={isUpdating || !addFundsAmount}
            >
              {isUpdating ? 'Adding...' : 'Add Funds'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-white font-medium capitalize">{value}</p>
    </div>
  )
}
