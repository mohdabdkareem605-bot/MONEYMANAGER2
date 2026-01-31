import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Plus, User } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

interface SplitExpenseSectionProps {
  amount: number;
}

const SPLIT_TYPES = ['Equal', 'Exact', '%'];

export default function SplitExpenseSection({ amount }: SplitExpenseSectionProps) {
  const [isSplit, setIsSplit] = useState(false);
  const [splitType, setSplitType] = useState('Equal');
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  const toggleSplit = (value: boolean) => {
    setIsSplit(value);
    if (value) {
      height.value = withTiming(360, { duration: 300 }); // Increased height for chips
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      height.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: height.value,
      opacity: opacity.value,
      overflow: 'hidden',
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Split Expense</Text>
        <Switch
          value={isSplit}
          onValueChange={toggleSplit}
          trackColor={{ false: '#E5E7EB', true: COLORS.primary }}
          thumbColor={COLORS.white}
          ios_backgroundColor="#E5E7EB"
        />
      </View>

      <Animated.View style={animatedStyle}>
        <View style={styles.logicalLayer}>
          
          {/* Participants Row */}
          <Text style={styles.sectionLabel}>Participants</Text>
          <View style={styles.participantsRow}>
            {/* Self */}
            <View style={styles.participant}>
              <View style={[styles.avatar, styles.activeAvatar]}>
                <User size={20} color={COLORS.white} />
              </View>
              <Text style={styles.name}>You</Text>
            </View>

            {/* Mock Friend */}
            <View style={styles.participant}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>JD</Text>
              </View>
              <Text style={styles.name}>John</Text>
            </View>

            {/* Add Button */}
            <TouchableOpacity style={styles.addBtn}>
              <Plus size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Split Type Chips */}
          <View style={styles.chipRow}>
            {SPLIT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.chip, splitType === type && styles.activeChip]}
                onPress={() => setSplitType(type)}
              >
                <Text style={[styles.chipText, splitType === type && styles.activeChipText]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Truth Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>You Paid</Text>
              <Text style={styles.summaryValue}>${amount}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Your Share</Text>
              <Text style={styles.summaryValue}>${(amount / 2).toFixed(2)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: COLORS.success }]}>Lending</Text>
              <Text style={[styles.summaryValue, { color: COLORS.success }]}>${(amount / 2).toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
    marginBottom: 0, // Removed bottom margin to close the gap
    marginHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  logicalLayer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.l,
    padding: SPACING.m,
    marginTop: 8,
    ...SHADOWS.soft,
  },
  sectionLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  participantsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  participant: {
    alignItems: 'center',
    marginRight: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeAvatar: {
    backgroundColor: COLORS.primary,
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  name: {
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    marginRight: 8,
  },
  activeChip: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  activeChipText: {
    color: COLORS.white,
  },
  summaryCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    height: '100%',
  },
});
