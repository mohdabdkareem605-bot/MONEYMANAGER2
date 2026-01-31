import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Utensils, Coffee, Car, ShoppingBag, ArrowRightLeft } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

interface RecentTransactionCardProps {
  item: {
    id: string;
    title: string;
    date: string;
    amount: string;
    type: 'physical' | 'logical';
    category: string;
    splitInfo?: string;
    isPositive?: boolean;
  };
}

const getIcon = (category: string) => {
  switch (category) {
    case 'Food': return <Utensils size={20} color={COLORS.white} />;
    case 'Social': return <Coffee size={20} color={COLORS.white} />;
    case 'Transport': return <Car size={20} color={COLORS.white} />;
    case 'Shopping': return <ShoppingBag size={20} color={COLORS.white} />;
    default: return <ArrowRightLeft size={20} color={COLORS.white} />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Food': return '#F59E0B'; // Amber
    case 'Social': return '#EC4899'; // Pink
    case 'Transport': return '#3B82F6'; // Blue
    case 'Shopping': return '#8B5CF6'; // Violet
    default: return COLORS.textSecondary;
  }
};

export default function RecentTransactionCard({ item }: RecentTransactionCardProps) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: getCategoryColor(item.category) }]}>
        {getIcon(item.category)}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>

      {/* Amount & Split */}
      <View style={styles.amountContainer}>
        <Text style={[styles.amount, item.isPositive && styles.positiveAmount]}>
          {item.isPositive ? '+' : '-'} AED {item.amount}
        </Text>
        {item.splitInfo && (
          <Text style={styles.splitInfo}>{item.splitInfo}</Text>
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
    borderRadius: RADIUS.l, // 24px
    padding: SPACING.m,
    marginBottom: 12, // mb-3
    marginHorizontal: 24,
    ...SHADOWS.soft,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  positiveAmount: {
    color: COLORS.success,
  },
  splitInfo: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.success,
    backgroundColor: '#DCFCE7', // Light green bg
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
