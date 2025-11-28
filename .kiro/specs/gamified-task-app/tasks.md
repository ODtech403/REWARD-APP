# Implementation Plan

- [x] 1. Set up project foundation and Supabase configuration







  - [x] 1.1 Configure Supabase client utilities

    - Create `lib/supabase/client.ts` for browser client
    - Create `lib/supabase/server.ts` for server components
    - Create `lib/supabase/middleware.ts` for auth middleware
    - Set up environment variables for Supabase URL and keys


    - _Requirements: 1.1, 1.2, 7.1_

  - [x] 1.2 Create database schema in Supabase

    - Create profiles table extending auth.users
    - Create categories, campaigns, task_completions, transactions, deposits tables

    - Set up Row Level Security policies for each table
    - Create indexes for performance optimization
    - _Requirements: All data persistence requirements_



  - [x] 1.3 Create TypeScript types and interfaces

    - Create `lib/types/index.ts` with all data model types


    - Create `lib/types/api.ts` for API request/response types
    - _Requirements: All requirements_

- [x] 2. Implement authentication system



  - [x] 2.1 Create auth layout and pages

    - Create `app/(auth)/layout.tsx` with centered card layout
    - Create `app/(auth)/login/page.tsx` with email/password form
    - Create `app/(auth)/register/page.tsx` with role selection (user/advertiser)

    - Style with dark theme and gradient accents
    - _Requirements: 1.1, 1.2, 7.1_
  - [x] 2.2 Write property test for user registration state






    - **Property 1: User Registration Initializes Correct State**
    - **Validates: Requirements 1.1**
  - [ ] 2.3 Write property test for advertiser registration state







    - **Property 6: Advertiser Registration Initializes Correct State**
    - **Validates: Requirements 7.1, 7.3**

  - [x] 2.4 Create auth middleware for route protection








    - Create Next.js middleware for session validation
    - Implement role-based route protection




    - Redirect unauthenticated users to login
    - Redirect users to correct dashboard based on role
    - _Requirements: 1.4, 7.2, 7.4_
  - [ ]* 2.5 Write property test for role-based authorization
    - **Property 7: Role-Based Route Authorization**




    - **Validates: Requirements 7.4**


- [x] 3. Implement core UI components








  - [x] 3.1 Create base UI components

    - Create `components/ui/Button.tsx` with variants (primary, secondary, ghost)


    - Create `components/ui/Card.tsx` with glassmorphic styling


    - Create `components/ui/Input.tsx` with dark theme styling
    - Create `components/ui/Badge.tsx` for status indicators




    - Create `components/ui/Modal.tsx` for dialogs
    - _Requirements: 14.1, 14.2_
  - [x] 3.2 Create shared layout components

    - Create `components/shared/Header.tsx` with wallet balance display
    - Create `components/shared/Navigation.tsx` bottom nav for mobile
    - Create `components/shared/LoadingSkeleton.tsx` with shimmer effect
    - _Requirements: 2.1, 14.1_


- [x] 4. Implement Zustand stores





  - [x] 4.1 Create user store

    - Create `lib/stores/userStore.ts` with user state, balance, cooldowns
    - Implement actions: setUser, updateBalance, setCooldown, clearCooldown
    - Implement selector: isTaskOnCooldown
    - _Requirements: 5.1, 5.3, 5.5_

  - [x] 4.2 Create task store
    - Create `lib/stores/taskStore.ts` with tasks, categories, filters
    - Implement actions: setTasks, setSelectedCategory
    - Implement selector: getAvailableTasks (filters by cooldown and campaign status)

    - _Requirements: 2.4, 3.2, 3.3_
  - [x] 4.3 Create advertiser store
    - Create `lib/stores/advertiserStore.ts` with campaigns, wallet
    - Implement actions: setCampaigns, updateCampaign, updateBalance
    - _Requirements: 8.1, 8.2_

- [x] 5. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement user dashboard





  - [x] 6.1 Create category scroll component


    - Create `components/user/CategoryScroll.tsx` with horizontal scroll
    - Implement circular category icons with pastel backgrounds
    - Add smooth momentum scrolling with hidden scrollbar
    - Style labels below circles
    - _Requirements: 2.3, 2.5_

  - [x] 6.2 Create task card component

    - Create `components/user/TaskCard.tsx` with gradient overlay design
    - Implement 3:4 aspect ratio with 18px border radius
    - Display title, reward, description, rating with white text
    - Add text shadows for readability
    - Implement hover scale and shadow effects with Framer Motion
    - _Requirements: 3.1, 3.2, 3.4, 3.5_
  - [ ]* 6.3 Write property test for task card rendering
    - **Property 2: Task Card Rendering Contains Required Fields**
    - **Validates: Requirements 3.1**
  - [x] 6.4 Create cooldown timer component


    - Create `components/user/CooldownTimer.tsx` with live countdown
    - Format as HH:MM:SS or MM:SS based on remaining time
    - Trigger onExpire callback when timer reaches zero

    - _Requirements: 5.2_
  - [x] 6.5 Create task card with cooldown state

    - Extend TaskCard to show lock icon and grayscale when on cooldown
    - Overlay countdown timer on locked cards
    - Disable interaction for cooldown cards
    - _Requirements: 3.3, 5.4_
  - [ ]* 6.6 Write property test for cooldown availability logic
    - **Property 3: Cooldown State Determines Task Availability**
    - **Validates: Requirements 3.3, 5.3, 5.5**

  - [x] 6.7 Create task grid component

    - Create `components/user/TaskGrid.tsx` with 2-column responsive grid
    - Implement 12px gaps and 16px padding
    - Filter tasks by selected category
    - _Requirements: 2.4, 14.1_

  - [x] 6.8 Create wallet header component

    - Create `components/user/WalletHeader.tsx` with balance display
    - Show coin icon with animated balance updates
    - Style with gradient background
    - _Requirements: 2.1_

  - [x] 6.9 Assemble user dashboard page

    - Create `app/(user)/dashboard/page.tsx`
    - Compose WalletHeader, CategoryScroll, TaskGrid
    - Fetch tasks and categories from Supabase
    - Initialize cooldown states from database
    - _Requirements: 2.1, 2.3, 2.4_

- [x] 7. Implement mascot and animations





  - [x] 7.1 Create mascot component


    - Create `components/user/Mascot.tsx` with state-based animations
    - Implement idle state with bobbing animation using Framer Motion
    - Implement celebrating state with bounce animation
    - Implement pointing state with arm gesture
    - Implement sleeping state for all-cooldown scenario
    - _Requirements: 6.1, 6.2, 6.3, 6.4_


  - [x] 7.2 Create reward animation components




    - Create `components/user/RewardAnimation.tsx` for coin fly effect
    - Create `components/user/ConfettiCelebration.tsx` for task completion
    - Use Framer Motion for smooth 60fps animations
    - _Requirements: 4.3, 6.5_


  - [x] 7.3 Integrate mascot into dashboard

    - Add Mascot component to dashboard layout
    - Connect mascot state to task store (available tasks, completions)
    - Trigger celebration on task completion
    - _Requirements: 2.2, 6.1-6.5_


- [x] 8. Implement task completion flow

  - [x] 8.1 Create task detail page


    - Create `app/(user)/task/[id]/page.tsx`
    - Display task instructions and requirements
    - Show estimated duration and reward
    - Add start task button
    - _Requirements: 4.1_
  - [x] 8.2 Create task completion API route


    - Create `app/api/tasks/complete/route.ts`
    - Validate user authentication and task availability
    - Check cooldown status before allowing completion
    - Verify minimum time spent on task
    - _Requirements: 4.2, 13.1, 13.3_
  - [ ]* 8.3 Write property test for minimum time validation
    - **Property 17: Minimum Time Validation**
    - **Validates: Requirements 13.1**
  - [ ]* 8.4 Write property test for cooldown prevents duplicate
    - **Property 19: Cooldown Prevents Duplicate Completion**
    - **Validates: Requirements 13.3**
  - [x] 8.5 Create Supabase RPC for atomic task completion

    - Create `complete_task` function in Supabase
    - Atomically: deduct from campaign, credit user, create completion record, log transactions
    - Calculate user reward as CPA * 0.75
    - Set cooldown_ends_at as NOW() + cooldown_seconds
    - Return new balance and cooldown end time
    - _Requirements: 4.2, 4.4, 10.1, 11.1, 11.2, 11.3_
  - [ ]* 8.6 Write property test for task completion rewards
    - **Property 4: Task Completion Credits Correct Reward**
    - **Validates: Requirements 4.2, 10.1, 11.1, 11.2, 11.3**
  - [ ]* 8.7 Write property test for cooldown timestamp calculation
    - **Property 5: Cooldown Timestamp Calculation**
    - **Validates: Requirements 4.4, 5.1**
  - [ ]* 8.8 Write property test for completion logging
    - **Property 18: Completion Logging**
    - **Validates: Requirements 13.2**

  - [x] 8.9 Implement completion success flow

    - Update user store with new balance
    - Set cooldown in store
    - Trigger confetti celebration
    - Animate coin flying to wallet
    - Navigate back to dashboard
    - _Requirements: 4.2, 4.3, 4.4_

- [x] 9. Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement advertiser dashboard
  - [ ] 10.1 Create advertiser layout
    - Create `app/(advertiser)/layout.tsx` with sidebar navigation
    - Include wallet balance in header
    - Add navigation links: Dashboard, Campaigns, Wallet
    - _Requirements: 8.1_
  - [x] 10.2 Create campaign card component









    - Create `components/advertiser/CampaignCard.tsx`
    - Display title, status badge, budget progress bar
    - Show spent/total budget and completion count
    - Add action buttons: Pause, Add Funds, Analytics
    - _Requirements: 8.2_
  - [ ]* 10.3 Write property test for campaign card metrics
    - **Property 8: Campaign Card Displays Required Metrics**
    - **Validates: Requirements 8.2**
  - [x] 10.4 Create budget progress component





    - Create `components/advertiser/BudgetProgress.tsx`
    - Show progress bar with percentage
    - Display warning color at 80% threshold
    - Display depleted state when budget exhausted
    - _Requirements: 8.3, 8.4_
  - [ ]* 10.5 Write property test for budget warning threshold
    - **Property 9: Budget Warning Threshold**
    - **Validates: Requirements 8.3**
  - [ ]* 10.6 Write property test for budget depletion detection
    - **Property 10: Budget Depletion Detection**
    - **Validates: Requirements 8.4, 10.3**
  - [x] 10.7 Assemble advertiser dashboard page





    - Create `app/(advertiser)/dashboard/page.tsx`
    - Display wallet balance and campaign summary
    - Show grid of campaign cards
    - Add "Create Campaign" CTA button
    - _Requirements: 8.1, 8.2_

- [x] 11. Implement campaign creation wizard





  - [x] 11.1 Create campaign wizard component


    - Create `components/advertiser/CampaignWizard.tsx`
    - Implement multi-step form with progress indicator
    - Step 1: Basic info (name, description, type)
    - Step 2: Budget and CPA configuration
    - Step 3: Creative upload (thumbnail)
    - Step 4: Review and submit
    - _Requirements: 9.1, 9.2_

  - [x] 11.2 Implement budget validation and estimation

    - Validate minimum budget of $10
    - Calculate estimated completions (budget / CPA)
    - Display estimation to advertiser
    - _Requirements: 9.3, 9.4_
  - [ ]* 11.3 Write property test for minimum budget validation
    - **Property 11: Minimum Budget Validation**
    - **Validates: Requirements 9.3**
  - [ ]* 11.4 Write property test for estimated completions calculation
    - **Property 12: Estimated Completions Calculation**
    - **Validates: Requirements 9.4**
  - [x] 11.5 Create campaign creation API route





    - Create `app/api/campaigns/route.ts` POST handler
    - Validate advertiser has sufficient wallet balance
    - Create campaign record with status='active'
    - Deduct budget from advertiser wallet
    - Log transaction
    - _Requirements: 9.5, 9.6_
  - [ ]* 11.6 Write property test for campaign creation deducts budget
    - **Property 13: Campaign Creation Deducts Budget**
    - **Validates: Requirements 9.5**
  - [x] 11.7 Create campaign creation page





    - Create `app/(advertiser)/campaigns/new/page.tsx`
    - Embed CampaignWizard component
    - Handle success redirect to campaign detail
    - _Requirements: 9.1_

- [x] 12. Implement campaign management







  - [x] 12.1 Create campaign detail page


    - Create `app/(advertiser)/campaigns/[id]/page.tsx`
    - Display full campaign details and metrics
    - Show real-time budget and completion stats
    - Add edit, pause, add funds actions
    - _Requirements: 10.5_

  - [x] 12.2 Implement campaign pause/resume API


    - Create PATCH handler in `app/api/campaigns/route.ts`
    - Toggle campaign status between 'active' and 'paused'
    - _Requirements: 10.3_

  - [x] 12.3 Implement campaign budget top-up
    - Add funds to existing campaign
    - Reactivate depleted campaigns when funded
    - _Requirements: 10.4_
  - [ ]* 12.4 Write property test for campaign reactivation
    - **Property 15: Campaign Reactivation on Funding**

    - **Validates: Requirements 10.4**
  - [x] 12.5 Implement campaign visibility logic

    - Create utility to filter visible campaigns for users
    - Exclude depleted, paused, and expired campaigns
    - _Requirements: 9.6, 10.3_
  - [ ]* 12.6 Write property test for active campaign visibility
    - **Property 14: Active Campaign Visibility**
    - **Validates: Requirements 9.6, 10.3**

- [x] 13. Implement payment integration





  - [x] 13.1 Create Stripe payment intent API


    - Create `app/api/payments/create-intent/route.ts`
    - Generate payment intent for deposit amount
    - Return client secret for Stripe Elements
    - _Requirements: 12.1_

  - [x] 13.2 Create payment webhook handler

    - Create `app/api/payments/webhook/route.ts`
    - Handle payment_intent.succeeded event
    - Credit advertiser wallet on success
    - Log deposit transaction
    - _Requirements: 12.2_
  - [ ]* 13.3 Write property test for payment credits wallet
    - **Property 16: Payment Success Credits Wallet**
    - **Validates: Requirements 12.2**
  - [x] 13.4 Create add funds modal




    - Create deposit amount input
    - Integrate Stripe Elements for card input
    - Handle payment success and error states
    - _Requirements: 12.1, 12.3_

  - [x] 13.5 Create wallet page for advertisers

    - Create `app/(advertiser)/wallet/page.tsx`
    - Display current balance
    - Show transaction history
    - Add funds button
    - _Requirements: 12.4_

- [x] 14. Implement real-time updates




  - [x] 14.1 Set up Supabase real-time subscriptions


    - Subscribe to profile balance changes for users
    - Subscribe to campaign status changes for task feed
    - _Requirements: 15.1, 15.2, 15.3_

  - [x] 14.2 Implement balance update animation

    - Animate balance change in header
    - Show +amount indicator on credit
    - _Requirements: 15.1_

  - [x] 14.3 Implement cooldown expiry handling

    - Set up client-side timers for cooldown expiry
    - Auto-refresh task availability on expiry
    - _Requirements: 15.2_

  - [x] 14.4 Implement campaign removal from feed

    - Remove task cards when campaign depletes/pauses
    - Use real-time subscription for instant updates
    - _Requirements: 15.3_

- [x] 15. Implement user wallet and transactions






  - [x] 15.1 Create user wallet page

    - Create `app/(user)/wallet/page.tsx`
    - Display current balance prominently
    - Show transaction history with filters
    - _Requirements: 11.4_
  - [x] 15.2 Create transaction history component


    - List all credits and debits
    - Show transaction type, amount, date
    - Filter by type (rewards, withdrawals)
    - _Requirements: 11.4_

- [x] 16. Polish and finalize





  - [x] 16.1 Apply dark theme and gradients globally


    - Update `app/globals.css` with dark theme variables
    - Define gradient color palette
    - Apply glassmorphic effects to cards
    - _Requirements: 14.1, 14.2, 14.3, 14.4_
  - [x] 16.2 Add loading states and skeletons


    - Implement skeleton loaders for task grid
    - Add loading states for all async operations
    - _Requirements: 3.1_
  - [x] 16.3 Implement error handling UI


    - Create toast notification system
    - Handle network errors gracefully
    - Show retry options on failure
    - _Requirements: 4.5, 12.3_
  - [x] 16.4 Update app metadata and layout


    - Update `app/layout.tsx` with proper metadata
    - Set app title and description
    - Configure viewport for mobile
    - _Requirements: 14.1_

- [-] 17. Final Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.
