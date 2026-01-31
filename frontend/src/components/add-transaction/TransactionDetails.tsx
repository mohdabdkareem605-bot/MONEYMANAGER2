import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Tag, CreditCard, ChevronDown, FileText } from 'lucide-react-native';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../constants/theme';

interface TransactionDetailsProps {
  category: string;
  account: string;
  note: string;
  setNote: (text: string) => void;
  onSelectCategory: () => void;
  onSelectAccount: () => void;
}

export default function TransactionDetails({ 
  category, 
  account, 
  note, 
  setNote, 
  onSelectCategory, 
  onSelectAccount 
}: TransactionDetailsProps) {
  return (
    <View style={styles.container}>
      {/* Category Row */}
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

      {/* Account Row */}
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

      <View style={styles.divider} />

      {/* Note Row */}
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <FileText size={20} color={COLORS.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Note</Text>
          <TextInput
            style={styles.input}
            placeholder="Write a note..."
            placeholderTextColor={COLORS.textSecondary}
            value={note}
            onChangeText={setNote}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.l,
    marginHorizontal: 24,
    paddingVertical: SPACING.s,
    marginBottom: 24,
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
  input: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.background,
    marginLeft: 72, 
  },
});
