import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { User, Users } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

interface FriendCardProps {
  item: {
    id: string;
    name: string;
    description: string;
    status: 'owed' | 'owing' | 'settled';
    amount?: string;
    currency?: string;
  };
  isGroup?: boolean;
  onLongPress?: () => void;
}

export default function FriendCard({ item, isGroup = false, onLongPress }: FriendCardProps) {
  const getBalanceColor = () => {
    switch (item.status) {
      case 'owed': return COLORS.success;
      case 'owing': return COLORS.danger;
      default: return COLORS.textSecondary;
    }
  };

  const getBalanceText = () => {
    switch (item.status) {
      case 'owed': return 'owes you';
      case 'owing': return 'you owe';
      default: return 'Settled up';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.7}
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

      {/* Right: Balance */}
      <View style={styles.balanceContainer}>
        <Text style={[styles.balanceLabel, { color: item.status === 'settled' ? COLORS.textSecondary : COLORS.textSecondary }]}>
          {getBalanceText()}
        </Text>
        {item.status !== 'settled' && (
          <Text style={[styles.balanceAmount, { color: getBalanceColor() }]}>
            {item.currency} {item.amount}
          </Text>
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
    marginBottom: 12, // mb-3
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
    marginBottom: 2,
  },
  balanceAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
});
