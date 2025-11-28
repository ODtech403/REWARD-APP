# Requirements Document

## Introduction

A production-level gamified survey/task completion platform with dual portals: a user-facing reward-based task completion app and an advertiser dashboard for campaign management. Users complete surveys/tasks by viewing ads, earn rewards, and manage cooldown timers. Advertisers create campaigns, set budgets, and track performance in real-time. The platform features a modern gaming-inspired UI with smooth animations, glassmorphic card designs, and an engaging mascot character.

## Glossary

- **Task Card**: An interactive UI element representing a survey, video view, or task that users can complete for rewards
- **Cooldown Timer**: A countdown period during which a user cannot repeat a specific task after completion
- **Campaign**: An advertiser-created promotional activity with budget, targeting, and reward configuration
- **CPA (Cost Per Action)**: The amount an advertiser pays for each user completion
- **Wallet Balance**: The accumulated rewards/funds in a user's or advertiser's account
- **Ad Unit**: A specific advertisement placement or type within a task
- **Mascot**: An animated character that guides users and provides visual feedback
- **Glassmorphism**: A design style featuring frosted glass-like transparency effects

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to create an account and sign in securely, so that I can track my rewards and progress across sessions.

#### Acceptance Criteria

1. WHEN a user submits valid registration credentials THEN the System SHALL create a new user account in Supabase and redirect to the dashboard
2. WHEN a user submits valid login credentials THEN the System SHALL authenticate via Supabase Auth and establish a session
3. WHEN a user requests password reset THEN the System SHALL send a reset email via Supabase Auth within 30 seconds
4. WHILE a user session is active THEN the System SHALL persist authentication state across page refreshes
5. WHEN a user clicks logout THEN the System SHALL terminate the session and redirect to the login page

### Requirement 2: User Dashboard

**User Story:** As a user, I want to see an engaging dashboard with my balance and available tasks, so that I can quickly find tasks to complete and track my earnings.

#### Acceptance Criteria

1. WHEN a user lands on the dashboard THEN the System SHALL display the wallet balance prominently in the header
2. WHEN the dashboard loads THEN the System SHALL render an animated mascot character with idle animations
3. WHEN the dashboard loads THEN the System SHALL display a horizontal scrolling category filter with circular icons
4. WHEN the dashboard loads THEN the System SHALL display task cards in a 2-column grid layout with gradient overlays
5. WHEN a user scrolls the category bar THEN the System SHALL provide smooth momentum-based horizontal scrolling

### Requirement 3: Task Card Display

**User Story:** As a user, I want to see beautiful task cards with clear information, so that I can understand rewards and requirements before starting.

#### Acceptance Criteria

1. WHEN rendering a task card THEN the System SHALL display title, reward amount, description, and rating with white text on gradient background
2. WHEN a task is available THEN the System SHALL apply a subtle glow effect and enable interaction
3. WHEN a task is on cooldown THEN the System SHALL display a countdown timer, reduce opacity, and show a lock icon
4. WHEN a user hovers over an available card THEN the System SHALL apply a scale transform and elevated shadow
5. WHEN a user taps an available card THEN the System SHALL apply a press animation with 0.97 scale

### Requirement 4: Task Completion Flow

**User Story:** As a user, I want to complete tasks and earn rewards, so that I can accumulate balance in my wallet.

#### Acceptance Criteria

1. WHEN a user selects an available task THEN the System SHALL navigate to the task detail view with instructions
2. WHEN a user completes a task THEN the System SHALL credit the reward to the user wallet immediately
3. WHEN a task is completed THEN the System SHALL trigger a celebration animation with confetti particles
4. WHEN a task is completed THEN the System SHALL start the cooldown timer for that specific task card
5. WHEN a task completion fails THEN the System SHALL display an error message and allow retry

### Requirement 5: Cooldown Management

**User Story:** As a user, I want to see cooldown timers on completed tasks, so that I know when I can complete them again.

#### Acceptance Criteria

1. WHEN a task enters cooldown THEN the System SHALL store the cooldown end timestamp in the database
2. WHILE a task is on cooldown THEN the System SHALL display a live countdown timer on the card
3. WHEN a cooldown expires THEN the System SHALL automatically restore the card to available state
4. WHEN a user views a card on cooldown THEN the System SHALL display grayscale styling with a lock overlay
5. WHEN the app loads THEN the System SHALL restore cooldown states from persisted data

### Requirement 6: Mascot Animations

**User Story:** As a user, I want to see an animated mascot that reacts to my actions, so that the app feels engaging and game-like.

#### Acceptance Criteria

1. WHEN the dashboard is idle THEN the System SHALL display the mascot with gentle bobbing and blinking animations
2. WHEN a user completes a task THEN the System SHALL trigger a celebration animation on the mascot
3. WHEN available tasks exist THEN the System SHALL animate the mascot pointing toward task cards
4. WHEN all tasks are on cooldown THEN the System SHALL display the mascot in a sleeping or waiting state
5. WHEN a user earns rewards THEN the System SHALL animate coins flying toward the wallet balance

### Requirement 7: Advertiser Authentication

**User Story:** As an advertiser, I want to create a separate advertiser account, so that I can manage campaigns and track spending.

#### Acceptance Criteria

1. WHEN an advertiser registers THEN the System SHALL create an account with advertiser role in Supabase
2. WHEN an advertiser logs in THEN the System SHALL redirect to the advertiser dashboard
3. WHEN an advertiser account is created THEN the System SHALL initialize a wallet with zero balance
4. WHILE an advertiser session is active THEN the System SHALL restrict access to advertiser-only routes

### Requirement 8: Advertiser Dashboard

**User Story:** As an advertiser, I want to see my wallet balance and campaign overview, so that I can monitor spending and performance.

#### Acceptance Criteria

1. WHEN the advertiser dashboard loads THEN the System SHALL display wallet balance and active campaign count
2. WHEN the dashboard loads THEN the System SHALL display campaign cards with status, budget progress, and metrics
3. WHEN a campaign budget reaches 80% spent THEN the System SHALL display a warning indicator
4. WHEN a campaign budget is depleted THEN the System SHALL display a depleted status badge

### Requirement 9: Campaign Creation

**User Story:** As an advertiser, I want to create campaigns with budget and targeting, so that I can reach users with my surveys and tasks.

#### Acceptance Criteria

1. WHEN an advertiser starts campaign creation THEN the System SHALL display a step-by-step wizard interface
2. WHEN configuring a campaign THEN the System SHALL allow setting name, description, type, and CPA
3. WHEN setting budget THEN the System SHALL validate minimum deposit threshold of $10
4. WHEN budget is configured THEN the System SHALL calculate and display estimated completions
5. WHEN a campaign is submitted THEN the System SHALL create the campaign record and deduct budget from wallet
6. WHEN a campaign is created THEN the System SHALL make it visible to users as a task card immediately

### Requirement 10: Campaign Budget Management

**User Story:** As an advertiser, I want automatic budget tracking and notifications, so that I can manage spending without constant monitoring.

#### Acceptance Criteria

1. WHEN a user completes a campaign task THEN the System SHALL deduct the CPA from campaign budget atomically
2. WHEN campaign budget reaches 80% spent THEN the System SHALL send an email notification to the advertiser
3. WHEN campaign budget is depleted THEN the System SHALL pause the campaign and remove it from user feed
4. WHEN a depleted campaign receives additional funds THEN the System SHALL reactivate and restore visibility
5. WHEN viewing a campaign THEN the System SHALL display real-time budget remaining and completion count

### Requirement 11: Revenue Distribution

**User Story:** As a platform operator, I want automatic revenue splitting, so that users receive rewards and the platform earns commission.

#### Acceptance Criteria

1. WHEN a task is completed THEN the System SHALL credit 75% of CPA to user wallet
2. WHEN a task is completed THEN the System SHALL retain 25% of CPA as platform commission
3. WHEN a transaction occurs THEN the System SHALL log the transaction with timestamp, amounts, and parties
4. WHEN viewing transaction history THEN the System SHALL display all credits and debits with details

### Requirement 12: Payment Integration

**User Story:** As an advertiser, I want to deposit funds securely, so that I can fund my campaigns.

#### Acceptance Criteria

1. WHEN an advertiser clicks add funds THEN the System SHALL display payment options via Stripe
2. WHEN a payment succeeds THEN the System SHALL credit the advertiser wallet immediately
3. WHEN a payment fails THEN the System SHALL display an error message and allow retry
4. WHEN viewing wallet THEN the System SHALL display transaction history with deposits and spending

### Requirement 13: Fraud Prevention

**User Story:** As a platform operator, I want to prevent fraudulent completions, so that advertisers receive legitimate engagement.

#### Acceptance Criteria

1. WHEN a user attempts task completion THEN the System SHALL verify minimum time spent on task
2. WHEN a completion is recorded THEN the System SHALL log IP address and device fingerprint
3. WHEN duplicate completion is detected within cooldown THEN the System SHALL reject and not credit reward
4. WHEN suspicious patterns are detected THEN the System SHALL flag the account for review

### Requirement 14: Responsive Design

**User Story:** As a user, I want the app to work beautifully on mobile and desktop, so that I can complete tasks on any device.

#### Acceptance Criteria

1. WHEN viewed on mobile (320-414px) THEN the System SHALL display task cards in a 2-column grid
2. WHEN viewed on tablet or larger THEN the System SHALL optionally expand to 3-column grid
3. WHEN the category bar is scrolled THEN the System SHALL hide scrollbar while maintaining scroll functionality
4. WHEN cards are displayed THEN the System SHALL maintain 3:4 aspect ratio across all screen sizes

### Requirement 15: Real-time Updates

**User Story:** As a user, I want to see live updates to my balance and task states, so that I have accurate information.

#### Acceptance Criteria

1. WHEN a reward is credited THEN the System SHALL update the displayed balance within 1 second
2. WHEN a cooldown expires THEN the System SHALL update the card state without page refresh
3. WHEN a campaign is paused or depleted THEN the System SHALL remove the task card from user feed in real-time
