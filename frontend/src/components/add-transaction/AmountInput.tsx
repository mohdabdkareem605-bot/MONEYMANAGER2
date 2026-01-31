import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';

interface AmountInputProps {
  amount: string;
  setAmount: (val: string) => void;
  currency: 'USD' | 'AED';
  setCurrency: (curr: 'USD' | 'AED') => void;
}

export default function AmountInput({ amount, setAmount, currency, setCurrency }: AmountInputProps) {
  // Formatted Date
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const timeStr = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const fullDateDisplay = `${dateStr}, ${timeStr}`;

  const handleCurrencyToggle = () => {
    setCurrency(currency === 'AED' ? 'USD' : 'AED');
  };

  return (
    <View style={styles.container}>
      {/* Row 1: Date */}
      <View style={styles.dateRow}>
        <Text style={styles.label}>Date</Text>
        <Text style={styles.dateValue}>{fullDateDisplay}</Text>
      </View>

      {/* Row 2: Amount */}
      <View style={styles.amountRow}>
        <Text style={styles.label}>Amount</Text>
        
        <View style={styles.inputContainer}>
          {/* Currency Chip */}
          <TouchableOpacity 
            style={styles.currencyChip} 
            onPress={handleCurrencyToggle}
            activeOpacity={0.7}
          >
            <Text style={styles.currencyText}>{currency}</Text>
          </TouchableOpacity>

          {/* Input */}
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor="#C7C7CC"
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Row 3: Rate (Conditional) */}
      {currency !== 'AED' && (
        <View style={styles.rateRow}>
          <Text style={styles.rateText}>Rate: 1 USD = 3.67 AED</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginVertical: 24,
    paddingHorizontal: SPACING.s, 
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24, // Spacing between Date and Amount
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16, // Medium Gray text size
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary, // Purple underline
    paddingBottom: 4,
    minWidth: 140, // Ensure minimum width for the line
    justifyContent: 'flex-end',
  },
  currencyChip: {
    backgroundColor: '#E5E7EB', // Gray background
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  currencyText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    fontSize: 32, // Large Bold Text
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'right',
    padding: 0,
    includeFontPadding: false,
    minWidth: 50,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  rateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
