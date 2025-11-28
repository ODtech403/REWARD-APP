'use client'

import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { AlertTriangle, XCircle } from 'lucide-react'

export interface BudgetProgressProps {
  /** Amount spent from the budget */
  spentAmount: number
  /** Total budget amount */
  totalBudget: number
  /** Cost per action - used to determine if budget is depleted */
  costPerAction?: number
  /** Whether to show the percentage label */
  showPercentage?: boolean
  /** Whether to show the amount labels */
  showAmounts?: boolean
  /** Whether to show warning/depleted messages */
  showMessages?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Additional class names */
  className?: string
}

/**
 * Calculates the budget progress percentage (0-100)
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
 * Determines if budget is depleted (remaining < costPerAction)
 */
export function isBudgetDepleted(spentAmount: number, totalBudget: number, costPerAction: number): boolean {
  if (totalBudget <= 0) return true
  const remaining = totalBudget - spentAmount
  return remaining < costPerAction
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

/**
 * BudgetProgress - A reusable component for displaying budget progress
 * with warning and depleted states.
 * 
 * Requirements: 8.3, 8.4
 * - Displays warning color at 80% threshold
 * - Displays depleted state when budget exhausted
 */
export function BudgetProgress({
  spentAmount,
  totalBudget,
  costPerAction = 0,
  showPercentage = true,
  showAmounts = true,
  showMessages = true,
  size = 'md',
  className,
}: BudgetProgressProps) {
  const progress = calculateBudgetProgress(spentAmount, totalBudget)
  const isWarning = isBudgetWarning(spentAmount, totalBudget)
  const isDepleted = costPerAction > 0 
    ? isBudgetDepleted(spentAmount, totalBudget, costPerAction)
    : spentAmount >= totalBudget
  const remainingBudget = Math.max(totalBudget - spentAmount, 0)

  // Size configurations
  const sizeConfig = {
    sm: {
      barHeight: 'h-1.5',
      textSize: 'text-xs',
      messageSize: 'text-xs',
      iconSize: 'w-3 h-3',
    },
    md: {
      barHeight: 'h-2',
      textSize: 'text-sm',
      messageSize: 'text-xs',
      iconSize: 'w-4 h-4',
    },
    lg: {
      barHeight: 'h-3',
      textSize: 'text-base',
      messageSize: 'text-sm',
      iconSize: 'w-5 h-5',
    },
  }

  const config = sizeConfig[size]

  // Determine progress bar color based on state
  const getProgressBarColor = () => {
    if (isDepleted) return 'bg-red-500'
    if (isWarning) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  // Determine text color based on state
  const getTextColor = () => {
    if (isDepleted) return 'text-red-400'
    if (isWarning) return 'text-yellow-400'
    return 'text-gray-300'
  }

  return (
    <div className={clsx('w-full', className)}>
      {/* Header with amounts and percentage */}
      {(showAmounts || showPercentage) && (
        <div className={clsx('flex items-center justify-between mb-2', config.textSize)}>
          {showAmounts && (
            <span className="text-gray-400">
              {formatCurrency(spentAmount)} / {formatCurrency(totalBudget)}
            </span>
          )}
          {showPercentage && (
            <span className={clsx('font-medium', getTextColor())}>
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className={clsx('bg-white/10 rounded-full overflow-hidden', config.barHeight)}>
        <motion.div
          className={clsx('h-full rounded-full', getProgressBarColor())}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Warning/Depleted Messages */}
      {showMessages && (
        <>
          {isWarning && !isDepleted && (
            <div className={clsx('flex items-center gap-1 mt-1.5', config.messageSize, 'text-yellow-400')}>
              <AlertTriangle className={config.iconSize} />
              <span>Budget running low ({formatCurrency(remainingBudget)} remaining)</span>
            </div>
          )}
          {isDepleted && (
            <div className={clsx('flex items-center gap-1 mt-1.5', config.messageSize, 'text-red-400')}>
              <XCircle className={config.iconSize} />
              <span>Budget depleted - Add funds to reactivate</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
