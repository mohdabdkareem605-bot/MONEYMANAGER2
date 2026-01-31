import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

interface AmountInputProps {
  amount: string;
  setAmount: (val: string) => void;
  currency: 'USD' | 'AED';
  setCurrency: (curr: 'USD' | 'AED') => void;
}

export default function AmountInput({ amount, setAmount, currency, setCurrency }: AmountInputProps) {
  const [isFocused, setIsFocused] = useState(false);

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
    <View style={styles.card}>
      {/* Row 1: Date */}
      <View style={styles.row}>
        <Text style={styles.label}>Date</Text>
        <Text style={styles.dateValue}>{fullDateDisplay}</Text>
      </View>

      {/* Row 2: Amount */}
      <View style={[styles.row, { marginTop: 20 }]}>
        <Text style={styles.label}>Amount</Text>
        
        <View style={styles.amountContainer}>
          <TouchableOpacity 
            style={styles.currencyChip} 
            onPress={handleCurrencyToggle}
            activeOpacity={0.7}
          >
            <Text style={styles.currencyText}>{currency}</Text>
          </TouchableOpacity>

          <View style={[
            styles.inputUnderline, 
            { borderColor: isFocused ? COLORS.primary : COLORS.border }
          ]}>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor="#C7C7CC"
              keyboardType="numeric"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </View>
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
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.l,
    marginHorizontal: 24,
    marginVertical: 24,
    padding: SPACING.l,
    ...SHADOWS.soft,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '700',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyChip: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  currencyText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  inputUnderline: {
    borderBottomWidth: 2,
    paddingBottom: 4,
    minWidth: 100,
  },
  input: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'right',
    padding: 0,
    includeFontPadding: false,
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
