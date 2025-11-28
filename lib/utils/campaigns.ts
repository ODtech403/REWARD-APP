import type { Campaign } from '@/lib/types'

/**
 * Campaign visibility utility functions
 * Filters campaigns based on visibility rules for users
 * Requirements: 9.6, 10.3
 */

/**
 * Checks if a campaign has sufficient remaining budget for at least one completion
 */
export function hasSufficientBudget(campaign: Campaign): boolean {
  const remainingBudget = campaign.total_budget - campaign.spent_amount
  return remainingBudget >= campaign.cost_per_action
}

/**
 * Checks if a campaign has expired based on its expires_at timestamp
 */
export function isExpired(campaign: Campaign, currentTime: Date = new Date()): boolean {
  if (!campaign.expires_at) {
    return false
  }
  return new Date(campaign.expires_at) < currentTime
}

/**
 * Checks if a campaign is visible to users
 * A campaign is visible if:
 * - Status is 'active'
 * - Has sufficient remaining budget (>= cost_per_action)
 * - Has not expired
 * 
 * Requirements: 9.6, 10.3
 */
export function isCampaignVisible(campaign: Campaign, currentTime: Date = new Date()): boolean {
  // Must be active status
  if (campaign.status !== 'active') {
    return false
  }

  // Must have sufficient budget for at least one completion
  if (!hasSufficientBudget(campaign)) {
    return false
  }

  // Must not be expired
  if (isExpired(campaign, currentTime)) {
    return false
  }

  return true
}

/**
 * Filters an array of campaigns to return only those visible to users
 * Excludes: depleted, paused, expired, and campaigns with insufficient budget
 * 
 * Requirements: 9.6, 10.3
 */
export function filterVisibleCampaigns(
  campaigns: Campaign[],
  currentTime: Date = new Date()
): Campaign[] {
  return campaigns.filter(campaign => isCampaignVisible(campaign, currentTime))
}

/**
 * Checks if a campaign should display a budget warning (80% spent)
 * Requirements: 8.3
 */
export function shouldShowBudgetWarning(campaign: Campaign): boolean {
  if (campaign.total_budget <= 0) {
    return false
  }
  const spentPercentage = campaign.spent_amount / campaign.total_budget
  return spentPercentage >= 0.8
}

/**
 * Checks if a campaign is depleted (insufficient budget for next completion)
 * Requirements: 8.4, 10.3
 */
export function isCampaignDepleted(campaign: Campaign): boolean {
  return !hasSufficientBudget(campaign)
}

/**
 * Calculates the remaining budget for a campaign
 */
export function getRemainingBudget(campaign: Campaign): number {
  return campaign.total_budget - campaign.spent_amount
}

/**
 * Calculates the budget spent percentage
 */
export function getBudgetSpentPercentage(campaign: Campaign): number {
  if (campaign.total_budget <= 0) {
    return 0
  }
  return (campaign.spent_amount / campaign.total_budget) * 100
}

/**
 * Calculates estimated remaining completions based on remaining budget
 */
export function getEstimatedRemainingCompletions(campaign: Campaign): number {
  const remaining = getRemainingBudget(campaign)
  if (remaining <= 0 || campaign.cost_per_action <= 0) {
    return 0
  }
  return Math.floor(remaining / campaign.cost_per_action)
}
