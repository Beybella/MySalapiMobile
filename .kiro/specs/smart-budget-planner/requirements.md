# Requirements Document

## Introduction

The Smart Budget Planner is a new feature for MySalapi — a Tri-Ledger Mobile Financial Tracker targeting Filipino users. Many MySalapi users are students or individuals who are not financially savvy and struggle to allocate limited funds across multiple obligations. This feature extends the existing Personal Expense Ledger by introducing fund sources (e.g., credit cards, savings accounts, cash on hand), linking existing bill reminders to those fund sources, and automatically prioritizing bills by due date to guide users toward sound allocation decisions. The planner acts as an in-app financial advisor: it warns users when a fund source is insufficient, suggests reallocation strategies, and surfaces actionable guidance so that users who do not know how to budget can still make informed financial decisions.

---

## Glossary

- **Budget_Planner**: The Smart Budget Planner module within MySalapi that manages fund sources, bill allocations, and budget recommendations.
- **Fund_Source**: A user-defined financial account or pool of money (e.g., credit card, savings account, cash on hand) with a defined available balance or credit limit.
- **Credit_Limit**: The maximum borrowable amount assigned to a credit-card-type Fund_Source.
- **Available_Balance**: The current spendable amount remaining in a Fund_Source, calculated as the Credit_Limit or total balance minus the sum of all linked Allocation amounts.
- **Bill_Reminder**: An existing MySalapi record representing a scheduled payment obligation with an amount and a due date.
- **Allocation**: The assignment of a specific Bill_Reminder to a specific Fund_Source, reserving the bill amount from that source's Available_Balance.
- **Allocation_Plan**: The ordered list of Allocations generated or confirmed for a given planning period.
- **Priority_Score**: A numeric value computed from a Bill_Reminder's due date (and optionally its amount) used to rank bills for allocation.
- **Shortfall**: The amount by which a Fund_Source's Available_Balance is insufficient to cover one or more allocated Bill_Reminders.
- **Planning_Period**: The user-selected time window (e.g., current month, next 30 days) over which the Budget_Planner operates.
- **Recommendation**: A system-generated suggestion advising the user on how to reallocate funds or defer bills to resolve a Shortfall.
- **User**: An authenticated MySalapi account holder.
- **Notification_Service**: The existing MySalapi component that sends automated email notifications via the Resend API.

---

## Requirements

### Requirement 1: Manage Fund Sources

**User Story:** As a User, I want to create, view, update, and delete fund sources, so that I can tell the Budget Planner where my money comes from and how much is available.

#### Acceptance Criteria

1. WHEN a User submits a new Fund_Source, THE Budget_Planner SHALL require a name (1–100 characters), a type (credit card, savings account, or cash on hand), and either a Credit_Limit (for credit-card type) or an initial balance (for other types) in the range 0.01–999,999,999.99.
2. WHEN a User creates a Fund_Source and the persistence operation succeeds, THE Budget_Planner SHALL display the new Fund_Source in the User's fund source list within 2 seconds.
3. IF the persistence operation for a new Fund_Source fails, THEN THE Budget_Planner SHALL NOT add the Fund_Source to the list and SHALL display a descriptive error message to the User.
4. IF a User attempts to create a Fund_Source with a name that already exists in their fund source list, THEN THE Budget_Planner SHALL reject the input and display a validation error indicating the name is already in use.
5. WHEN a User updates a Fund_Source's Credit_Limit or balance, THE Budget_Planner SHALL recalculate the Available_Balance for all existing Allocations linked to that Fund_Source and reflect the updated values within 2 seconds.
6. WHEN a User deletes a Fund_Source that has active Allocations, THE Budget_Planner SHALL prompt the User to confirm deletion and, upon confirmation, remove all associated Allocations before deleting the Fund_Source; IF the removal of any Allocation fails, THEN THE Budget_Planner SHALL abort the deletion, restore any partially removed Allocations, and display a descriptive error to the User.
7. THE Budget_Planner SHALL display each Fund_Source with its name, type, Credit_Limit or total balance, and current Available_Balance (calculated as Credit_Limit or total balance minus the sum of all linked Allocation amounts).
8. IF a User attempts to create a Fund_Source with a Credit_Limit or balance outside the range 0.01–999,999,999.99, THEN THE Budget_Planner SHALL reject the input and display a descriptive validation error.

---

### Requirement 2: Link Bill Reminders to Fund Sources

**User Story:** As a User, I want to link my existing bill reminders to a specific fund source, so that the Budget Planner knows which account will pay each bill.

#### Acceptance Criteria

1. WHEN a User opens the Budget Planner for a Planning_Period, THE Budget_Planner SHALL display all Bill_Reminders whose due dates fall on or between the Planning_Period start date and end date, inclusive.
2. WHEN a User assigns a Bill_Reminder to a Fund_Source, THE Budget_Planner SHALL create or replace any existing Allocation for that Bill_Reminder with the new Fund_Source assignment.
3. WHEN a User assigns a Bill_Reminder to a Fund_Source, THE Budget_Planner SHALL deduct the bill amount from the Fund_Source's Available_Balance and update the displayed Available_Balance within 2 seconds.
4. WHEN a User reassigns a Bill_Reminder from one Fund_Source to another, THE Budget_Planner SHALL restore the bill amount to the original Fund_Source's Available_Balance and deduct it from the new Fund_Source's Available_Balance.
5. IF a User attempts to assign a Bill_Reminder to a Fund_Source whose Available_Balance is less than the bill amount, THEN THE Budget_Planner SHALL display a Shortfall warning showing the bill amount, the Fund_Source name, and the resulting negative Available_Balance before saving the Allocation; THE Budget_Planner SHALL save the Allocation only if the User explicitly confirms the action; IF the User cancels, THEN THE Budget_Planner SHALL discard the Allocation without saving.
6. WHEN a User removes an Allocation, THE Budget_Planner SHALL restore the bill amount to the associated Fund_Source's Available_Balance, mark the Bill_Reminder as unassigned, and update the displayed Available_Balance within 2 seconds.

---

### Requirement 3: Automatic Bill Prioritization

**User Story:** As a User, I want the app to automatically rank my bills by urgency, so that I know which ones to pay first without having to figure it out myself.

#### Acceptance Criteria

1. WHEN a User requests an Allocation_Plan, THE Budget_Planner SHALL compute a Priority_Score for each Bill_Reminder in the Planning_Period using the bill's due date as the primary sort key (earliest due date = highest priority).
2. WHEN two or more Bill_Reminders share the same due date, THE Budget_Planner SHALL rank the bill with the higher amount as higher priority; WHEN two or more Bill_Reminders share the same due date and the same amount, THE Budget_Planner SHALL rank them in ascending alphabetical order by bill name as a deterministic tie-break.
3. WHEN a User requests an Allocation_Plan and the Planning_Period contains at least one Bill_Reminder, THE Budget_Planner SHALL present the prioritized list of Bill_Reminders to the User in descending Priority_Score order before generating Allocations.
4. WHEN the Budget_Planner generates an Allocation_Plan automatically, THE Budget_Planner SHALL allocate bills to the User's Fund_Sources in Priority_Score order, assigning each bill to the Fund_Source with the highest Available_Balance that can cover the bill amount.
5. IF no single Fund_Source has sufficient Available_Balance to cover a bill, THEN THE Budget_Planner SHALL leave that bill unallocated, flag it in the Shortfall summary, and SHALL NOT mark it as allocated.
6. WHEN the Budget_Planner displays the generated Allocation_Plan to the User for review, THE Budget_Planner SHALL allow the User to accept the plan as-is, modify individual Allocations by reassigning bills to different Fund_Sources, or discard the plan entirely; WHEN the User accepts or modifies and saves the plan, THE Budget_Planner SHALL persist the resulting Allocations; WHEN the User discards the plan, THE Budget_Planner SHALL discard all generated Allocations without saving.
7. WHEN a User requests an Allocation_Plan and the Planning_Period contains no Bill_Reminders, THE Budget_Planner SHALL display a message indicating there are no bills to allocate for the selected period.

---

### Requirement 4: Shortfall Detection and Warnings

**User Story:** As a User, I want to be warned when I don't have enough money to cover my upcoming bills, so that I can take action before a payment is missed.

#### Acceptance Criteria

1. IF the total amount of Bill_Reminders in the Planning_Period exceeds the sum of Available_Balances across all Fund_Sources, THEN THE Budget_Planner SHALL display a Shortfall warning on the Budget Planner dashboard.
2. THE Budget_Planner SHALL display the total Shortfall amount and list each unallocated Bill_Reminder and each Bill_Reminder whose confirmed Allocations sum to less than the bill's full amount, identifying these as contributors to the Shortfall.
3. WHILE a Fund_Source's Available_Balance is greater than zero and less than 20% of its Credit_Limit (if defined) or initial balance (if no Credit_Limit is defined), THE Budget_Planner SHALL display a low-balance indicator on that Fund_Source's card.
4. WHEN a Bill_Reminder's due date is within 3 calendar days of the current date and the User has not explicitly confirmed an Allocation for that bill, THE Budget_Planner SHALL display an urgent payment alert for that bill.
5. IF a Shortfall is detected and no Shortfall email has been sent for the current Shortfall condition, THEN THE Budget_Planner SHALL trigger the Notification_Service to send one email notification to the User summarizing the Shortfall and listing the affected Bill_Reminders.
6. IF the Notification_Service fails to deliver the Shortfall email, THEN THE Budget_Planner SHALL log the failure in the email_notifications table and display an in-app alert to the User indicating that the email notification could not be sent.

---

### Requirement 5: Budget Recommendations

**User Story:** As a User who does not know how to budget, I want the app to suggest how I should allocate my money, so that I can follow a clear plan without needing financial expertise.

#### Acceptance Criteria

1. WHEN a Shortfall is detected, THE Budget_Planner SHALL generate between 1 and 5 Recommendations advising the User on how to resolve the Shortfall; each Recommendation SHALL suggest one of the following: defer a bill with a later due date than the earliest unallocated bill, increase a Fund_Source balance, or reallocate from a Fund_Source whose Available_Balance exceeds zero after all its assigned obligations are covered.
2. THE Budget_Planner SHALL present each Recommendation with a plain-language explanation using sentences of no more than 20 words and no financial jargon unless the term is immediately defined inline, describing the suggested action and its expected impact on the Shortfall.
3. WHEN a User accepts a Recommendation, THE Budget_Planner SHALL apply the suggested Allocation changes and complete the recalculation of all Available_Balances and the Shortfall summary before accepting the next user interaction.
4. WHEN a User dismisses a Recommendation, THE Budget_Planner SHALL mark it as dismissed and not display it again unless a Fund_Source balance, a bill amount, or a bill due date within the Planning_Period changes.
5. THE Budget_Planner SHALL display a budget health summary on the dashboard showing total allocated obligations, total Available_Balance across all Fund_Sources, and a status label: Healthy (obligations ≤ 80% of total available funds), At Risk (obligations 81–100% of total available funds), or Critical (obligations exceed total available funds).
6. WHERE a User has no active Shortfall, THE Budget_Planner SHALL display a positive reinforcement message confirming that all bills within the Planning_Period are covered and showing the remaining total Available_Balance across all Fund_Sources.

---

### Requirement 6: Planning Period Selection

**User Story:** As a User, I want to choose the time window for my budget plan, so that I can plan for the current month, the next 30 days, or a custom range.

#### Acceptance Criteria

1. THE Budget_Planner SHALL provide the User with preset Planning_Period options: current calendar month, next 7 days, and next 30 days.
2. THE Budget_Planner SHALL allow a User to define a custom Planning_Period by selecting a start date and an end date, with a maximum span of 365 calendar days.
3. IF a User sets a custom Planning_Period end date that is earlier than the start date, THEN THE Budget_Planner SHALL reject the input and display a validation error stating "End date must be on or after start date."
4. WHEN a User changes the Planning_Period, THE Budget_Planner SHALL reload all Bill_Reminders and Allocations relevant to the new period and recalculate all Available_Balances and Shortfall values, targeting completion within 2 seconds.
5. IF the reload operation for a Planning_Period change fails, THEN THE Budget_Planner SHALL display a descriptive error message and retain the previously loaded data until a successful reload occurs.
6. THE Budget_Planner SHALL persist the User's last selected Planning_Period type and custom date range (if applicable) and restore the persisted selection when the User reopens the Budget Planner.
7. WHEN the Budget_Planner restores the User's last selected Planning_Period on reopen, THE Budget_Planner SHALL recalculate preset period boundaries (e.g., "current calendar month") based on the current date at the time of reopening.

---

### Requirement 7: Data Privacy and Security

**User Story:** As a User, I want my financial data to be kept private and secure, so that my fund sources and budget plans are not accessible to unauthorized parties.

#### Acceptance Criteria

1. THE Budget_Planner SHALL ensure that a User can only read and modify their own Fund_Source and Allocation records, enforced via PostgreSQL Row Level Security (RLS) policies tied to the authenticated user's JWT.
2. WHEN a User's session has been inactive for 15 consecutive minutes, THE Budget_Planner SHALL require re-authentication before displaying any Fund_Source or Allocation data.
3. WHEN Fund_Source or Allocation data is displayed on screen at the moment a User's session is invalidated, THE Budget_Planner SHALL clear the displayed data before prompting re-authentication.
4. THE Budget_Planner SHALL transmit all Fund_Source and Allocation data exclusively over HTTPS.
5. THE Budget_Planner SHALL store Fund_Source balances and Credit_Limits as encrypted values at rest in the PostgreSQL database such that no plaintext value is retrievable via direct database access, in compliance with the Philippine Data Privacy Act of 2012.
6. IF a User attempts to read or modify a Fund_Source or Allocation record belonging to a different User, THEN THE Budget_Planner SHALL deny the request, return no data, and log the attempt with a timestamp and the requesting user's identifier.
