/**
 * Withdrawal utility functions and constants
 */

export const MINIMUM_WITHDRAWAL = 5.00
export const SUPPORT_EMAIL = 'adultflixsite@gmail.com'

/**
 * Calculate the amount needed to reach minimum withdrawal threshold
 * @param balance - Current wallet balance
 * @returns Amount needed to reach minimum, or 0 if already eligible
 */
export function calculateAmountNeeded(balance: number): number {
  if (balance >= MINIMUM_WITHDRAWAL) {
    return 0
  }
  return Math.max(0, MINIMUM_WITHDRAWAL - balance)
}

/**
 * Check if a balance is eligible for withdrawal
 * @param balance - Current wallet balance
 * @returns true if balance meets or exceeds minimum withdrawal amount
 */
export function isWithdrawalEligible(balance: number): boolean {
  return balance >= MINIMUM_WITHDRAWAL
}

/**
 * Calculate withdrawal progress percentage
 * @param balance - Current wallet balance
 * @returns Progress percentage (0-100)
 */
export function calculateWithdrawalProgress(balance: number): number {
  if (balance >= MINIMUM_WITHDRAWAL) {
    return 100
  }
  return Math.min(100, (balance / MINIMUM_WITHDRAWAL) * 100)
}
