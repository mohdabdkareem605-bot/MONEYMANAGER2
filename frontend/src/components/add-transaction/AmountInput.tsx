import React from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

interface AmountInputProps {
  amount: string;
  setAmount: (val: string) => void;
  currency: 'USD' | 'AED';
  setCurrency: (curr: 'USD' | 'AED') => void;
}

export default function AmountInput({ amount, setAmount, currency, setCurrency }: AmountInputProps) {
  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor="#C7C7CC"
          keyboardType="numeric"
          textAlign="center"
        />
      </View>
      
      <View style={styles.currencyToggle}>
        <TouchableOpacity 
          style={[styles.currencyChip, currency === 'AED' && styles.activeChip]}
          onPress={() => setCurrency('AED')}
        >
          <Text style={[styles.currencyText, currency === 'AED' && styles.activeText]}>AED</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.currencyChip, currency === 'USD' && styles.activeChip]}
          onPress={() => setCurrency('USD')}
        >
          <Text style={[styles.currencyText, currency === 'USD' && styles.activeText]}>USD</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.textPrimary,
    minWidth: 100,
  },
  currencyToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 4,
    marginTop: 8,
  },
  currencyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeChip: {
    backgroundColor: COLORS.primary,
  },
  currencyText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeText: {
    color: COLORS.white,
  },
});
