import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Search } from 'lucide-react-native';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

const FILTERS = ['All', 'Expenses', 'Income', 'Pending'];

interface TransactionsHeaderProps {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

export default function TransactionsHeader({ activeFilter, setActiveFilter }: TransactionsHeaderProps) {
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Row 1: Title & Search */}
        <View style={styles.topRow}>
          <Text style={styles.title}>Transactions</Text>
          <TouchableOpacity style={styles.searchButton}>
            <Search size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Row 2: Filter Pills */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterContainer}
        >
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.pill, isActive && styles.activePill]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, isActive && styles.activePillText]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.soft,
    zIndex: 10,
  },
  safeArea: {
    paddingBottom: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.m,
    paddingTop: SPACING.s,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  searchButton: {
    padding: 8,
    backgroundColor: COLORS.background,
    borderRadius: 20,
  },
  filterContainer: {
    paddingHorizontal: SPACING.l,
    gap: 12,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  activePill: {
    backgroundColor: COLORS.primary,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activePillText: {
    color: COLORS.white,
  },
});
