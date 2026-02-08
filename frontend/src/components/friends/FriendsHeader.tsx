import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { useDataStore } from '../../store/dataStore';

export default function FriendsHeader() {
  const { contactBalances } = useDataStore();

  // Calculate totals from contactBalances (all converted to primary currency USD)
  let totalOwedToYou = 0;
  let totalYouOwe = 0;

  for (const balance of contactBalances) {
    // Use total_in_primary which is already converted to USD
    if (balance.total_in_primary > 0) {
      totalOwedToYou += balance.total_in_primary;
    } else if (balance.total_in_primary < 0) {
      totalYouOwe += Math.abs(balance.total_in_primary);
    }
  }

  const netBalance = totalOwedToYou - totalYouOwe;
  const isPositive = netBalance >= 0;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {isPositive ? 'Overall, you are owed' : 'Overall, you owe'}
      </Text>
      <View style={styles.amountRow}>
        <Text style={[styles.amount, { color: isPositive ? COLORS.success : COLORS.danger }]}>
          ${Math.abs(netBalance).toFixed(2)}
        </Text>
        <Text style={styles.convertedNote}>(in USD)</Text>
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
  },
  convertedNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
});
