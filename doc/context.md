# FinanceFlow - Project Context

**Last Updated:** February 8, 2026

---

## Overview

FinanceFlow is a mobile application for personal finance management with expense splitting functionality (like Splitwise + Mint combined). Built with React Native (Expo Router) and Supabase backend.

**Tech Stack:**
- Frontend: React Native + Expo Router + TypeScript
- Backend: Supabase (PostgreSQL + Auth + RLS)
- State: Zustand

---

## Implemented Features

### ✅ Authentication
- Email/password login and signup
- Phone OTP login (requires Twilio configuration)
- Auth gate - unauthenticated users redirected to login
- Session persistence with AsyncStorage

**Files:**
- `/frontend/app/auth/login.tsx` - Login with email/phone toggle
- `/frontend/app/auth/signup.tsx` - Email signup
- `/frontend/app/auth/verify.tsx` - OTP verification
- `/frontend/src/store/authStore.ts` - Auth state management

### ✅ Database Schema
All tables with RLS policies:

| Table | Purpose |
|-------|---------|
| `user_profiles` | User profile data |
| `accounts` | Bank accounts/wallets |
| `account_groups` | Account grouping |
| `contacts` | Friends (shadow or linked) |
| `transactions` | Financial transactions |
| `splits` | Split assignments per transaction |
| `splits` | Split assignments (DEBT and PAYMENT) |
| `categories` | Expense categories |

**RLS Policies:**
- Users can manage own data
- Bidirectional contact visibility (via `linked_profile_id`)
- Users can view/create splits for contacts they are linked to
- Users can view profiles of linked contacts (for name display)

### ✅ Account Management (Feb 1, 2026)
- Create/edit/delete accounts via modal
- Currency selection per account
- Opening balance input
- Account list in Profile with expand/collapse
- Total balance display

**Files:**
- `/frontend/app/(tabs)/profile.tsx` - Account management UI
- `/frontend/src/components/add-transaction/AddAccountModal.tsx`

### ✅ Transaction Engine
- Create expenses, income, transfers
- Split expenses with friends (equal, percentage, custom)
- "You Paid" and "Your Share" smart calculation
- Category assignment with icons
- Transaction type toggle (Expense/Income/Transfer)

**Files:**
- `/frontend/app/(tabs)/add.tsx`
- `/frontend/src/components/add-transaction/SplitExpenseSection.tsx`
- `/frontend/src/store/dataStore.ts`

### ✅ Friends & Balances (Feb 2, 2026)
- Create/delete contacts
- Bidirectional balance calculation
- Dynamic "Overall, you are owed/you owe" header
- Friends list with balance status (owed/owing/settled)

**Files:**
- `/frontend/app/(tabs)/friends.tsx`
- `/frontend/src/components/friends/FriendsHeader.tsx`
- `/frontend/src/components/friends/FriendCard.tsx`

### ✅ Friend Detail & Settle Up (Feb 2-3, 2026)
- Tap friend → view detail screen
- Transaction history with friend
- Net balance display
- **Settle Up Modal:**
  - Direction toggle (You pay / They pay)
  - Partial payment support
  - Account selector
  - Records PAYMENT splits correctly

**Files:**
- `/frontend/app/friend/[id].tsx` - Friend detail screen
- `/frontend/src/components/friends/SettleUpModal.tsx`

### ✅ Bidirectional Friend Visibility (Feb 3, 2026)
**New Feature:** When User A adds User B and creates an expense split, User B automatically sees User A as a friend with the correct balance (no separate friend add needed).

**Implementation:**
- `fetchContacts()` now queries both:
  - Contacts I own (people I added)
  - "Reverse contacts" (people who added me via `linked_profile_id`)
- Virtual contacts created with `reverse_` prefix for UI
- `fetchContactBalances()` handles reverse contacts with inverted balance logic
- `createSettlement()` strips `reverse_` prefix for database operations

**Database Changes:**
- `link_contact_to_existing_user` trigger: Links contacts to existing users by email/phone
- `link_shadow_contacts` trigger: Links on user signup
- Both triggers now prevent self-linking
- New RLS policy on `user_profiles`: Users can view profiles of linked contacts

### ✅ Contact Linking (Feb 3, 2026)
- Contacts can be linked via email or phone number
- Automatic linking on contact creation and user signup
- Self-linking prevention (can't add yourself as a friend)
- `contacts` table now has `email` column

### ✅ Dashboard (Feb 5, 2026)
- **Primary Currency:** Global currency setting in Profile (converts all foreign amounts).
- **View Toggle:** Switch between "Cash Flow" and "Net Worth".
- **Cash Flow:** Income vs Expense vs Net Savings.
- **Net Worth:** Assets (Cash + Owed to you) vs Liabilities (Owed to others).
- **Category Analysis:** Breakdown of Income and Expenses.

**Files:**
- `/frontend/app/(tabs)/dashboard.tsx`
- `/frontend/src/store/dataStore.ts` (currency logic)

### ✅ Transaction List (Feb 5, 2026)
- Shows actual currency (e.g., USD, AED) per transaction.
- Displays **Net Expense** (Your Share) instead of total amount.
- Clean UI: Removed "Lent" text for simplicity.
- Grouped by date.

**Files:**
- `/frontend/app/(tabs)/transactions.tsx`
- `/frontend/src/components/transactions/TransactionRow.tsx`

### ✅ UI Components
- Tab navigation (Dashboard, Friends, Add, Transactions, Profile)
- Selection sheets for categories, accounts, friends
- Add Friend / Add Account modals (with backend sync)
- Floating action buttons

### ✅ Direct Settlement & Shared Ledger (Feb 6-8, 2026)
- **Architecture Refactor:** Moved from "Allocation Table" to "Direct Payment Splits".
- **Allocate at Source strategy:** Settlements create `PAYMENT` splits directly.
- **Smart Settlement Logic:**
  - **Phase 1:** Matches payment currency to debts (FIFO).
  - **Phase 2:** Converts remaining payment to debt currency (locks exchange rate).
  - **Credits:** Overpayments recorded as credits.
- **Cross-Currency Support:** Seamlessly handles settling debts in different currencies.
- **Settlement Preview:** Real-time visual breakdown of how a payment will be allocated in `SettleUpModal`.
- **Shared Ledger:** Users see the exact same transaction/split data.

**Files:**
- `/frontend/src/store/dataStore.ts` (`createSettlement`, `fetchContactBalances`)
- `/frontend/src/components/friends/SettleUpModal.tsx`

### ✅ Transfer & Lending (Feb 7-8, 2026)
- **Smart Logic:** "Transfer" now asks for context: Lend, Repayment, or Gift.
- **Backend Triggers:** Automatic balance updates for *all* involved parties (even cross-user) via secure database triggers.
- **Heuristic Engine:** Auto-selects destination accounts based on currency match and balance volume.
- **Cross-User Account Lookup:** Securely finds friend's bank account ID for repayments without exposing private data.
- **Data Integrity:** Removed fragile client-side balance math; now relies 100% on backend logic.

**Files:**
- `/frontend/app/(tabs)/add.tsx` (Logic mapping)
- `get_user_destination_account` (RPC Function)
- `handle_transaction_balance_update` (DB Trigger)

---

## Not Yet Implemented

| Feature | PRD Reference |
|---------|---------------|

| Groups Management | Section 4.2 |
| Offline First Mode | NFR 6.1 |
| Transfer "Pay Friend" toggle | - |
| Transaction Editing (Edit/Delete) | - |


---

## Key Technical Notes

### Balance Calculation Logic
In `dataStore.ts fetchContactBalances()`:
- Positive balance = they owe you
- Negative balance = you owe them

For **regular contacts** (I own the contact):
- DEBT split → they owe me (+)
- PAYMENT split → they paid me (-)

For **reverse contacts** (they own a contact with me linked):
- DEBT split → I owe them (-)
- PAYMENT split → I paid them (+)

### Cross-User Debt Handling
- **Creation:** When Friend A adds an expense split for Friend B, a `DEBT` split is created on Friend B's "Reverse Contact".
- **Settlement:** When Friend B settles, the system finds debts on both:
  1. Friend B's contact for Friend A.
  2. Friend A's "Reverse Contact" for Friend B.
- **Result:** correctly pays off debts regardless of who initiated the expense.

### Settlement Direction
- **you_pay**: Creates PAYMENT split on target contact
- **they_pay**: Creates PAYMENT split on their contact for you

### Reverse Contact Handling
- ID format: `reverse_{original_contact_uuid}`
- Must strip prefix before database operations
- Owner's name fetched from `user_profiles` via separate query

---

## Running the App

```bash
cd frontend
npm install
npx expo start --clear
```

Access via:
- Expo Go app (scan QR)
- Web: http://localhost:8081

---

## Key Documents

- **PRD:** `/doc/Product Requirements Document (PRD) - Final.md`
- **This Context:** `/doc/context.md`

---

## Next Steps / Known Issues
**Focus:** Groups Management & Offline Support

### 1. Groups (Planned)
- Create groups for trips/events.
- Split expenses among M users.

### 2. Offline Mode (Planned)
- Queue creation/edits when offline.
- Sync when online.