import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import type { DashboardSummary } from '../../store/dataStore';

const { height } = Dimensions.get('window');

interface Props {
  summary?: DashboardSummary | null;
  primaryCurrency?: string;
  onViewChange?: (view: 'cashflow' | 'networth') => void;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD': '$',
  'INR': '₹',
  'AED': 'د.إ',
  'EUR': '€',
  'GBP': '£',
};

export default function DashboardHeader({ summary, primaryCurrency = 'USD', onViewChange }: Props) {
  const [currentView, setCurrentView] = useState<'cashflow' | 'networth'>('cashflow');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const currencySymbol = CURRENCY_SYMBOLS[primaryCurrency] || primaryCurrency;

  const formatAmount = (amount: number) => {
    return `${currencySymbol}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const toggleView = (direction: 'prev' | 'next') => {
    const newView = currentView === 'cashflow' ? 'networth' : 'cashflow';
    setCurrentView(newView);
    onViewChange?.(newView);
  };

  // Data for Cash Flow view
  const cashFlowData = [
    { label: 'Income', value: summary?.total_income || 0, color: COLORS.success },
    { label: 'Expense', value: summary?.total_expenses || 0, color: COLORS.danger },
    { label: 'Net', value: summary?.net_savings || 0, color: (summary?.net_savings || 0) >= 0 ? COLORS.success : COLORS.danger },
  ];

  // Data for Net Worth view
  const netWorthData = [
    { label: 'Assets', value: summary?.total_assets || 0, color: COLORS.primary },
    { label: 'Liabilities', value: summary?.total_liabilities || 0, color: COLORS.danger },
    { label: 'Net Worth', value: summary?.net_worth || 0, color: (summary?.net_worth || 0) >= 0 ? COLORS.success : COLORS.danger },
  ];

  const displayData = currentView === 'cashflow' ? cashFlowData : netWorthData;
  const viewTitle = currentView === 'cashflow' ? 'Cash Flow' : 'Net Worth';

  return (
    <View style={styles.container}>
      <View style={styles.purpleBackground}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          {/* Month Selector */}
          <View style={styles.monthSelector}>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigateMonth('prev')}>
              <ChevronLeft size={24} color={COLORS.white} />
            </TouchableOpacity>

            <Text style={styles.monthText}>{formatMonthYear(currentMonth)}</Text>

            <TouchableOpacity style={styles.iconButton} onPress={() => navigateMonth('next')}>
              <ChevronRight size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* View Toggle */}
          <View style={styles.viewToggle}>
            <TouchableOpacity style={styles.toggleButton} onPress={() => toggleView('prev')}>
              <ChevronLeft size={18} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>

            <Text style={styles.viewTitle}>{viewTitle}</Text>

            <TouchableOpacity style={styles.toggleButton} onPress={() => toggleView('next')}>
              <ChevronRight size={18} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Floating Summary Card */}
      <View style={styles.summaryCard}>
        {displayData.map((item, index) => (
          <React.Fragment key={item.label}>
            <View style={styles.column}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={[styles.value, { color: item.color }]}>
                {item.label === 'Expense' || item.label === 'Liabilities' ? '-' : ''}
                {formatAmount(item.value)}
              </Text>
            </View>
            {index < displayData.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 60,
  },
  purpleBackground: {
    backgroundColor: COLORS.primary,
    height: height * 0.28,
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
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.m,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.l,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.s,
    alignSelf: 'center',
  },
  toggleButton: {
    padding: 6,
  },
  viewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginHorizontal: SPACING.m,
    minWidth: 80,
    textAlign: 'center',
  },
  summaryCard: {
    position: 'absolute',
    bottom: -50,
    left: 24,
    right: 24,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.l,
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
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
});
