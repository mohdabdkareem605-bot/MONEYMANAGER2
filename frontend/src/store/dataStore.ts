import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  currency_code: string;
  current_balance: number;
  group_id?: string;
}

export interface Contact {
  id: string;
  owner_id: string;
  name: string;
  phone_number?: string;
  email?: string;
  linked_profile_id?: string;
  net_balance?: number;
}

export interface Split {
  id: string;
  transaction_id: string;
  contact_id: string;
  contact_name?: string;
  amount: number;
  currency_code: string;
  exchange_rate_used: number;
  split_type: 'DEBT' | 'PAYMENT';
  category_id?: string;
}

// Currency balance for a specific currency
export interface CurrencyBalance {
  currency_code: string;
  net_balance: number; // Positive = they owe me, Negative = I owe them
}

// Contact balance with multi-currency support
export interface ContactBalanceMultiCurrency {
  contact_id: string;
  contact_name: string;
  balances: CurrencyBalance[];
  total_in_primary: number; // Aggregated to user's primary currency
}

export interface Transaction {
  id: string;
  created_by: string;
  account_id?: string;
  account_name?: string;
  payer_contact_id?: string;
  payer_name?: string;
  total_amount: number;
  currency_code: string;
  exchange_rate: number;
  description?: string;
  occurred_at: string;
  transaction_type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'SETTLEMENT';
  category_id?: string;
  category_name?: string;
  splits: Split[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_system: boolean;
}

export interface DashboardSummary {
  total_balance: number;
  total_owed_to_you: number;
  total_you_owe: number;
  net_balance: number;
  // New fields for enhanced dashboard
  total_income: number;
  total_expenses: number;
  net_savings: number;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  category_expenses?: Record<string, number>;
}

export interface UserProfile {
  id: string;
  phone_number?: string;
  name?: string;
  base_currency: string;
}

// Exchange rates (1 USD = X currency)
export const EXCHANGE_RATES: Record<string, number> = {
  'USD': 1,
  'INR': 90,
  'AED': 3.67,
  'EUR': 0.92,
  'GBP': 0.79,
};

// Convert to target currency
export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
  const toRate = EXCHANGE_RATES[toCurrency] || 1;
  return (amount / fromRate) * toRate;
};

interface DataState {
  // Data
  accounts: Account[];
  contacts: Contact[];
  transactions: Transaction[];
  categories: Category[];
  dashboardSummary: DashboardSummary | null;
  contactBalances: ContactBalanceMultiCurrency[];
  userProfile: UserProfile | null;

  // Loading states
  loading: boolean;

  // Actions
  fetchUserProfile: () => Promise<void>;
  updatePrimaryCurrency: (currency: string) => Promise<void>;

  fetchAccounts: () => Promise<void>;
  createAccount: (data: Partial<Account>) => Promise<Account | null>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<Account | null>;


  fetchContacts: () => Promise<void>;
  createContact: (data: { name: string; phone_number?: string; email?: string }) => Promise<Contact | null>;
  deleteContact: (id: string) => Promise<void>;

  fetchTransactions: () => Promise<void>;
  createTransaction: (data: {
    account_id?: string;
    payer_contact_id?: string;
    total_amount: number;
    currency_code: string;
    description?: string;
    transaction_type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    category_id?: string;
    splits: { contact_id: string; amount: number }[];
  }) => Promise<Transaction | null>;

  fetchCategories: () => Promise<void>;
  fetchDashboard: () => Promise<void>;
  fetchContactBalances: () => Promise<void>;

  createSettlement: (data: {
    contact_id: string;
    amount: number;
    account_id: string;
    direction: 'you_pay' | 'they_pay';
  }) => Promise<void>;

  getSettlementPreview: (data: {
    contact_id: string;
    amount: number;
    account_id: string;
    direction: 'you_pay' | 'they_pay';
  }) => Promise<{
    splits: { amount: number; currency_code: string; split_type: 'PAYMENT'; contact_id: string }[];
    accountDeduction: { amount: number; currency_code: string };
  } | null>;
}

export const useDataStore = create<DataState>((set, get) => ({
  accounts: [],
  contacts: [],
  transactions: [],
  categories: [],
  dashboardSummary: null,
  contactBalances: [],
  userProfile: null,
  loading: false,

  fetchUserProfile: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, phone_number, name, base_currency')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      set({ userProfile: data });
    } catch (error) {
      console.error('Fetch user profile error:', error);
    }
  },

  updatePrimaryCurrency: async (currency: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_profiles')
        .update({ base_currency: currency })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      const profile = get().userProfile;
      if (profile) {
        set({ userProfile: { ...profile, base_currency: currency } });
      }

      // Refresh dashboard with new currency
      await get().fetchDashboard();
    } catch (error) {
      console.error('Update primary currency error:', error);
    }
  },

  fetchAccounts: async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ accounts: data || [] });
    } catch (error) {
      console.error('Fetch accounts error:', error);
    }
  },

  createAccount: async (accountData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          name: accountData.name,
          currency_code: accountData.currency_code || 'USD',
          current_balance: accountData.current_balance || 0,
        })
        .select()
        .single();

      if (error) throw error;

      set({ accounts: [data, ...get().accounts] });
      return data;
    } catch (error) {
      console.error('Create account error:', error);
      return null;
    }
  },

  updateAccount: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      const accounts = get().accounts.map(a =>
        a.id === id ? { ...a, ...data } : a
      );
      set({ accounts });
      return data;
    } catch (error) {
      console.error('Update account error:', error);
      return null;
    }
  },


  fetchContacts: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Contacts I own (people I added)
      const { data: myContacts, error: error1 } = await supabase
        .from('contacts')
        .select('*')
        .eq('owner_id', user.id)
        .order('name');

      if (error1) throw error1;

      // 2. Contacts where I am linked (people who added me)
      // These are "reverse contacts" - we need to show the owner as a friend
      const { data: reverseContacts, error: error2 } = await supabase
        .from('contacts')
        .select('id, owner_id, name, phone_number, email, linked_profile_id')
        .eq('linked_profile_id', user.id)
        .neq('owner_id', user.id); // Exclude self-owned contacts

      if (error2) {
        console.error('Error fetching reverse contacts:', error2);
      }

      // Get owner names from user_profiles for reverse contacts
      const ownerIds = (reverseContacts || []).map(rc => rc.owner_id);
      let ownerProfiles: { id: string; name: string; phone_number: string | null }[] = [];

      if (ownerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, name, phone_number')
          .in('id', ownerIds);
        ownerProfiles = profiles || [];
      }

      // Create virtual contact entries for reverse contacts
      // These represent "people who have me in their contacts"
      const virtualContacts: Contact[] = (reverseContacts || []).map(rc => {
        const ownerProfile = ownerProfiles.find(p => p.id === rc.owner_id);
        return {
          id: `reverse_${rc.id}`, // Prefix to distinguish from regular contacts
          owner_id: user.id, // Virtual owner (current user)
          name: ownerProfile?.name || 'Unknown User',
          phone_number: ownerProfile?.phone_number || undefined,
          linked_profile_id: rc.owner_id, // Link to the actual owner
        } as Contact;
      });

      // Combine and deduplicate (if both users added each other)
      const allContacts = [...(myContacts || [])];
      for (const vc of virtualContacts) {
        // Check if we already have a contact with this linked_profile_id
        const existing = allContacts.find(c => c.linked_profile_id === vc.linked_profile_id);
        if (!existing) {
          allContacts.push(vc);
        }
      }

      set({ contacts: allContacts.sort((a, b) => a.name.localeCompare(b.name)) });
    } catch (error) {
      console.error('Fetch contacts error:', error);
    }
  },

  createContact: async (contactData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('contacts')
        .insert({
          owner_id: user.id,
          name: contactData.name,
          phone_number: contactData.phone_number,
          email: contactData.email,
        })
        .select()
        .single();

      if (error) throw error;

      set({ contacts: [...get().contacts, data].sort((a, b) => a.name.localeCompare(b.name)) });
      return data;
    } catch (error) {
      console.error('Create contact error:', error);
      throw error;
    }
  },

  deleteContact: async (id) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set({ contacts: get().contacts.filter(c => c.id !== id) });
    } catch (error) {
      console.error('Delete contact error:', error);
    }
  },

  fetchTransactions: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch transactions
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          accounts:accounts!transactions_account_id_fkey(name),
          categories(name),
          payer:contacts!transactions_payer_contact_id_fkey(name)
        `)
        .eq('archived', false)
        .order('occurred_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch splits for each transaction
      const transactionsWithSplits = await Promise.all(
        (transactions || []).map(async (tx) => {
          const { data: splits } = await supabase
            .from('splits')
            .select(`
              *,
              contacts(name)
            `)
            .eq('transaction_id', tx.id);

          return {
            ...tx,
            account_name: tx.accounts?.name,
            category_name: (tx as any).categories?.name,
            payer_name: tx.payer?.name || (tx.created_by === user.id ? 'You' : undefined),
            splits: (splits || []).map(s => ({
              ...s,
              contact_name: s.contacts?.name,
            })),
          };
        })
      );

      set({ transactions: transactionsWithSplits });
    } catch (error) {
      console.error('Fetch transactions error:', error);
    }
  },

  createTransaction: async (txData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found for transaction');
        return null;
      }

      // Log transaction data for debugging
      console.log('Creating transaction with data:', JSON.stringify({
        created_by: user.id,
        account_id: txData.account_id,
        total_amount: txData.total_amount,
        currency_code: txData.currency_code,
        description: txData.description,
        transaction_type: txData.transaction_type,
        category_id: txData.category_id,
      }, null, 2));

      // Create transaction (note: category_id column doesn't exist yet, storing category name in description)
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          created_by: user.id,
          account_id: txData.account_id,
          payer_contact_id: txData.payer_contact_id,
          total_amount: txData.total_amount,
          currency_code: txData.currency_code,
          exchange_rate: 1.0,
          description: txData.description,
          transaction_type: txData.transaction_type,
          category_id: txData.category_id,
        })
        .select()
        .single();

      if (txError) {
        console.error('Transaction insert error:', txError.message, txError.details, txError.hint);
        throw txError;
      }

      // Process Splits: Ensure we are not creating splits on contacts we don't own (Reverse Contacts)
      const finalSplits = [];
      if (txData.splits.length > 0) {
        for (const split of txData.splits) {
          let targetContactId = split.contact_id;

          // 1. Check if the contact belongs to me
          const contact = get().contacts.find(c => c.id === split.contact_id);

          // If contact is not found OR calls for a reverse contact (owned by someone else)
          // We need to find the REAL contact in MY list that corresponds to THEM.
          // Note: fetchContacts already creates a virtual contact with ID 'reverse_<id>',
          // but AddTransaction strips 'reverse_', so we get the raw ID of the contact owned by THEM.

          if (contact && contact.owner_id !== user.id && contact.linked_profile_id === user.id) {
            console.log(`Processing Reverse Contact Split: ${contact.id} (Owned by ${contact.owner_id})`);
            const targetUserId = contact.owner_id;

            // Find MY contact that links to targetUserId
            // We need to search the database because 'contacts' store might be filtered or incomplete?
            // Actually, 'contacts' in store includes my contacts.
            const myContactForThem = get().contacts.find(c =>
              c.owner_id === user.id && c.linked_profile_id === targetUserId
            );

            if (myContactForThem) {
              console.log(`Found existing contact for them: ${myContactForThem.id}`);
              targetContactId = myContactForThem.id;
            } else {
              console.log(`No contact found for user ${targetUserId}. Creating one...`);
              // Create a new contact for them
              // We need their name. We can use the name from the reverse contact as a fallback
              const newContactName = contact.name || 'Friend';

              const { data: newContact, error: createError } = await supabase
                .from('contacts')
                .insert({
                  owner_id: user.id,
                  name: newContactName,
                  linked_profile_id: targetUserId,
                  // phone_number and email might be unavailable, that's fine
                })
                .select()
                .single();

              if (createError) {
                console.error('Failed to create contact for split:', createError);
                throw createError;
              }

              targetContactId = newContact.id;

              // Optimistically update store? fetchContacts will be called later anyway.
            }
          }

          finalSplits.push({
            transaction_id: transaction.id,
            contact_id: targetContactId,
            amount: split.amount,
            currency_code: txData.currency_code,
            split_type: 'DEBT', // As per original logic
            created_by: user.id,
          });
        }

        const { error: splitError } = await supabase
          .from('splits')
          .insert(finalSplits);

        if (splitError) throw splitError;
      }

      // Update account balance based on transaction type
      if (txData.account_id) {
        const account = get().accounts.find(a => a.id === txData.account_id);
        if (account) {
          // Income ADDS to balance, Expense SUBTRACTS from balance

          let amountInAccountCurrency = txData.total_amount;
          const accountCurrency = account.currency_code || 'USD';
          const txCurrency = txData.currency_code || 'USD';

          if (txCurrency !== accountCurrency) {
            amountInAccountCurrency = convertCurrency(txData.total_amount, txCurrency, accountCurrency);
          }

          const balanceChange = txData.transaction_type === 'INCOME'
            ? amountInAccountCurrency
            : -amountInAccountCurrency;

          const newBalance = account.current_balance + balanceChange;
          await supabase
            .from('accounts')
            .update({ current_balance: newBalance })
            .eq('id', txData.account_id);
        }
      }

      // Refresh data
      await get().fetchTransactions();
      await get().fetchAccounts();
      await get().fetchContactBalances();

      return transaction;
    } catch (error) {
      console.error('Create transaction error:', error);
      return null;
    }
  },

  fetchCategories: async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      set({ categories: data || [] });
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  },

  fetchDashboard: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's primary currency
      const userProfile = get().userProfile;
      const primaryCurrency = userProfile?.base_currency || 'USD';

      // Helper to convert amounts to primary currency
      const toPrimary = (amount: number, fromCurrency: string) => {
        return convertCurrency(amount, fromCurrency, primaryCurrency);
      };

      // Get all accounts with currency
      const { data: accounts } = await supabase
        .from('accounts')
        .select('current_balance, currency_code');

      // Calculate total account balance in primary currency
      const totalBalance = (accounts || []).reduce(
        (sum, a) => sum + toPrimary(Number(a.current_balance), a.currency_code || 'USD'), 0
      );

      // Get all transactions WITH their splits for proper expense calculation
      // For EXPENSE: actual_expense = total_amount - sum(DEBT splits)
      // Split amounts are receivables (assets), not expenses
      const { data: transactions } = await supabase
        .from('transactions')
        .select(`
          id,
          total_amount, 
          currency_code, 
          transaction_type,
          categories (name),
          splits (amount, currency_code, split_type)
        `)
        .eq('created_by', user.id);

      let totalIncome = 0;
      let totalExpenses = 0;

      const categoryExpenses: Record<string, number> = {};

      (transactions || []).forEach(tx => {
        const txAmount = toPrimary(Number(tx.total_amount), tx.currency_code || 'USD');

        if (tx.transaction_type === 'INCOME') {
          totalIncome += txAmount;
        } else if (tx.transaction_type === 'EXPENSE') {
          // Calculate sum of DEBT splits (money owed by others)
          const debtSplits = (tx.splits || []).filter((s: any) => s.split_type === 'DEBT');
          const splitTotal = debtSplits.reduce((sum: number, s: any) => {
            return sum + toPrimary(Number(s.amount), s.currency_code || 'USD');
          }, 0);

          // Actual expense = total - what others owe me
          const actualExpense = txAmount - splitTotal;
          const myExpense = Math.max(0, actualExpense);
          totalExpenses += myExpense;

          // Add to category
          const txAny: any = tx;
          const catName = txAny.categories?.name || 'Uncategorized';
          if (!categoryExpenses[catName]) categoryExpenses[catName] = 0;
          categoryExpenses[catName] += myExpense;
        }
        // TRANSFER transactions are ignored for income/expense calculation
      });


      // Get splits owned by user to calculate what's owed TO them (DEBT splits on contacts)
      const { data: myContacts } = await supabase
        .from('contacts')
        .select('id')
        .eq('owner_id', user.id);

      const myContactIds = (myContacts || []).map(c => c.id);

      let totalOwed = 0; // Others owe me
      let totalOwing = 0; // I owe others

      if (myContactIds.length > 0) {
        // Get splits on my contacts (these are debts others owe me)
        const { data: mySplits } = await supabase
          .from('splits')
          .select('amount, currency_code, split_type')
          .in('contact_id', myContactIds);

        (mySplits || []).forEach(split => {
          const amount = toPrimary(Number(split.amount), split.currency_code || 'USD');
          if (split.split_type === 'DEBT') {
            totalOwed += amount;
          } else if (split.split_type === 'PAYMENT') {
            totalOwed -= amount; // Payments reduce what's owed
          }
        });
      }

      // Get reverse contacts (others who added me) to calculate what I owe
      const { data: reverseContacts } = await supabase
        .from('contacts')
        .select('id')
        .eq('linked_profile_id', user.id);

      const reverseContactIds = (reverseContacts || []).map(c => c.id);

      // Add "Shared Expenses" to Category Totals (Expenses others paid for me)
      // We need to fetch these splits WITH their transaction details (to get category)
      // This is partially covered by `reverseContactIds` logic (theirSplits)
      // but `theirSplits` query above didn't include transaction category info.
      // Let's refine the query in `theirSplits` block or do a separate pass?
      // Re-using `theirSplits` block seems efficient.

      if (reverseContactIds.length > 0) {
        // Fetch splits on me (created by others) - these are my expenses paid by others
        // Need to join Transaction -> Category
        const { data: theirSplits } = await supabase
          .from('splits')
          .select(`
            amount, 
            currency_code, 
            split_type,
            transactions (
              transaction_type,
              categories (name)
            )
          `)
          .in('contact_id', reverseContactIds);

        (theirSplits || []).forEach(split => {
          const amount = toPrimary(Number(split.amount), split.currency_code || 'USD');
          const txData: any = split.transactions;
          const txType = Array.isArray(txData) ? txData[0]?.transaction_type : txData?.transaction_type;
          const catName = (Array.isArray(txData) ? txData[0]?.categories?.name : txData?.categories?.name) || 'Uncategorized';

          if (split.split_type === 'DEBT') {
            totalOwing += amount;

            // This is an EXPENSE for me (Paid by them)
            // Only if transaction type is EXPENSE (They paid for something)
            if (txType === 'EXPENSE') {
              totalExpenses += amount;
              if (!categoryExpenses[catName]) categoryExpenses[catName] = 0;
              categoryExpenses[catName] += amount;
            }

          } else if (split.split_type === 'PAYMENT') {
            totalOwing -= amount; // Payments reduce what I owe
          }
        });
      }

      // Calculate derived values
      const netSavings = totalIncome - totalExpenses;
      const totalAssets = totalBalance + Math.max(0, totalOwed); // Account balance + owed to me
      const totalLiabilities = Math.max(0, totalOwing); // What I owe
      const netWorth = totalAssets - totalLiabilities;

      set({
        dashboardSummary: {
          total_balance: totalBalance,
          total_owed_to_you: Math.max(0, totalOwed),
          total_you_owe: Math.max(0, totalOwing),
          net_balance: totalOwed - totalOwing,
          total_income: totalIncome,
          total_expenses: totalExpenses,
          net_savings: netSavings,
          total_assets: totalAssets,
          total_liabilities: totalLiabilities,
          net_worth: netWorth,
          category_expenses: categoryExpenses,
        },
      });
    } catch (error) {
      console.error('Fetch dashboard error:', error);
    }
  },


  fetchContactBalances: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('fetchContactBalances: No user logged in');
        return;
      }

      const contacts = get().contacts;
      const balances: ContactBalanceMultiCurrency[] = [];

      for (const contact of contacts) {
        const currencyBalances: Record<string, number> = {};
        const isReverseContact = contact.id.startsWith('reverse_');
        const originalContactId = isReverseContact
          ? contact.id.replace('reverse_', '')
          : contact.id;

        if (isReverseContact) {
          // REVERSE CONTACT: Someone else added me and created splits
          // Splits on the original contact represent what I owe THEM
          const { data: theirSplits } = await supabase
            .from('splits')
            .select(`
              amount, 
              split_type, 
              currency_code,
              currency_code,
              created_by,
              transactions (transaction_type, payer_contact_id)
            `)
            .eq('contact_id', originalContactId);

          for (const split of theirSplits || []) {
            const currency = split.currency_code || 'USD';
            if (!currencyBalances[currency]) currencyBalances[currency] = 0;
            const txData: any = split.transactions;
            const txType = Array.isArray(txData) ? txData[0]?.transaction_type : txData?.transaction_type;

            if (split.split_type === 'DEBT') {
              if (split.created_by === user.id) {
                // I created the split on their contact (representing Me in their list)
                // This implies I Paid and allocated debt to... "Me in their list"?
                // This is the "Bad Data" case.
                // If I paid, and I put debt on "Me", it means "I owe myself"? 
                // No, usually if I created it, I paid.
                // If I paid, and I attached it to this contact... 
                // If this contact ID is "Reverse", it means it's "Me".
                // So "Me owes Me". Net 0.
                // But wait, the user wants to see "They owe me".
                // If I created it, I likely intended "They owe me".
                // But I put it on the wrong contact.
                // Let's assume positive for now to fix the display?
                // No, strictly: 
                // Created by Me -> I Paid.
                // Contact is "Me".
                // "Me" Owes "Me".
                // Balance impact: 0.
                // But let's check the logic I wrote earlier:
                // "If I created it (on their contact), it means I paid -> They Owe Me (Positive)"
                // If I follow that, I recover the data.
                currencyBalances[currency] += Number(split.amount);
              } else {
                // They created it -> They Paid.
                // Contact is "Me".
                // "Me" Owes "Them".
                currencyBalances[currency] -= Number(split.amount);
              }
            } else if (split.split_type === 'PAYMENT') {
              // Payment logic
              // If created by Me -> I Paid -> I settle debt -> Balance increases (Negative gets closer to 0)
              if (split.created_by === user.id) {
                currencyBalances[currency] += Number(split.amount);
              } else {
                currencyBalances[currency] -= Number(split.amount);
              }
            }
          }
        } else {
          // REGULAR CONTACT: I added them
          // 1. Splits I created for this contact
          const { data: splitsICreated } = await supabase
            .from('splits')
            .select(`
              amount, 
              split_type, 
              currency_code,
              currency_code,
              currency_code,
              created_by,
              transactions (transaction_type, payer_contact_id)
            `)
            .eq('contact_id', contact.id);

          for (const split of splitsICreated || []) {
            const currency = split.currency_code || 'USD';
            if (!currencyBalances[currency]) currencyBalances[currency] = 0;
            const txData: any = split.transactions;
            const txType = Array.isArray(txData) ? txData[0]?.transaction_type : txData?.transaction_type;

            if (split.split_type === 'DEBT') {
              currencyBalances[currency] += Number(split.amount); // They owe me
            } else if (split.split_type === 'PAYMENT') {
              let isMyPayment = false;
              if (txType === 'EXPENSE') isMyPayment = true;
              else if (txType === 'SETTLEMENT') {
                const payerId = (txData as any).payer_contact_id;
                isMyPayment = !payerId || payerId === user.id;
              }

              if (isMyPayment) {
                // I Paid Out. It settles my debt.
                // Balance increases (e.g. -500 + 500 = 0)
                currencyBalances[currency] += Number(split.amount);
              } else {
                // I Received (INCOME or Settlement from them).
                // They paid me.
                // Balance decreases (e.g. +500 - 500 = 0)
                currencyBalances[currency] -= Number(split.amount);
              }
            }
          }

          // 2. Splits they created where I am the debtor (I owe them - negative)
          if (contact.linked_profile_id) {
            const { data: theirContactForMe } = await supabase
              .from('contacts')
              .select('id')
              .eq('owner_id', contact.linked_profile_id)
              .eq('linked_profile_id', user.id)
              .maybeSingle();

            if (theirContactForMe) {
              const { data: splitsTheyCreated } = await supabase
                .from('splits')
                .select(`
                  amount, 
                  split_type, 
                  currency_code,
                  currency_code,
                  currency_code,
                  created_by,
                  transactions (transaction_type, payer_contact_id)
                `)
                .eq('contact_id', theirContactForMe.id);

              for (const split of splitsTheyCreated || []) {
                const currency = split.currency_code || 'USD';
                if (!currencyBalances[currency]) currencyBalances[currency] = 0;
                const txData: any = split.transactions;
                const txType = Array.isArray(txData) ? txData[0]?.transaction_type : txData?.transaction_type;

                if (split.split_type === 'DEBT') {
                  currencyBalances[currency] -= Number(split.amount); // I owe them (Negative)
                } else if (split.split_type === 'PAYMENT') {

                  // Determine Direction for SETTLEMENT
                  let iPaid = false;
                  if (txType === 'EXPENSE') {
                    // They Paid (Expense).
                    iPaid = false;
                  } else if (txType === 'SETTLEMENT') {
                    const payerId = (txData as any).payer_contact_id;
                    iPaid = !!payerId;
                  } else {
                    // INCOME (They Received).
                    // I Paid Them.
                    iPaid = true;
                  }

                  if (iPaid) {
                    // I Paid Them.
                    // My Debt decreases. (Add to negative).
                    currencyBalances[currency] += Number(split.amount);
                  } else {
                    // They Paid Me.
                    // My Debt Increases (Subtract).
                    currencyBalances[currency] -= Number(split.amount);
                  }
                }
              }
            }
          }
        }

        // Convert to array and filter out zero balances
        const balanceArray: CurrencyBalance[] = Object.entries(currencyBalances)
          .filter(([_, balance]) => Math.abs(balance) > 0.01)
          .map(([currency, balance]) => ({
            currency_code: currency,
            net_balance: balance,
          }));

        // Calculate total in primary currency (USD)
        const userProfile = get().userProfile;
        const primaryCurrency = userProfile?.base_currency || 'USD';

        const totalInPrimary = balanceArray.reduce((sum, b) => {
          return sum + convertCurrency(b.net_balance, b.currency_code, primaryCurrency);
        }, 0);

        balances.push({
          contact_id: contact.id,
          contact_name: contact.name,
          balances: balanceArray,
          total_in_primary: totalInPrimary,
        });
      }

      set({ contactBalances: balances });
    } catch (error) {
      console.error('Fetch contact balances error:', error);
    }
  },

  getSettlementPreview: async (data) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const account = get().accounts.find(a => a.id === data.account_id);
      const paymentCurrency = account?.currency_code || 'USD';
      const convert = convertCurrency;

      // Contact Resolution
      const isReverseContact = data.contact_id.startsWith('reverse_');
      const originalContactId = isReverseContact
        ? data.contact_id.replace('reverse_', '')
        : data.contact_id;
      let targetContactId = originalContactId;
      const passedContact = get().contacts.find(c => c.id === data.contact_id);

      if (isReverseContact) {
        const theirUserId = passedContact?.linked_profile_id;
        if (theirUserId) {
          const myContactForThem = get().contacts.find(
            c => !c.id.startsWith('reverse_') && c.linked_profile_id === theirUserId
          );
          if (myContactForThem) targetContactId = myContactForThem.id;
        }
      } else {
        targetContactId = originalContactId;
      }

      // Verify ownership (simplified for preview, but robustness helps)
      const { data: targetContactData } = await supabase
        .from('contacts')
        .select('id, owner_id')
        .eq('id', targetContactId)
        .maybeSingle();

      if (targetContactData && targetContactData.owner_id !== user.id) {
        // Try to find our contact if ownership mismatch
        // (Skipping deep search for preview speed, usually unnecessary if UI passes valid IDs)
        // But let's stick to simple resolution for now.
      }

      // Fetch outstanding debts
      const { data: existingDebts } = await supabase
        .from('splits')
        .select('id, amount, currency_code, split_type')
        .eq('contact_id', targetContactId)
        .eq('split_type', 'DEBT');


      // Get allocations to calculate remaining
      const debtIds = existingDebts?.map(d => d.id) || [];
      let previousAllocations: any[] = [];
      if (debtIds.length > 0) {
        const { data: allocs } = await supabase
          .from('settlement_allocations')
          .select('debt_split_id, amount_allocated')
          .in('debt_split_id', debtIds);
        previousAllocations = allocs || [];
      }

      const debtsWithBalance = (existingDebts || []).map(d => {
        const allocated = previousAllocations
          .filter(a => a.debt_split_id === d.id)
          .reduce((sum, a) => sum + Number(a.amount_allocated), 0);
        return { ...d, remaining: Number(d.amount) - allocated };
      }).filter(d => d.remaining > 0.01);
      // Sort by logic? createSettlement uses creation date.
      // Preview doesn't have creation date in this query.
      // Let's assume order doesn't matter strictly for total preview, but it does for specific debt payoff.
      // I should probably add created_at to query.

      // Allocation Logic
      const splitsToCreate: { amount: number; currency_code: string; split_type: 'PAYMENT'; contact_id: string }[] = [];
      let remainingPayment = data.amount;

      // Phase 1
      const matchingDebts = debtsWithBalance.filter(d => (d.currency_code || 'USD') === paymentCurrency);
      for (const debt of matchingDebts) {
        if (remainingPayment <= 0.01) break;
        const allocationAmount = Math.min(remainingPayment, debt.remaining);
        if (allocationAmount > 0.01) {
          splitsToCreate.push({
            amount: allocationAmount,
            currency_code: paymentCurrency,
            split_type: 'PAYMENT',
            contact_id: targetContactId,
          });
          remainingPayment -= allocationAmount;
        }
      }

      // Phase 2
      if (remainingPayment > 0.01) {
        const otherDebts = debtsWithBalance.filter(d => (d.currency_code || 'USD') !== paymentCurrency);
        for (const debt of otherDebts) {
          if (remainingPayment <= 0.01) break;
          const debtCurrency = debt.currency_code || 'USD';
          const paymentValueInDebtCurrency = convert(remainingPayment, paymentCurrency, debtCurrency);
          const allocationAmountInDebtCurrency = Math.min(paymentValueInDebtCurrency, debt.remaining);

          if (allocationAmountInDebtCurrency > 0.01) {
            splitsToCreate.push({
              amount: allocationAmountInDebtCurrency,
              currency_code: debtCurrency,
              split_type: 'PAYMENT',
              contact_id: targetContactId,
            });
            const usedValueInPaymentCurrency = convert(allocationAmountInDebtCurrency, debtCurrency, paymentCurrency);
            remainingPayment -= usedValueInPaymentCurrency;
          }
        }
      }

      // Phase 3
      if (remainingPayment > 0.01) {
        splitsToCreate.push({
          amount: remainingPayment,
          currency_code: paymentCurrency,
          split_type: 'PAYMENT',
          contact_id: targetContactId,
        });
      }

      // Account Deduction
      let amountInAccountCurrency = data.amount;
      const accountCurrency = account?.currency_code || 'USD';
      if (paymentCurrency !== accountCurrency) {
        amountInAccountCurrency = convert(data.amount, paymentCurrency, accountCurrency);
      }

      return {
        splits: splitsToCreate,
        accountDeduction: {
          amount: amountInAccountCurrency,
          currency_code: accountCurrency
        }
      };
    } catch (error) {
      console.error('Preview settlement error:', error);
      return null;
    }
  },

  createSettlement: async (data) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get payment currency from account
      const account = get().accounts.find(a => a.id === data.account_id);
      const paymentCurrency = account?.currency_code || 'USD';

      // Levearge module-scope shared helpers
      const convert = convertCurrency;

      // Handle reverse contacts - strip the prefix
      const isReverseContact = data.contact_id.startsWith('reverse_');
      const originalContactId = isReverseContact
        ? data.contact_id.replace('reverse_', '')
        : data.contact_id;

      // CRITICAL FIX: Always find the contact that the CURRENT USER owns
      let targetContactId = originalContactId;

      // Get the contact from our list
      const passedContact = get().contacts.find(c => c.id === data.contact_id);

      if (isReverseContact) {
        // This is a reverse contact (someone else added us)
        const theirUserId = passedContact?.linked_profile_id;
        if (theirUserId) {
          // Find our contact that links to them
          const myContactForThem = get().contacts.find(
            c => !c.id.startsWith('reverse_') && c.linked_profile_id === theirUserId
          );
          if (myContactForThem) {
            targetContactId = myContactForThem.id;
          }
        }
      } else {
        // This is our own contact - use it directly
        targetContactId = originalContactId;
      }

      console.log('[Settlement] Contact resolution:', {
        passedId: data.contact_id,
        isReverse: isReverseContact,
        resolvedTargetId: targetContactId,
        direction: data.direction,
      });

      // Verify the target contact is owned by the current user
      const { data: targetContactData } = await supabase
        .from('contacts')
        .select('id, owner_id, linked_profile_id')
        .eq('id', targetContactId)
        .maybeSingle();

      if (targetContactData && targetContactData.owner_id !== user.id) {
        // Contact not owned by us, try to find ours
        const otherUserId = targetContactData.owner_id;
        const { data: ourContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('owner_id', user.id)
          .eq('linked_profile_id', otherUserId)
          .maybeSingle();

        if (ourContact) {
          targetContactId = ourContact.id;
        } else {
          console.error('[Settlement] No contact found for this user relationship');
          return;
        }
      }

      // Fetch outstanding debts (DEBT splits)
      // We need debts from:
      // 1. My contact for them (targetContactId) - In case I recorded "I owe them" (if supported)
      // 2. Their contact for me (Reverse Contact) - Where THEY recorded "I owe them"

      const contactIdsToCheck = [targetContactId];
      if (isReverseContact) {
        contactIdsToCheck.push(originalContactId);
      } else if (passedContact?.linked_profile_id) {
        // I initiated from my contact, check if they have a reverse contact for me
        const { data: theirContactForMe } = await supabase
          .from('contacts')
          .select('id')
          .eq('owner_id', passedContact.linked_profile_id)
          .eq('linked_profile_id', user.id)
          .maybeSingle();

        if (theirContactForMe) {
          contactIdsToCheck.push(theirContactForMe.id);
        }
      }

      console.log('[Settlement] Checking debts on contacts:', contactIdsToCheck);

      const { data: existingDebtsRaw } = await supabase
        .from('splits')
        .select('id, amount, currency_code, split_type, created_at, created_by')
        .in('contact_id', contactIdsToCheck)
        .eq('split_type', 'DEBT')
        .order('created_at', { ascending: true });

      // Filter for debts that strictly imply "I OWE THEM"
      // Current Logic: 
      // - If created_by == ME -> "They Owe Me" (Positive Balance) -> DO NOT SETTLE with Payment
      // - If created_by != ME -> "I Owe Them" (Negative Balance) -> SETTLE THIS

      const existingDebts = (existingDebtsRaw || []).filter(d => d.created_by !== user.id);

      // Calculate remaining debt for each split
      const debtIds = existingDebts?.map(d => d.id) || [];
      let previousAllocations: any[] = [];
      if (debtIds.length > 0) {
        const { data: allocs } = await supabase
          .from('settlement_allocations')
          .select('debt_split_id, amount_allocated')
          .in('debt_split_id', debtIds);
        previousAllocations = allocs || [];
      }

      const debtsWithBalance = (existingDebts || []).map(d => {
        const allocated = previousAllocations
          .filter(a => a.debt_split_id === d.id)
          .reduce((sum, a) => sum + Number(a.amount_allocated), 0);
        return { ...d, remaining: Number(d.amount) - allocated };
      }).filter(d => d.remaining > 0.01);

      // ---------------------------------------------------------
      // 2-PHASE ALLOCATION LOGIC (Strict Priority) + SPLIT CREATION
      // ---------------------------------------------------------

      const splitsToCreate: { amount: number; currency_code: string; split_type: 'PAYMENT'; contact_id: string }[] = [];
      let remainingPayment = data.amount;

      // Phase 1: Allocate to Debts matching Payment Currency (FIFO)
      const matchingDebts = debtsWithBalance.filter(d => (d.currency_code || 'USD') === paymentCurrency);

      for (const debt of matchingDebts) {
        if (remainingPayment <= 0.01) break;

        const allocationAmount = Math.min(remainingPayment, debt.remaining);
        if (allocationAmount > 0.01) {
          // Create Payment Split in Payment Currency (Matches Debt)
          splitsToCreate.push({
            amount: allocationAmount,
            currency_code: paymentCurrency,
            split_type: 'PAYMENT',
            contact_id: targetContactId,
          });

          remainingPayment -= allocationAmount;
        }
      }

      // Phase 2: Allocate remaining payment to Other Currencies (FIFO)
      if (remainingPayment > 0.01) {
        const otherDebts = debtsWithBalance.filter(d => (d.currency_code || 'USD') !== paymentCurrency);

        for (const debt of otherDebts) {
          if (remainingPayment <= 0.01) break;

          const debtCurrency = debt.currency_code || 'USD';

          // Convert REMAINING payment (in Payment Currency) to Debt Currency
          const paymentValueInDebtCurrency = convert(remainingPayment, paymentCurrency, debtCurrency);
          const allocationAmountInDebtCurrency = Math.min(paymentValueInDebtCurrency, debt.remaining);

          if (allocationAmountInDebtCurrency > 0.01) {
            // Create Payment Split in DEBT Currency (Locks in the rate)
            splitsToCreate.push({
              amount: allocationAmountInDebtCurrency,
              currency_code: debtCurrency,
              split_type: 'PAYMENT',
              contact_id: targetContactId,
            });

            // Deduct equivalent value in Payment Currency
            const usedValueInPaymentCurrency = convert(allocationAmountInDebtCurrency, debtCurrency, paymentCurrency);
            remainingPayment -= usedValueInPaymentCurrency;
          }
        }
      }

      // Phase 3: Remainder (Credit)
      if (remainingPayment > 0.01) {
        // Create Payment Split in Payment Currency for the remainder
        splitsToCreate.push({
          amount: remainingPayment,
          currency_code: paymentCurrency,
          split_type: 'PAYMENT',
          contact_id: targetContactId,
        });
      }

      // Create Transaction
      const txPayload: any = {
        created_by: user.id,
        total_amount: data.amount,
        currency_code: paymentCurrency,
        description: data.direction === 'you_pay' ? 'Payment sent' : 'Payment received',
        transaction_type: 'SETTLEMENT',
        account_id: data.account_id,
      };

      if (data.direction === 'you_pay') {
        txPayload.receiver_contact_id = targetContactId;
      } else {
        txPayload.payer_contact_id = targetContactId;
      }

      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert(txPayload)
        .select()
        .single();

      if (txError) throw txError;

      // Insert Splits (Allocated Splits)
      // Note: We are NO LONGER inserting into `settlement_allocations`.
      // The Splits themselves act as the allocation record.
      if (splitsToCreate.length > 0) {
        const { error: splitError } = await supabase
          .from('splits')
          .insert(splitsToCreate.map(s => ({
            transaction_id: transaction.id,
            ...s,
            created_by: user.id
          })));
        if (splitError) throw splitError;
      }

      // Update Account Balance
      if (account) {
        // Convert TOTAL payment amount to Account Currency
        const accountCurrency = account.currency_code || 'USD';
        let amountInAccountCurrency = data.amount;
        if (paymentCurrency !== accountCurrency) {
          amountInAccountCurrency = convert(data.amount, paymentCurrency, accountCurrency);
        }

        let newBalance = account.current_balance;
        if (data.direction === 'you_pay') {
          newBalance -= amountInAccountCurrency;
        } else {
          newBalance += amountInAccountCurrency;
        }

        const { error: accountError } = await supabase
          .from('accounts')
          .update({ current_balance: newBalance })
          .eq('id', account.id);

        if (accountError) throw accountError;
      }

      // Refresh data
      await get().fetchTransactions();
      await get().fetchAccounts();
      await get().fetchContactBalances();
      await get().fetchDashboard();

    } catch (error) {
      console.error('Create settlement error:', error);
    }
  },
}));
