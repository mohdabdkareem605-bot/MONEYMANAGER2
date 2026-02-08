# Master Plan: Direct Settlement & Shared Ledger Architecture

## 1. Executive Summary: Problem & Solution
**The Problem:**
Our application currently suffers from two fundamental issues:
1.  **Identity Crisis:** It treats "Settlements" (paying back a friend) as "Expenses" (spending money). This corrupts the P&L statement, making it look like you spent double (once when splitting the bill, and again when settling it).
2.  **Privacy Silos:** It behaves like a private diary. If Mr. A creates a transaction, Mr. B cannot see it, leading to a disconnected experience unlike shared apps (e.g., Splitwise).

**The Solution:**
We are implementing the **"Direct Settlement" Architecture**:
1.  **Structural Separation:** We will distinguish "Expenses" (using Splits) from "Settlements" (using Direct Transactions).
2.  **Schema Upgrade:** We will introduce a `SETTLEMENT` transaction type and a `receiver_contact_id` to strictly define money movement without using "Payment Splits".
3.  **Shared Ledger:** We will unlock database permissions so participants can see the transactions they are involved in, creating a true synchronized financial history.

---

## 2. Database Schema Changes

### Step A: Allow "SETTLEMENT" Type
The current database limits transactions to `INCOME`, `EXPENSE`, `TRANSFER`.
**Action:** Update the Check Constraint.
```sql
ALTER TABLE transactions DROP CONSTRAINT transactions_transaction_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_transaction_type_check 
  CHECK (transaction_type IN ('INCOME', 'EXPENSE', 'TRANSFER', 'SETTLEMENT'));
```

### Step B: Add Receiver, Destination, and Allocations
We need columns for direct transfers, and a new table to track which debts are paid.
**Action:** Add Columns & Create Table.
```sql
-- 1. Update Transactions
ALTER TABLE transactions 
ADD COLUMN receiver_contact_id UUID REFERENCES contacts(id),
ADD COLUMN destination_account_id UUID REFERENCES accounts(id);

-- 2. Create Allocations Table (The "Math" Storage)
CREATE TABLE settlement_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  settlement_transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  debt_split_id UUID REFERENCES splits(id) ON DELETE CASCADE,
  amount_allocated NUMERIC NOT NULL,
  currency_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step C: Shared Visibility (RLS)
Unlock visibility for participants.
**Action:** Update RLS Policy.
```sql
CREATE POLICY "View Shared Transactions" ON transactions
FOR SELECT USING (
  auth.uid() = created_by OR 
  id IN (SELECT transaction_id FROM splits WHERE contact_id IN (
    SELECT id FROM contacts WHERE linked_profile_id = auth.uid()
  )) OR
  receiver_contact_id IN (
    SELECT id FROM contacts WHERE linked_profile_id = auth.uid()
  )
);
```

---

## 3. Data Strategy: Fresh Start (Wipe & Upgrade)
Since we are in development, we will **delete all existing data** to start fresh with the new schema. This avoids complex migration scripts and ensures 100% clean data.

**SQL Script:**
```sql
-- 1. Wipe Data (Order matters due to foreign keys)
TRUNCATE TABLE splits CASCADE;
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE settlement_allocations CASCADE;

-- 2. Reset Constraints (if needed) & Apply Schema Changes
-- (Schema changes from Step 2 will be applied here)
```

---

## 4. Application Logic Updates (`dataStore.ts`)

### A. Writing Data (`createSettlement`)
-   **Old:** Create Transaction (Expense) + Create Split (Payment).
-   **New:**
    1.  **Calculate Logic:** Apply your FIFO/Currency Match algorithm in code.
    2.  **Create Transaction:** Type `SETTLEMENT`, Receiver `target_contact_id`.
    3.  **Create Allocations:** Insert rows into `settlement_allocations` to link the payment to specific debts (e.g. "This $50 paid off the Pizza and Taxi bills").

### B. Reading Balances (`fetchContactBalances`)
-   **Old Formula:** Sum(Splits).
-   **New Formula:**
    1.  **Expense Debts:** Sum of `splits` (Where type=DEBT).
    2.  **Settlements Sent:** Sum of `transactions` (Where type=SETTLEMENT & user=Payer).
    3.  **Settlements Received:** Sum of `transactions` (Where type=SETTLEMENT & user=Receiver).
    -   `Net Balance = (Expense Debts) + (Settlements Sent) - (Settlements Received)`.

### D. Internal Transfers (`createTransaction`)
We must now support moving money between accounts.
-   **If Type = TRANSFER:**
    -   Deduct from `account_id` (Source).
    -   Add to `destination_account_id` (Target).
    -   (Optional: Handle currency conversion).

### E. Dashboard P&L (`fetchDashboard`)
-   **Old:** Sum(Expenses).
-   **New:**
    -   **Include:** `EXPENSE` type.
    -   **Include:** My share of others' expenses (from `splits` where type=DEBT).
    -   **Exclude:** `SETTLEMENT` and `TRANSFER` types.

### F. Transaction Feed (`fetchTransactions`)
-   **Update Query:** Remove `created_by` filter (rely on RLS).
-   **Update UI:** Show logic for `SETTLEMENT` type (e.g. "You paid Bob", "Bob paid you").

---

## 5. Verification Checklist
1.  **Migration:** Run SQL migration on a backup/staging env first.
2.  **Balance Check:** Verify User A (-500) and User B (+500) see correct balances after migration.
3.  **New Settlement:** Create a NEW settlement and verify it appears in the list but creates NO splits.
4.  **Dashboard:** Ensure paying back a debt does NOT increase "Total Expenses".
