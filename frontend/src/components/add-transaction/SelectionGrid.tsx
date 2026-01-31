import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Tag, CreditCard, ChevronDown } from 'lucide-react-native';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../constants/theme';

interface SelectionGridProps {
  category: string;
  account: string;
  onSelectCategory: () => void;
  onSelectAccount: () => void;
}

export default function SelectionGrid({ category, account, onSelectCategory, onSelectAccount }: SelectionGridProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.row} onPress={onSelectCategory}>
        <View style={styles.iconContainer}>
          <Tag size={20} color={COLORS.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Category</Text>
          <Text style={styles.value}>{category}</Text>
        </View>
        <ChevronDown size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.row} onPress={onSelectAccount}>
        <View style={styles.iconContainer}>
          <CreditCard size={20} color={COLORS.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Account</Text>
          <Text style={styles.value}>{account}</Text>
        </View>
        <ChevronDown size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.l,
    marginHorizontal: 24,
    paddingVertical: SPACING.s,
    ...SHADOWS.soft,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.background,
    marginLeft: 72, 
  },
});
