import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Utensils, Car, ShoppingBag, ArrowUpRight, Users } from 'lucide-react-native';
import { COLORS, SPACING } from '../../constants/theme';

interface TransactionItemProps {
  item: {
    id: string;
    type: 'expense' | 'income';
    desc: string;
    amount: number;
    currency: string;
    isSplit?: boolean;
    category: string;
    account: string;
  };
  isLast?: boolean;
}

const getIcon = (category: string) => {
  switch (category) {
    case 'Food': return <Utensils size={20} color={COLORS.white} />;
    case 'Transport': return <Car size={20} color={COLORS.white} />;
    case 'Shopping': return <ShoppingBag size={20} color={COLORS.white} />;
    default: return <ArrowUpRight size={20} color={COLORS.white} />;
  }
};

const getBgColor = (category: string) => {
  switch (category) {
    case 'Food': return '#F59E0B';
    case 'Transport': return '#3B82F6';
    case 'Shopping': return '#8B5CF6';
    default: return COLORS.success;
  }
};

export default function TransactionRow({ item, isLast }: TransactionItemProps) {
  const isExpense = item.type === 'expense';

  return (
    <TouchableOpacity style={[styles.container, !isLast && styles.borderBottom]} activeOpacity={0.7}>
      {/* Left: Icon with Badge */}
      <View style={styles.iconWrapper}>
        <View style={[styles.iconBox, { backgroundColor: getBgColor(item.category) }]}>
          {getIcon(item.category)}
        </View>

        {/* Split Badge */}
        {item.isSplit && (
          <View style={styles.badge}>
            <Users size={10} color={COLORS.white} />
          </View>
        )}
      </View>

      {/* Middle: Context */}
      <View style={styles.context}>
        <Text style={styles.desc}>{item.desc}</Text>
        <Text style={styles.account}>{item.account}</Text>
      </View>

      {/* Right: Values */}
      <View style={styles.values}>
        <Text style={[styles.amount, isExpense ? styles.expense : styles.income]}>
          {isExpense ? '-' : '+'} {item.currency} {item.amount.toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12, // Rounded Square
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  context: {
    flex: 1,
  },
  desc: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  account: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  values: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  expense: {
    color: COLORS.textPrimary, // Black for Expense
  },
  income: {
    color: COLORS.success, // Green for Income
  },
  lentText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.success, // Teal/Green
    marginTop: 2,
  },
});
