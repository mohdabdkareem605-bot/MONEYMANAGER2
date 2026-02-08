import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Utensils, Coffee, Car, ShoppingBag, Home, Smartphone, Plane } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

interface CategoryExpenseCardProps {
  category: string;
  count: number;
  amount: string;
  percent: number; // 0 to 1
  currencyCode?: string;
  isIncome?: boolean;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD': '$',
  'INR': '₹',
  'AED': 'د.إ',
  'EUR': '€',
  'GBP': '£',
};

const getIcon = (category: string) => {
  switch (category) {
    case 'Food & Dining': return <Utensils size={20} color="#F59E0B" />;
    case 'Social': return <Coffee size={20} color="#EC4899" />;
    case 'Transport': return <Car size={20} color="#3B82F6" />;
    case 'Shopping': return <ShoppingBag size={20} color="#8B5CF6" />;
    case 'Home': return <Home size={20} color="#10B981" />;
    case 'Tech': return <Smartphone size={20} color="#6366F1" />;
    case 'Travel': return <Plane size={20} color="#F43F5E" />;
    case 'Salary': return <Utensils size={20} color="#10B981" />;
    default: return <Utensils size={20} color={COLORS.textSecondary} />;
  }
};

const getBgColor = (category: string) => {
  switch (category) {
    case 'Food & Dining': return '#FEF3C7'; // Amber-100
    case 'Social': return '#FCE7F3'; // Pink-100
    case 'Transport': return '#DBEAFE'; // Blue-100
    case 'Shopping': return '#EDE9FE'; // Violet-100
    case 'Home': return '#D1FAE5'; // Emerald-100
    case 'Tech': return '#E0E7FF'; // Indigo-100
    case 'Travel': return '#FFE4E6'; // Rose-100
    case 'Salary': return '#D1FAE5'; // Emerald-100
    default: return '#F3F4F6';
  }
};

export default function CategoryExpenseCard({
  category,
  count,
  amount,
  percent,
  currencyCode = 'USD',
  isIncome = false
}: CategoryExpenseCardProps) {
  const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;
  const prefix = isIncome ? '+' : '-';
  const amountColor = isIncome ? COLORS.success : COLORS.textPrimary;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: getBgColor(category) }]}>
        {getIcon(category)}
      </View>

      {/* Middle: Name & Count */}
      <View style={styles.content}>
        <Text style={styles.name}>{category}</Text>
        <Text style={styles.count}>{count} transaction{count !== 1 ? 's' : ''}</Text>
      </View>

      {/* Right: Amount & Bar */}
      <View style={styles.rightContainer}>
        <Text style={[styles.amount, { color: amountColor }]}>{prefix}{symbol}{amount}</Text>
        {/* Progress Bar Background */}
        <View style={styles.barBg}>
          {/* Progress Bar Fill */}
          <View style={[styles.barFill, { width: `${percent * 100}%`, backgroundColor: isIncome ? COLORS.success : COLORS.primary }]} />
        </View>
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
    marginBottom: 12,
    marginHorizontal: 24,
    ...SHADOWS.soft,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16, // Softer square
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  count: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  rightContainer: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  barBg: {
    width: '100%',
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
  },
  barFill: {
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
});
