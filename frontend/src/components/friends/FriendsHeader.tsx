import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SHADOWS, SPACING, RADIUS } from '../../constants/theme';

export default function FriendsHeader() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Overall, you are owed</Text>
      <View style={styles.amountRow}>
        <Text style={styles.amount}>AED 6,155.00</Text>
        <Text style={styles.secondaryAmount}>+ ₹29,830</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.l,
    paddingBottom: SPACING.m,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  amount: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.success, // Teal/Emerald
  },
  secondaryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.success,
    opacity: 0.8,
  },
});
