import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Utensils, Coffee, Car, ShoppingBag, Banknote, CreditCard, Landmark, Plane, Home, Smartphone } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

import TransactionTypeToggle from '../../src/components/add-transaction/TransactionTypeToggle';
import AmountInput from '../../src/components/add-transaction/AmountInput';
import SelectionGrid from '../../src/components/add-transaction/SelectionGrid';
import SplitExpenseSection from '../../src/components/add-transaction/SplitExpenseSection';
import SelectionSheet from '../../src/components/add-transaction/SelectionSheet';

// Data Mock
const CATEGORIES = [
  { id: '1', label: 'Food', icon: Utensils },
  { id: '2', label: 'Social', icon: Coffee },
  { id: '3', label: 'Transport', icon: Car },
  { id: '4', label: 'Shopping', icon: ShoppingBag },
  { id: '5', label: 'Travel', icon: Plane },
  { id: '6', label: 'Home', icon: Home },
  { id: '7', label: 'Tech', icon: Smartphone },
];

const ACCOUNTS = [
  { id: '1', label: 'Cash', icon: Banknote },
  { id: '2', label: 'Visa Card', icon: CreditCard },
  { id: '3', label: 'Chase Bank', icon: Landmark },
];

export default function AddTransaction() {
  const [type, setType] = useState('Expense');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'AED'>('AED');
  
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [account, setAccount] = useState(ACCOUNTS[0]);
  
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetType, setSheetType] = useState<'category' | 'account'>('category');

  const handleOpenCategory = () => {
    setSheetType('category');
    setSheetVisible(true);
  };

  const handleOpenAccount = () => {
    setSheetType('account');
    setSheetVisible(true);
  };

  const handleSelect = (item: any) => {
    if (sheetType === 'category') setCategory(item);
    else setAccount(item);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <TransactionTypeToggle type={type} setType={setType} />
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <AmountInput 
            amount={amount} 
            setAmount={setAmount} 
            currency={currency} 
            setCurrency={setCurrency} 
          />
          
          <SelectionGrid 
            category={category.label}
            account={account.label}
            onSelectCategory={handleOpenCategory}
            onSelectAccount={handleOpenAccount}
          />
          
          <SplitExpenseSection amount={parseFloat(amount) || 0} />
          
          <View style={styles.spacer} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>Save Transaction</Text>
          </TouchableOpacity>
        </View>
      </View>

      <SelectionSheet 
        isVisible={sheetVisible} 
        onClose={() => setSheetVisible(false)}
        title={sheetType === 'category' ? 'Select Category' : 'Select Account'}
        items={sheetType === 'category' ? CATEGORIES : ACCOUNTS}
        onSelect={handleSelect}
        selectedId={sheetType === 'category' ? category.id : account.id}
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
