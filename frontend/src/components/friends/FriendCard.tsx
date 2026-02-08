import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { User, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

// Currency symbols
const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD': '$',
  'INR': '₹',
  'AED': 'د.إ',
  'EUR': '€',
  'GBP': '£',
};

interface BalanceItem {
  currency_code: string;
  net_balance: number;
}

interface FriendCardProps {
  item: {
    id: string;
    name: string;
    description: string;
    balances: BalanceItem[]; // Multi-currency balances
    totalInPrimary: number; // For sorting/summary
  };
  isGroup?: boolean;
  onLongPress?: () => void;
}

export default function FriendCard({ item, isGroup = false, onLongPress }: FriendCardProps) {
  const router = useRouter();

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return COLORS.success; // They owe me
    if (balance < 0) return COLORS.danger; // I owe them
    return COLORS.textSecondary;
  };

  const getBalanceText = (balance: number) => {
    if (balance > 0) return 'owes you';
    if (balance < 0) return 'you owe';
    return 'settled';
  };

  const formatCurrency = (amount: number, currencyCode: string) => {
    const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;
    return `${symbol}${Math.abs(amount).toFixed(2)}`;
  };

  const handlePress = () => {
    if (!isGroup) {
      router.push(`/friend/${item.id}`);
    }
  };

  const hasBalances = item.balances.length > 0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
      {/* Left: Avatar */}
      <View style={styles.avatar}>
        {isGroup ? (
          <Users size={24} color={COLORS.primary} />
        ) : (
          <User size={24} color={COLORS.primary} />
        )}
      </View>

      {/* Middle: Name & Info */}
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>

      {/* Right: Multi-Currency Balances */}
      <View style={styles.balanceContainer}>
        {hasBalances ? (
          item.balances.map((b, index) => (
            <View key={`${b.currency_code}-${index}`} style={styles.balanceRow}>
              <Text style={[styles.balanceAmount, { color: getBalanceColor(b.net_balance) }]}>
                {formatCurrency(b.net_balance, b.currency_code)}
              </Text>
              <Text style={styles.balanceLabel}>
                {getBalanceText(b.net_balance)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.settledText}>Settled up</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    marginBottom: 12,
    marginHorizontal: 24,
    ...SHADOWS.soft,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  balanceAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  settledText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
