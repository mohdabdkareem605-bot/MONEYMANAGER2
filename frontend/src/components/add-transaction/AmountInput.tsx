import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

interface AmountInputProps {
  amount: string;
  setAmount: (val: string) => void;
  currency: 'USD' | 'AED';
  setCurrency: (curr: 'USD' | 'AED') => void;
  variant?: 'hero' | 'standard'; // Added variant
}

export default function AmountInput({ 
  amount, 
  setAmount, 
  currency, 
  setCurrency,
  variant = 'hero' 
}: AmountInputProps) {
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

  if (variant === 'standard') {
    return (
      <View style={styles.standardContainer}>
         <View style={styles.standardRow}>
            <Text style={styles.label}>Amount</Text>
            
            <View style={styles.standardInputWrapper}>
              <TouchableOpacity 
                style={styles.standardCurrencyChip} 
                onPress={handleCurrencyToggle}
              >
                <Text style={styles.standardCurrencyText}>{currency}</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.standardInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="#C7C7CC"
                keyboardType="numeric"
              />
            </View>
         </View>
      </View>
    );
  }

  // HERO VARIANT (Default)
  return (
    <View style={styles.container}>
      {/* Row 1: Date */}
      <View style={styles.dateRow}>
        <Text style={styles.label}>Date</Text>
        <Text style={styles.dateValue}>{fullDateDisplay}</Text>
      </View>

      {/* Row 2: Splitwise Style Input */}
      <View style={styles.inputRow}>
        {/* Currency Button (Rounded Square) */}
        <TouchableOpacity 
          style={styles.currencyButton} 
          onPress={handleCurrencyToggle}
          activeOpacity={0.7}
        >
          <Text style={styles.currencyText}>{currency}</Text>
        </TouchableOpacity>

        {/* Input Field with Underline */}
        <View style={styles.inputContainer}>
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
  // Hero Styles
  container: {
    marginHorizontal: 24,
    marginVertical: 24,
    paddingHorizontal: SPACING.s, 
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  currencyButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  currencyText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  inputContainer: {
    flex: 1,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: 8,
  },
  input: {
    fontSize: 36,
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

  // Standard Styles
  standardContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 16,
    borderRadius: RADIUS.l,
    padding: SPACING.m,
    ...SHADOWS.soft,
  },
  standardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  standardInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  standardCurrencyChip: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  standardCurrencyText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  standardInput: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    minWidth: 60,
    textAlign: 'right',
  }
});
