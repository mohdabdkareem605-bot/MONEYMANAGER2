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
  linked_profile_id?: string;
  net_balance?: number;
}

export interface Split {
  id: string;
  transaction_id: string;
  contact_id: string;
  contact_name?: string;
  amount: number;
  split_type: 'DEBT' | 'PAYMENT';
  category_id?: string;
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
}

interface DataState {
  // Data
  accounts: Account[];
  contacts: Contact[];
  transactions: Transaction[];
  categories: Category[];
  dashboardSummary: DashboardSummary | null;
  contactBalances: { contact_id: string; contact_name: string; net_balance: number }[];
  
  // Loading states
  loading: boolean;
  
  // Actions
  fetchAccounts: () => Promise<void>;
  createAccount: (data: Partial<Account>) => Promise<Account | null>;
  
  fetchContacts: () => Promise<void>;
  createContact: (data: { name: string; phone_number?: string }) => Promise<Contact | null>;
  deleteContact: (id: string) => Promise<void>;
  
  fetchTransactions: () => Promise<void>;
  createTransaction: (data: {
    account_id?: string;
    payer_contact_id?: string;
    total_amount: number;
    currency_code: string;
    description?: string;
    splits: { contact_id: string; amount: number }[];
  }) => Promise<Transaction | null>;
  
  fetchCategories: () => Promise<void>;
  fetchDashboard: () => Promise<void>;
  fetchContactBalances: () => Promise<void>;
  
  createSettlement: (data: {
    contact_id: string;
    amount: number;
    account_id: string;
  }) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  accounts: [],
  contacts: [],
  transactions: [],
  categories: [],
  dashboardSummary: null,
  contactBalances: [],
  loading: false,

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

  fetchContacts: async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('name');
      
      if (error) throw error;
      set({ contacts: data || [] });
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
        })
        .select()
        .single();
      
      if (error) throw error;
      
      set({ contacts: [...get().contacts, data].sort((a, b) => a.name.localeCompare(b.name)) });
      return data;
    } catch (error) {
      console.error('Create contact error:', error);
      return null;
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
          accounts(name),
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
            payer_name: tx.payer?.name,
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
      if (!user) return null;
      
      // Create transaction
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
        })
        .select()
        .single();
      
      if (txError) throw txError;
      
      // Create splits
      if (txData.splits.length > 0) {
        const splitsData = txData.splits.map(split => ({
          transaction_id: transaction.id,
          contact_id: split.contact_id,
          amount: split.amount,
          split_type: 'DEBT',
        }));
        
        const { error: splitError } = await supabase
          .from('splits')
          .insert(splitsData);
        
        if (splitError) throw splitError;
      }
      
      // Update account balance
      if (txData.account_id) {
        const account = get().accounts.find(a => a.id === txData.account_id);
        if (account) {
          const newBalance = account.current_balance - txData.total_amount;
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
      
      // Get total balance from accounts
      const { data: accounts } = await supabase
        .from('accounts')
        .select('current_balance');
      
      const totalBalance = (accounts || []).reduce(
        (sum, a) => sum + Number(a.current_balance), 0
      );
      
      // Get splits to calculate owed amounts
      const { data: splits } = await supabase
        .from('splits')
        .select(`
          amount,
          split_type,
          transactions!inner(created_by)
        `)
        .eq('split_type', 'DEBT');
      
      let totalOwed = 0;
      let totalOwing = 0;
      
      (splits || []).forEach(split => {
        const amount = Number(split.amount);
        if (amount > 0) {
          totalOwed += amount;
        } else {
          totalOwing += Math.abs(amount);
        }
      });
      
      set({
        dashboardSummary: {
          total_balance: totalBalance,
          total_owed_to_you: totalOwed,
          total_you_owe: totalOwing,
          net_balance: totalOwed - totalOwing,
        },
      });
    } catch (error) {
      console.error('Fetch dashboard error:', error);
    }
  },

  fetchContactBalances: async () => {
    try {
      const contacts = get().contacts;
      const balances: { contact_id: string; contact_name: string; net_balance: number }[] = [];
      
      for (const contact of contacts) {
        const { data: splits } = await supabase
          .from('splits')
          .select('amount')
          .eq('contact_id', contact.id);
        
        const netBalance = (splits || []).reduce(
          (sum, s) => sum + Number(s.amount), 0
        );
        
        balances.push({
          contact_id: contact.id,
          contact_name: contact.name,
          net_balance: netBalance,
        });
      }
      
      set({ contactBalances: balances });
    } catch (error) {
      console.error('Fetch contact balances error:', error);
    }
  },

  createSettlement: async (data) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Create settlement transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          created_by: user.id,
          account_id: data.account_id,
          total_amount: data.amount,
          currency_code: 'USD',
          description: 'Settlement payment',
        })
        .select()
        .single();
      
      if (txError) throw txError;
      
      // Create payment split (negative amount - they're paying us)
      const { error: splitError } = await supabase
        .from('splits')
        .insert({
          transaction_id: transaction.id,
          contact_id: data.contact_id,
          amount: -data.amount,
          split_type: 'PAYMENT',
        });
      
      if (splitError) throw splitError;
      
      // Update account balance
      const account = get().accounts.find(a => a.id === data.account_id);
      if (account) {
        const newBalance = account.current_balance + data.amount;
        await supabase
          .from('accounts')
          .update({ current_balance: newBalance })
          .eq('id', data.account_id);
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
