'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { CampaignWizard } from '@/components/advertiser'
import { useAdvertiserStore } from '@/lib/stores/advertiserStore'
import { createClient } from '@/lib/supabase/client'
import type { CampaignDraft, Category } from '@/lib/types'

export default function NewCampaignPage() {
  const router = useRouter()
  const { walletBalance, setBalance, addCampaign } = useAdvertiserStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order')
      
      if (data) {
        setCategories(data as Category[])
      }
    }

    fetchCategories()
  }, [])

  const handleComplete = async (draft: CampaignDraft) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: draft.title,
          description: draft.description,
          categoryId: draft.categoryId || undefined,
          campaignType: draft.campaignType,
          totalBudget: draft.totalBudget,
          costPerAction: draft.costPerAction,
          cooldownSeconds: draft.cooldownSeconds,
          estimatedDurationMinutes: draft.estimatedDurationMinutes,
          maxCompletionsPerUser: draft.maxCompletionsPerUser,
          thumbnailUrl: draft.thumbnailUrl,
          gradientStart: draft.gradientStart,
          gradientEnd: draft.gradientEnd,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create campaign')
      }

      // Update local state
      setBalance(data.newBalance)
      
      // Add campaign to store (fetch full campaign data)
      const supabase = createClient()
      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', data.campaign.id)
        .single()

      if (campaignData) {
        addCampaign(campaignData)
      }

      // Redirect to campaign detail page
      router.push(`/campaigns/${data.campaign.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/campaigns')
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
        <h1 className="text-3xl font-bold text-white">Create New Campaign</h1>
        <p className="text-gray-400 mt-2">
          Set up your campaign to reach users and drive completions
        </p>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl"
        >
          <p className="text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Campaign Wizard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {isSubmitting ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4" />
            <p className="text-gray-400">Creating your campaign...</p>
          </div>
        ) : (
          <CampaignWizard
            onComplete={handleComplete}
            onCancel={handleCancel}
            advertiserBalance={walletBalance}
            categories={categories.map(c => ({ id: c.id, name: c.name }))}
          />
        )}
      </motion.div>
    </div>
  )
}
