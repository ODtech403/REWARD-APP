'use client'

import { motion } from 'framer-motion'
import { Pause, Play, PlusCircle, BarChart3 } from 'lucide-react'
import { clsx } from 'clsx'
import { Card, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import type { Campaign } from '@/lib/types'

export interface CampaignCardProps {
  campaign: Campaign
  onPause: (id: string) => void
  onAddFunds: (id: string) => void
  onViewAnalytics: (id: string) => void
}

/**
 * Calculates the budget progress percentage
 */
export function calculateBudgetProgress(spentAmount: number, totalBudget: number): number {
  if (totalBudget <= 0) return 0
  const progress = (spentAmount / totalBudget) * 100
  return Math.min(Math.max(progress, 0), 100)
}

/**
 * Determines if budget is at warning threshold (80%+)
 */
export function isBudgetWarning(spentAmount: number, totalBudget: number): boolean {
  if (totalBudget <= 0) return false
  return (spentAmount / totalBudget) >= 0.8
}

/**
 * Formats currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function CampaignCard({ campaign, onPause, onAddFunds, onViewAnalytics }: CampaignCardProps) {
  const budgetProgress = calculateBudgetProgress(campaign.spent_amount, campaign.total_budget)
  const isWarning = isBudgetWarning(campaign.spent_amount, campaign.total_budget)
  const isDepleted = campaign.status === 'depleted'
  const isPaused = campaign.status === 'paused'
  const remainingBudget = campaign.total_budget - campaign.spent_amount

  // Determine progress bar color
  const getProgressBarColor = () => {
    if (isDepleted) return 'bg-red-500'
    if (isWarning) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <Card variant="glass" className="w-full">
      <CardContent className="pt-6">
        {/* Header with title and status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">
              {campaign.title}
            </h3>
            <p className="text-sm text-gray-400 mt-1 capitalize">
              {campaign.campaign_type.replace('_', ' ')}
            </p>
          </div>
          <StatusBadge status={campaign.status} className="ml-3 flex-shrink-0" />
        </div>

        {/* Budget Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Budget</span>
            <span className={clsx(
              'font-medium',
              isDepleted ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-gray-300'
            )}>
              {formatCurrency(campaign.spent_amount)} / {formatCurrency(campaign.total_budget)}
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className={clsx('h-full rounded-full', getProgressBarColor())}
              initial={{ width: 0 }}
              animate={{ width: `${budgetProgress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          {isWarning && !isDepleted && (
            <p className="text-xs text-yellow-400 mt-1">
              ⚠️ Budget running low ({formatCurrency(remainingBudget)} remaining)
            </p>
          )}
          {isDepleted && (
            <p className="text-xs text-red-400 mt-1">
              Budget depleted - Add funds to reactivate
            </p>
          )}
        </div>

        {/* Completion Stats */}
        <div className="flex items-center justify-between py-3 px-4 bg-white/5 rounded-xl">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{campaign.completed_count}</p>
            <p className="text-xs text-gray-400">Completions</p>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{formatCurrency(campaign.cost_per_action)}</p>
            <p className="text-xs text-gray-400">CPA</p>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              {Math.round(budgetProgress)}%
            </p>
            <p className="text-xs text-gray-400">Spent</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        {/* Pause/Resume Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPause(campaign.id)}
          disabled={isDepleted}
          className="flex-1"
        >
          {isPaused ? (
            <>
              <Play className="w-4 h-4" />
              Resume
            </>
          ) : (
            <>
              <Pause className="w-4 h-4" />
              Pause
            </>
          )}
        </Button>

        {/* Add Funds Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onAddFunds(campaign.id)}
          className="flex-1"
        >
          <PlusCircle className="w-4 h-4" />
          Add Funds
        </Button>

        {/* Analytics Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewAnalytics(campaign.id)}
          className="flex-1"
        >
          <BarChart3 className="w-4 h-4" />
          Analytics
        </Button>
      </CardFooter>
    </Card>
  )
}
