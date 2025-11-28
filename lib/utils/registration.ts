/**
 * Registration utilities for user profile initialization
 * These functions encapsulate the business logic for creating user profiles
 */

export type UserRole = 'user' | 'advertiser' | 'admin'

export interface RegistrationInput {
  email: string
  displayName?: string
  role?: UserRole
}

export interface ProfileInitState {
  role: UserRole
  walletBalance: number
}

/**
 * Determines the initial profile state for a new user registration.
 * This mirrors the database trigger logic in handle_new_user().
 * 
 * Per Requirements 1.1: When a user submits valid registration credentials,
 * the system creates a new user account with role='user' and wallet_balance=0.
 * 
 * @param input - Registration input containing optional role
 * @returns The initial profile state with role and wallet balance
 */
export function getInitialProfileState(input: RegistrationInput): ProfileInitState {
  return {
    role: input.role ?? 'user',
    walletBalance: 0,
  }
}

/**
 * Validates that a registration input has valid credentials
 * @param input - Registration input to validate
 * @returns true if the input is valid
 */
export function isValidRegistrationInput(input: RegistrationInput): boolean {
  // Email must be non-empty and contain @
  if (!input.email || !input.email.includes('@')) {
    return false
  }
  
  // Role must be valid if provided
  if (input.role && !['user', 'advertiser', 'admin'].includes(input.role)) {
    return false
  }
  
  return true
}
