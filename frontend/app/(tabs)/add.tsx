import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Utensils, Coffee, Car, ShoppingBag, Banknote, CreditCard, 
  Landmark, Plane, Home, Smartphone, Briefcase, Gift, Coins, User
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../src/constants/theme';

import TransactionTypeToggle from '../../src/components/add-transaction/TransactionTypeToggle';
import AmountInput from '../../src/components/add-transaction/AmountInput';
import TransactionDetails from '../../src/components/add-transaction/TransactionDetails';
import SplitExpenseSection from '../../src/components/add-transaction/SplitExpenseSection';
import SelectionSheet from '../../src/components/add-transaction/SelectionSheet';
import TransferTypeToggle from '../../src/components/add-transaction/TransferTypeToggle';
import TransferDetails from '../../src/components/add-transaction/TransferDetails';

// Data Mock
const EXPENSE_CATEGORIES = [
  { id: '1', label: 'Food', icon: Utensils },
  { id: '2', label: 'Social', icon: Coffee },
  { id: '3', label: 'Transport', icon: Car },
  { id: '4', label: 'Shopping', icon: ShoppingBag },
  { id: '5', label: 'Travel', icon: Plane },
  { id: '6', label: 'Home', icon: Home },
  { id: '7', label: 'Tech', icon: Smartphone },
];

const INCOME_CATEGORIES = [
  { id: '10', label: 'Salary', icon: Briefcase },
  { id: '11', label: 'Bonus', icon: Gift },
  { id: '12', label: 'Gift', icon: Gift },
  { id: '13', label: 'Allowance', icon: Coins },
];

const ACCOUNTS = [
  { id: '1', label: 'Cash', icon: Banknote },
  { id: '2', label: 'Visa Card', icon: CreditCard },
  { id: '3', label: 'Chase Bank', icon: Landmark },
];

const FRIENDS = [
  { id: '101', label: 'Alice', icon: User },
  { id: '102', label: 'Bob', icon: User },
  { id: '103', label: 'Charlie', icon: User },
];

export default function AddTransaction() {
  const [type, setType] = useState('Expense'); // 'Income' | 'Expense' | 'Transfer'
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'AED'>('AED');
  const [note, setNote] = useState('');
  
  // Transfer Mode State
  const [transferType, setTransferType] = useState('Internal Transfer'); // 'Internal Transfer' | 'Pay Friend'

  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [account, setAccount] = useState(ACCOUNTS[0]);
  
  // Transfer Specific
  const [fromAccount, setFromAccount] = useState(ACCOUNTS[0]);
  const [toAccount, setToAccount] = useState(ACCOUNTS[1]); // Default different
  const [friend, setFriend] = useState(FRIENDS[0]);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetType, setSheetType] = useState<'category' | 'account' | 'fromAccount' | 'toAccount' | 'friend'>('category');

  // Reset defaults on type change
  useEffect(() => {
    if (type === 'Income') setCategory(INCOME_CATEGORIES[0]);
    if (type === 'Expense') setCategory(EXPENSE_CATEGORIES[0]);
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
  let sheetItems = [];
  
  if (sheetType === 'category') {
    sheetTitle = 'Select Category';
    sheetItems = type === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  } else if (sheetType === 'friend') {
    sheetTitle = 'Select Friend';
    sheetItems = FRIENDS;
  } else {
    sheetTitle = 'Select Account';
    sheetItems = ACCOUNTS;
    // Filter logic for Transfers (prevent same account)
    if (sheetType === 'toAccount') {
      sheetItems = ACCOUNTS.filter(a => a.id !== fromAccount.id);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        {/* 1. Header: Segmented Toggle */}
        <TransactionTypeToggle type={type} setType={setType} />
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          
          {/* 2. Amount Input (Switch Variant based on Mode) */}
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
                toAccount={transferType === 'Pay Friend' ? friend.label : toAccount.label}
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
              {isExpense && <SplitExpenseSection amount={parseFloat(amount) || 0} />}
              
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

        {/* 5. Save Button (Docked at bottom) */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>Save Transaction</Text>
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
           friend.id
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
  saveBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
