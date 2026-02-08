---

# **Product Requirements Document (PRD)**

**Project Name:** FinanceFlow **Version:** 2.0 (Master Specification) **Status:** Approved for Development **Author:** Co-founder (Technical Lead)

---

## **1\. Executive Summary**

### **1.1 The Problem**

Users currently manage their financial lives in two disconnected silos:

1. **Personal Finance Apps (e.g., Wallet, Mint):** Great for tracking bank balances but fail when you pay a $100 dinner bill for 4 people (it logs $100 expense, ruining your budget).  
2. **Debt Splitting Apps (e.g., Splitwise):** Great for tracking "who owes who" but disconnected from real money. They don't know if you actually have the cash to settle.

### **1.2 The Solution**

**FinanceFlow** is a "Hybrid Ledger" app. It treats "Spending Money" and "Owing Money" as two separate but linked layers.

* **Layer 1 (Physical):** Real money leaving your bank account.  
* **Layer 2 (Logical):** The social division of that cost.

---

## **2\. User Personas**

### **2.1 The "Anchor" (Power User)**

* **Behavior:** Pays for everything (dinners, trips) to get credit card points.  
* **Pain Point:** Loses track of who paid him back. His "Net Worth" looks lower than it is because apps don't count his "Accounts Receivable."

### **2.2 The "Shadow" (Viral User)**

* **Behavior:** Doesn't have the app yet.  
* **Pain Point:** N/A.  
* **Our Goal:** Convert them. We allow the Anchor to track debts for them via a "Shadow Profile." When they finally join, they inherit all that history.

---

## **3\. Functional Requirements**

### **3.1 Module: Contact Management (The Viral Engine)**

**FR 1.1 \- Shadow Contacts**

* User can create a contact manually (Name \+ Phone Number).  
* This contact is stored locally as a "Shadow User."  
* **Constraint:** Phone number must be unique to enable future linking.

**FR 1.2 \- Profile Bridging (The "Magic Moment")**

* When a real user signs up with a phone number, the system checks for any "Shadow Profiles" created by other users with that number.  
* **Action:** The system merges the Shadow ID into the Real User ID.  
* **Result:** The new user instantly sees "You owe Bob $50" upon their first login.

### **3.2 Module: Transaction Engine (The Hybrid Core)**

**FR 2.1 \- The "Who Paid" Logic**

* Every transaction must define a **Payer**.  
* If Payer \= Current User \-\> Select Source Account (e.g., "Chase Debit").  
* If Payer \= Friend \-\> Source Account is NULL (Money didn't leave my wallet).

**FR 2.2 \- Split Logic**

* User enters Total Amount.  
* User selects friends involved.  
* **Default:** Split Equally.  
* **Advanced:** Split by exact amounts, percentages, or shares.

### **3.3 Module: Settlement Engine (The "Allocation" Upgrade)**

**FR 3.1 \- Partial Payments**

* Users can pay any amount (e.g., paying $50 towards a $100 debt).  
* The system uses the **Allocation Model**: We do not mark bills as "Paid" (Boolean). We subtract `Allocated Amount` from `Original Amount`.

**FR 3.2 \- FIFO Auto-Allocation**

* If a user pays a lump sum (e.g., "Here is $100 for everything"), the system applies it to debts in chronological order (First In, First Out).

**FR 3.3 \- Cross-Currency Settlements**

* If a debt is in **INR** but settled in **USD**:  
  * User inputs the Settlement Amount ($12).  
  * User inputs the Exchange Rate for *this specific transaction*.  
  * System calculates the INR equivalent to reduce the debt balance.

---

## **4\. Technical Architecture & Database Schema**

This schema handles the "Allocation Model" to avoid the Partial Payment traps.

### **4.1 Users & Accounts**

SQL  
\-- 1\. GROUPING (e.g., "Credit Cards", "Cash")  
CREATE TABLE account\_groups (  
  id uuid PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
  user\_id uuid REFERENCES auth.users(id),  
  name text NOT NULL,  
  icon text  
);

\-- 2\. PHYSICAL ACCOUNTS (e.g., "Chase Sapphire")  
CREATE TABLE accounts (  
  id uuid PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
  user\_id uuid REFERENCES auth.users(id) NOT NULL,  
  group\_id uuid REFERENCES account\_groups(id),  
  name text NOT NULL,  
  currency\_code text DEFAULT 'USD',  
  current\_balance numeric(12,2) DEFAULT 0.00  
);

\-- 3\. THE SOCIAL GRAPH  
CREATE TABLE contacts (  
  id uuid PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
  owner\_id uuid REFERENCES auth.users(id) NOT NULL,  
  name text NOT NULL,  
  phone\_number text, \-- The Key for Viral Linking  
  linked\_profile\_id uuid REFERENCES auth.users(id) \-- NULL \= Shadow, UUID \= Real User  
);

### **4.2 The Hybrid Ledger (Core Logic)**

SQL  
\-- 4\. THE PARENT: PHYSICAL MOVEMENT  
CREATE TABLE transactions (  
  id uuid PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
  created\_by uuid REFERENCES auth.users(id) NOT NULL,  
    
  \-- The Money Source  
  account\_id uuid REFERENCES accounts(id), \-- Null if I didn't pay  
  payer\_id uuid REFERENCES contacts(id),   \-- Link to friend if they paid  
    
  total\_amount numeric(12,2) NOT NULL,  
  currency\_code text NOT NULL,  
  exchange\_rate numeric(12,6) DEFAULT 1.0, \-- Rate to user's base currency  
    
  description text,  
  occurred\_at timestamp DEFAULT now()  
);

\-- 5\. THE CHILD: LIABILITY LOGIC  
CREATE TABLE splits (  
  id uuid PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
  transaction\_id uuid REFERENCES transactions(id) ON DELETE CASCADE,  
  contact\_id uuid REFERENCES contacts(id) NOT NULL,  
  category\_id uuid,   
    
  \-- Positive \= They Owe Me. Negative \= I Owe Them.  
  amount numeric(12,2) NOT NULL,  
    
  \-- Type Definitions  
  split\_type text CHECK (split\_type IN ('DEBT', 'PAYMENT')) DEFAULT 'DEBT'  
);

\-- 6\. THE FIX: SETTLEMENT ALLOCATIONS  
\-- This table solves the "Partial Payment" problem.  
CREATE TABLE settlement\_allocations (  
  id uuid PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    
  payment\_split\_id uuid REFERENCES splits(id) NOT NULL, \-- The Cash  
  debt\_split\_id uuid REFERENCES splits(id) NOT NULL,    \-- The Bill  
    
  allocated\_amount numeric(12,2) NOT NULL CHECK (allocated\_amount \> 0),  
    
  created\_at timestamp DEFAULT now(),  
  UNIQUE(payment\_split\_id, debt\_split\_id)  
);

---

## **5\. UX/UI Flows**

### **5.1 The "Add Expense" Flow**

1. **Tap "+" Button.**  
2. **Input Amount:** "200"  
3. **Input Currency:** "AED" (Auto-detected based on location).  
4. **Select "Paid By":** Defaults to "Me" (Source: Cash).  
5. **Select "Split With":** Select "Bob" and "Alice".  
6. **Review:**  
   * Me: Paid 200\. Owed 66.6 by Bob, 66.6 by Alice.  
   * Net Cost to Me: 66.6.  
7. **Save.**

### **5.2 The "Settle Up" Flow**

1. **Open Contact:** Click "Bob" (Shows: "Bob owes you $50").  
2. **Tap "Settle":**  
3. **Confirm Amount:** Bob hands you $50 cash.  
4. **Select Destination:** "Where did you put this money?" \-\> Select "Wallet (Cash)".  
5. **Confirm:** The app creates a `PAYMENT` transaction and auto-allocates it to the oldest debt.

---

## **6\. Non-Functional Requirements**

### **6.1 Offline First**

* The app must allow adding transactions without internet.  
* Data syncs to Supabase once the connection is restored.

### **6.2 Data Integrity**

* **Currency Precision:** All monetary values stored as `numeric(12,2)` to prevent floating-point errors.  
* **Audit Trail:** Transactions cannot be hard-deleted, only "Archived" (soft delete) to maintain ledger integrity.

---

## **7\. Success Metrics**

1. **Retention:** % of users who log at least 1 transaction per week.  
2. **Viral Coefficient:** Average number of "Real Users" spawned from "Shadow Contacts" per active user.  
3. **Settlement Speed:** Average time (in days) between "Debt Creation" and "Settlement."

