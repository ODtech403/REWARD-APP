import { describe, test, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  getInitialProfileState,
  isValidRegistrationInput,
  type RegistrationInput,
  type UserRole,
} from '@/lib/utils/registration'

/**
 * **Feature: gamified-task-app, Property 1: User Registration Initializes Correct State**
 * **Validates: Requirements 1.1**
 * 
 * Property: For any valid registration credentials, when a user account is created,
 * the resulting profile SHALL have role='user' (when no role specified) and wallet_balance=0.
 */
describe('Property 1: User Registration Initializes Correct State', () => {
  // Generator for valid email addresses
  const emailArb = fc.tuple(
    fc.stringMatching(/^[a-zA-Z0-9._-]+$/),
    fc.stringMatching(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
  ).map(([local, domain]) => `${local}@${domain}`)
    .filter(email => email.length > 3 && email.includes('@'))

  // Generator for valid user roles (excluding admin for normal registration)
  const userRoleArb = fc.constantFrom<UserRole>('user', 'advertiser')

  // Generator for valid registration input without explicit role
  const registrationInputWithoutRoleArb = fc.record({
    email: emailArb,
    displayName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  })

  // Generator for valid registration input with explicit role
  const registrationInputWithRoleArb = fc.record({
    email: emailArb,
    displayName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    role: userRoleArb,
  })

  test('wallet balance is always initialized to 0 for any valid registration', () => {
    fc.assert(
      fc.property(registrationInputWithRoleArb, (input: RegistrationInput) => {
        const profileState = getInitialProfileState(input)
        
        // Property: wallet_balance SHALL always be 0 for new registrations
        expect(profileState.walletBalance).toBe(0)
      }),
      { numRuns: 100 }
    )
  })

  test('role defaults to "user" when no role is specified', () => {
    fc.assert(
      fc.property(registrationInputWithoutRoleArb, (input: RegistrationInput) => {
        const profileState = getInitialProfileState(input)
        
        // Property: role SHALL default to 'user' when not specified
        expect(profileState.role).toBe('user')
      }),
      { numRuns: 100 }
    )
  })

  test('role is preserved when explicitly specified', () => {
    fc.assert(
      fc.property(registrationInputWithRoleArb, (input: RegistrationInput) => {
        const profileState = getInitialProfileState(input)
        
        // Property: role SHALL match the specified role
        expect(profileState.role).toBe(input.role)
      }),
      { numRuns: 100 }
    )
  })

  test('combined property: valid registration always produces correct initial state', () => {
    fc.assert(
      fc.property(
        fc.oneof(registrationInputWithoutRoleArb, registrationInputWithRoleArb),
        (input: RegistrationInput) => {
          // Only test valid inputs
          fc.pre(isValidRegistrationInput(input))
          
          const profileState = getInitialProfileState(input)
          
          // Combined property assertions:
          // 1. wallet_balance is always 0
          expect(profileState.walletBalance).toBe(0)
          
          // 2. role is 'user' if not specified, otherwise matches input
          const expectedRole = input.role ?? 'user'
          expect(profileState.role).toBe(expectedRole)
          
          // 3. role is always a valid role type
          expect(['user', 'advertiser', 'admin']).toContain(profileState.role)
        }
      ),
      { numRuns: 100 }
    )
  })
})
