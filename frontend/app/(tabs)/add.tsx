import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Text, 
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Utensils, Coffee, Car, ShoppingBag, Banknote, CreditCard, 
  Landmark, Plane, Home, Smartphone, Briefcase, Gift, Coins, User
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS } from '../../src/constants/theme';
import { useDataStore } from '../../src/store/dataStore';
import { useAuth } from '../../src/contexts/AuthContext';

import TransactionTypeToggle from '../../src/components/add-transaction/TransactionTypeToggle';
import AmountInput from '../../src/components/add-transaction/AmountInput';
import TransactionDetails from '../../src/components/add-transaction/TransactionDetails';
import SplitExpenseSection from '../../src/components/add-transaction/SplitExpenseSection';
import SelectionSheet from '../../src/components/add-transaction/SelectionSheet';
import TransferTypeToggle from '../../src/components/add-transaction/TransferTypeToggle';
import TransferDetails from '../../src/components/add-transaction/TransferDetails';

// Category icons mapping
const CATEGORY_ICONS: Record<string, any> = {
  'Food & Dining': Utensils,
  'Social': Coffee,
  'Transport': Car,
  'Shopping': ShoppingBag,
  'Travel': Plane,
  'Home': Home,
  'Tech': Smartphone,
  'Salary': Briefcase,
  'Bonus': Gift,
  'Gift': Gift,
  'Allowance': Coins,
  'Other': Coins,
};

// Default categories for demo
const DEFAULT_EXPENSE_CATEGORIES = [
  { id: '1', label: 'Food & Dining', icon: Utensils },
  { id: '2', label: 'Social', icon: Coffee },
  { id: '3', label: 'Transport', icon: Car },
  { id: '4', label: 'Shopping', icon: ShoppingBag },
  { id: '5', label: 'Travel', icon: Plane },
  { id: '6', label: 'Home', icon: Home },
  { id: '7', label: 'Tech', icon: Smartphone },
];

const DEFAULT_INCOME_CATEGORIES = [
  { id: '10', label: 'Salary', icon: Briefcase },
  { id: '11', label: 'Bonus', icon: Gift },
  { id: '12', label: 'Gift', icon: Gift },
  { id: '13', label: 'Allowance', icon: Coins },
];

const DEFAULT_ACCOUNTS = [
  { id: 'default-cash', label: 'Cash', icon: Banknote },
  { id: 'default-card', label: 'Visa Card', icon: CreditCard },
  { id: 'default-bank', label: 'Bank Account', icon: Landmark },
];

export default function AddTransaction() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    accounts, 
    contacts, 
    categories,
    fetchAccounts, 
    fetchContacts, 
    fetchCategories,
    createAccount,
    createTransaction,
  } = useDataStore();

  const [type, setType] = useState('Expense');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'AED'>('USD');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Transfer Mode State
  const [transferType, setTransferType] = useState('Internal Transfer');

  // Selected items
  const [category, setCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0]);
  const [account, setAccount] = useState(DEFAULT_ACCOUNTS[0]);
  
  // Transfer Specific
  const [fromAccount, setFromAccount] = useState(DEFAULT_ACCOUNTS[0]);
  const [toAccount, setToAccount] = useState(DEFAULT_ACCOUNTS[1]);
  const [friend, setFriend] = useState<any>(null);

  // Split with friends
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [splitAmounts, setSplitAmounts] = useState<Record<string, number>>({});

  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetType, setSheetType] = useState<'category' | 'account' | 'fromAccount' | 'toAccount' | 'friend'>('category');

  // Load data on mount
  useEffect(() => {
    fetchAccounts();
    fetchContacts();
    fetchCategories();
  }, []);

  // Map categories with icons
  const mappedCategories = React.useMemo(() => {
    if (categories.length === 0) {
      return type === 'Income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
    }
    return categories.map(cat => ({
      id: cat.id,
      label: cat.name,
      icon: CATEGORY_ICONS[cat.name] || Coins,
    }));
  }, [categories, type]);

  // Map accounts with icons
  const mappedAccounts = React.useMemo(() => {
    if (accounts.length === 0) return DEFAULT_ACCOUNTS;
    return accounts.map(acc => ({
      id: acc.id,
      label: acc.name,
      icon: acc.name.toLowerCase().includes('cash') ? Banknote : 
            acc.name.toLowerCase().includes('card') ? CreditCard : Landmark,
    }));
  }, [accounts]);

  // Map contacts/friends
  const mappedFriends = React.useMemo(() => {
    return contacts.map(contact => ({
      id: contact.id,
      label: contact.name,
      icon: User,
    }));
  }, [contacts]);

  // Update defaults when data loads
  useEffect(() => {
    if (mappedAccounts.length > 0 && account.id.startsWith('default-')) {
      setAccount(mappedAccounts[0]);
      setFromAccount(mappedAccounts[0]);
      if (mappedAccounts.length > 1) {
        setToAccount(mappedAccounts[1]);
      }
    }
  }, [mappedAccounts]);

  useEffect(() => {
    if (mappedFriends.length > 0 && !friend) {
      setFriend(mappedFriends[0]);
    }
  }, [mappedFriends]);

  // Reset category on type change
  useEffect(() => {
    if (type === 'Income') setCategory(DEFAULT_INCOME_CATEGORIES[0]);
    if (type === 'Expense') setCategory(mappedCategories[0] || DEFAULT_EXPENSE_CATEGORIES[0]);
  }, [type]);

  // Handlers for Standard Mode
  const handleOpenCategory = () => {
    setSheetType('category');
    setSheetVisible(true);
  };
  const handleOpenAccount = () => {
    setSheetType('account');
    setSheetVisible(true);
  };

  // Handlers for Transfer Mode
  const handleOpenFrom = () => {
    setSheetType('fromAccount');
    setSheetVisible(true);
  };
  const handleOpenTo = () => {
    if (transferType === 'Pay Friend') {
      setSheetType('friend');
    } else {
      setSheetType('toAccount');
    }
    setSheetVisible(true);
  };

  const handleSelect = (item: any) => {
    if (sheetType === 'category') setCategory(item);
    else if (sheetType === 'account') setAccount(item);
    else if (sheetType === 'fromAccount') setFromAccount(item);
    else if (sheetType === 'toAccount') setToAccount(item);
    else if (sheetType === 'friend') setFriend(item);
  };

  const isTransfer = type === 'Transfer';
  const isExpense = type === 'Expense';
  const isIncome = type === 'Income';

  // Determine Sheet Data
  let sheetTitle = 'Select Item';
  let sheetItems: any[] = [];
  
  if (sheetType === 'category') {
    sheetTitle = 'Select Category';
    sheetItems = type === 'Income' ? DEFAULT_INCOME_CATEGORIES : mappedCategories;
  } else if (sheetType === 'friend') {
    sheetTitle = 'Select Friend';
    sheetItems = mappedFriends;
  } else {
    sheetTitle = 'Select Account';
    sheetItems = mappedAccounts;
    if (sheetType === 'toAccount') {
      sheetItems = mappedAccounts.filter(a => a.id !== fromAccount.id);
    }
  }

  // Handle save transaction
  const handleSave = async () => {
    const amountNum = parseFloat(amount);
    
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setSaving(true);
    try {
      // Check if account exists, create if using default
      let accountId = account.id;
      if (accountId.startsWith('default-')) {
        // Create the account first
        const newAccount = await createAccount({
          name: account.label,
          currency_code: currency,
          current_balance: 0,
        });
        if (newAccount) {
          accountId = newAccount.id;
        } else {
          throw new Error('Failed to create account');
        }
      }

      // Build splits from selected friends
      const splits = selectedFriends.map(friendId => {
        const splitAmount = splitAmounts[friendId] || (amountNum / (selectedFriends.length + 1));
        return {
          contact_id: friendId,
          amount: splitAmount, // Positive = they owe me
        };
      });

      // Create transaction
      const transaction = await createTransaction({
        account_id: accountId,
        total_amount: amountNum,
        currency_code: currency,
        description: note || category.label,
        splits,
      });

      if (transaction) {
        Alert.alert('Success', 'Transaction saved!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        throw new Error('Failed to save transaction');
      }
    } catch (error: any) {
      console.error('Save transaction error:', error);
      Alert.alert('Error', error.message || 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        {/* 1. Header: Segmented Toggle */}
        <TransactionTypeToggle type={type} setType={setType} />
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          
          {/* 2. Amount Input */}
          <AmountInput 
            amount={amount} 
            setAmount={setAmount} 
            currency={currency} 
            setCurrency={setCurrency} 
            variant={isTransfer ? 'standard' : 'hero'}
          />

          {/* 3. Transfer Logic */}
          {isTransfer && (
            <>
              <TransferTypeToggle type={transferType} setType={setTransferType} />
              <TransferDetails 
                transferType={transferType as any}
                fromAccount={fromAccount.label}
                toAccount={transferType === 'Pay Friend' ? (friend?.label || 'Select Friend') : toAccount.label}
                note={note}
                setNote={setNote}
                onSelectFrom={handleOpenFrom}
                onSelectTo={handleOpenTo}
              />
            </>
          )}

          {/* 4. Expense/Income Logic */}
          {!isTransfer && (
            <>
              {isExpense && (
                <SplitExpenseSection 
                  amount={parseFloat(amount) || 0} 
                  friends={mappedFriends}
                  selectedFriends={selectedFriends}
                  setSelectedFriends={setSelectedFriends}
                  splitAmounts={splitAmounts}
                  setSplitAmounts={setSplitAmounts}
                />
              )}
              
              <TransactionDetails
                category={category.label}
                account={account.label}
                accountLabel={isIncome ? "Deposit to" : "Account"}
                note={note}
                setNote={setNote}
                onSelectCategory={handleOpenCategory}
                onSelectAccount={handleOpenAccount}
              />
            </>
          )}
          
          <View style={styles.spacer} />
        </ScrollView>

        {/* 5. Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveBtnText}>Save Transaction</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <SelectionSheet 
        isVisible={sheetVisible} 
        onClose={() => setSheetVisible(false)}
        title={sheetTitle}
        items={sheetItems}
        onSelect={handleSelect}
        selectedId={
           sheetType === 'category' ? category.id : 
           sheetType === 'account' ? account.id :
           sheetType === 'fromAccount' ? fromAccount.id :
           sheetType === 'toAccount' ? toAccount.id :
           friend?.id
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  spacer: {
    height: 40,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 24,
    right: 24,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: RADIUS.l,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
