# Implementation Plan

- [x] 1. Add minimum withdrawal display to wallet page

  - [x] 1.1 Create withdrawal constants and utility functions


    - Add `lib/utils/withdrawal.ts` with MINIMUM_WITHDRAWAL constant ($5.00) and eligibility calculation
    - Create `calculateAmountNeeded(balance: number): number` function
    - Create `isWithdrawalEligible(balance: number): boolean` function
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ]* 1.2 Write property test for withdrawal eligibility
    - **Property 1: Minimum withdrawal threshold consistency**


    - **Validates: Requirements 1.2, 1.3**
  - [ ] 1.3 Update wallet page with minimum withdrawal section
    - Add withdrawal info card showing $5.00 minimum
    - Display progress bar toward minimum when balance is below threshold

    - Show "amount needed" message when below minimum


    - Enable withdrawal button with visual indication when eligible
    - _Requirements: 1.1, 1.2, 1.3_



- [ ] 2. Update menu with About option and create About page
  - [ ] 2.1 Add About menu item to user layout
    - Add Info icon import from lucide-react
    - Add About item to menuItems array with href '/about'
    - _Requirements: 2.1_

  - [x] 2.2 Create About page


    - Create `app/(user)/about/page.tsx`
    - Add app introduction section
    - Add "How to Earn" section explaining task completion

    - Add "How to Withdraw" section explaining withdrawal process


    - Add support contact section with email (adultflixsite@gmail.com)
    - Use green/white design aesthetic matching existing pages
    - _Requirements: 2.2, 2.3, 2.4_


- [x] 3. Create Settings page

  - [ ] 3.1 Create Settings page component
    - Create `app/(user)/settings/page.tsx`

    - Add notification preferences toggle (UI only for now)
    - Use green/white design aesthetic

    - _Requirements: 3.4, 4.1, 4.2_



- [ ] 4. Create Support page
  - [ ] 4.1 Create Support page component
    - Create `app/(user)/support/page.tsx`

    - Display support email with mailto link (adultflixsite@gmail.com)


    - Add FAQ section with common questions
    - Use green/white design aesthetic
    - _Requirements: 3.5, 5.1, 5.2, 5.3_



- [ ] 5. Create Security page
  - [ ] 5.1 Create Security page component
    - Create `app/(user)/security/page.tsx`
    - Add password change section (UI placeholder)
    - Add account security information
    - Use green/white design aesthetic
    - _Requirements: 3.6, 6.1, 6.2_

- [ ] 6. Create Rewards page
  - [ ] 6.1 Create Rewards page component
    - Create `app/(user)/rewards/page.tsx`
    - Display achievement milestones
    - Show reward tiers and progress
    - Use green/white design aesthetic
    - _Requirements: 3.2, 7.1, 7.2_

- [ ] 7. Create Profile page
  - [ ] 7.1 Create Profile page component
    - Create `app/(user)/profile/page.tsx`
    - Display user account information (name, email)
    - Show account creation date
    - Use green/white design aesthetic
    - _Requirements: 3.3, 8.1, 8.2_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
