import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

const { height } = Dimensions.get('window');

export default function DashboardHeader() {
  return (
    <View style={styles.container}>
      <View style={styles.purpleBackground}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          {/* Month Selector */}
          <View style={styles.monthSelector}>
            <TouchableOpacity style={styles.iconButton}>
              <ChevronLeft size={24} color={COLORS.white} />
            </TouchableOpacity>
            
            <Text style={styles.monthText}>January 2025</Text>
            
            <TouchableOpacity style={styles.iconButton}>
              <ChevronRight size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Floating Summary Card */}
      <View style={styles.summaryCard}>
        {/* Income */}
        <View style={styles.column}>
          <Text style={styles.label}>Income</Text>
          <Text style={[styles.value, styles.incomeValue]}>$5,000</Text>
        </View>
        
        <View style={styles.divider} />
        
        {/* Expenses */}
        <View style={styles.column}>
          <Text style={styles.label}>Expenses</Text>
          <Text style={[styles.value, styles.expenseValue]}>$2,800</Text>
        </View>
        
        <View style={styles.divider} />
        
        {/* Balance */}
        <View style={styles.column}>
          <Text style={styles.label}>Balance</Text>
          <Text style={[styles.value, styles.balanceValue]}>$2,200</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 60, // Space for the floating card to overlap content
  },
  purpleBackground: {
    backgroundColor: COLORS.primary,
    height: height * 0.25, // Top 25-30%
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    width: '100%',
    alignItems: 'center',
  },
  safeArea: {
    width: '100%',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.m,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    marginHorizontal: SPACING.l,
  },
  iconButton: {
    padding: 8,
  },
  summaryCard: {
    position: 'absolute',
    bottom: -50, // Floating halfway
    left: 24,
    right: 24,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.l, // 24px
    paddingVertical: SPACING.l,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
  },
  incomeValue: {
    color: COLORS.success,
  },
  expenseValue: {
    color: COLORS.danger,
  },
  balanceValue: {
    color: COLORS.primary,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
});
