# Requirements Document

## Introduction

This specification covers enhancements and bug fixes for the advertiser campaign management system. The changes include: adding per-user completion limits for campaigns (important for app downloads where one user = one device), standardizing all currency to USD (dollars), fixing the "Failed to fetch" error in the advertiser dashboard, setting the default cooldown timer to 2 minutes, and sorting expired/depleted campaigns to the bottom of campaign lists.

## Glossary

- **Max Completions Per User**: The maximum number of times a single user can complete a specific campaign
- **CPA (Cost Per Action)**: The amount an advertiser pays for each user completion, in USD
- **Cooldown Timer**: A countdown period during which a user cannot repeat a specific task after completion
- **Depleted Campaign**: A campaign that has exhausted its budget and cannot accept new completions
- **Expired Campaign**: A campaign that has passed its expiration date

## Requirements

### Requirement 1: Per-User Completion Limits

**User Story:** As an advertiser, I want to limit how many times a single user can complete my campaign, so that I can ensure unique engagements (e.g., one app download per device).

#### Acceptance Criteria

1. WHEN an advertiser creates a campaign THEN the System SHALL allow setting a max_completions_per_user value (default: 1)
2. WHEN a user attempts to complete a campaign THEN the System SHALL check if the user has reached the max_completions_per_user limit
3. WHEN a user has reached the completion limit for a campaign THEN the System SHALL prevent further completions and hide the task from that user
4. WHEN displaying the campaign wizard THEN the System SHALL show the max completions per user field with explanation text

### Requirement 2: Currency Standardization to USD

**User Story:** As an advertiser, I want all monetary values displayed and processed in USD (dollars), so that there is no confusion between deposit amounts and campaign costs.

#### Acceptance Criteria

1. WHEN displaying wallet balance in the advertiser portal THEN the System SHALL show the amount in USD with $ symbol
2. WHEN an advertiser adds funds THEN the System SHALL accept and display amounts in USD
3. WHEN creating a campaign THEN the System SHALL process budget and CPA values in USD
4. WHEN displaying transaction history THEN the System SHALL show all amounts in USD with $ symbol
5. WHEN the add funds modal opens THEN the System SHALL display preset amounts in USD (e.g., $50, $100, $250, $500)

### Requirement 3: Fix Advertiser Dashboard Fetch Error

**User Story:** As an advertiser, I want the dashboard to load without errors, so that I can manage my campaigns reliably.

#### Acceptance Criteria

1. WHEN the advertiser dashboard loads THEN the System SHALL handle authentication state changes gracefully without TypeError
2. WHEN the signOut function is called THEN the System SHALL properly await the async operation before redirecting
3. WHEN fetching profile data fails THEN the System SHALL display an appropriate error message instead of crashing

### Requirement 4: Default Cooldown Timer Configuration

**User Story:** As a platform operator, I want the default cooldown for completed tasks to be 2 minutes, so that users can re-engage with tasks more quickly.

#### Acceptance Criteria

1. WHEN a new campaign is created without specifying cooldown THEN the System SHALL set cooldown_seconds to 120 (2 minutes)
2. WHEN displaying the campaign wizard THEN the System SHALL show 2 minutes as the default cooldown value
3. WHEN a user completes a task THEN the System SHALL start a 2-minute countdown (or the campaign's configured cooldown)

### Requirement 5: Campaign Sorting by Status

**User Story:** As an advertiser, I want expired and depleted campaigns to appear at the bottom of my campaign list, so that active campaigns are prioritized in the view.

#### Acceptance Criteria

1. WHEN displaying the campaigns list THEN the System SHALL sort campaigns with active status first
2. WHEN displaying the campaigns list THEN the System SHALL sort paused campaigns after active campaigns
3. WHEN displaying the campaigns list THEN the System SHALL sort depleted and expired campaigns at the bottom
4. WHEN a campaign status changes THEN the System SHALL re-sort the campaign list accordingly

