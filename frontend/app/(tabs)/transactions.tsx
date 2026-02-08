import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SectionList, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';
import { useDataStore, Transaction } from '../../src/store/dataStore';

import TransactionsHeader from '../../src/components/transactions/TransactionsHeader';
import TransactionRow from '../../src/components/transactions/TransactionRow';

// Helper to format date
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
};

// Group transactions by date
const groupTransactionsByDate = (transactions: Transaction[]) => {
  const groups: Record<string, Transaction[]> = {};

  transactions.forEach(tx => {
    const dateKey = formatDate(tx.occurred_at);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(tx);
  });

  return Object.entries(groups).map(([title, data]) => ({
    title,
    data: data.map(tx => {
      // Calculate net amount (User's share)
      // Total - Splits (Debt)
      const debtAmount = tx.splits?.reduce((sum, s) => sum + (s.amount > 0 ? s.amount : 0), 0) || 0;

      // Only subtract debt for Shared Expenses. 
      // For Transfers (Lend) and Settlements, we want to see the full cash flow amount.
      const netAmount = tx.transaction_type === 'EXPENSE'
        ? Math.abs(tx.total_amount) - debtAmount
        : Math.abs(tx.total_amount);

      return {
        id: tx.id,
        type: tx.transaction_type === 'INCOME' ? 'income' : 'expense',
        desc: tx.description || 'Transaction',
        amount: netAmount > 0 ? netAmount : 0, // Ensure no negative amounts
        currency: tx.currency_code || 'AED', // Fallback to AED if missing, but should exist
        category: tx.description || 'Other',
        account: tx.account_name || 'Account',
        isSplit: tx.splits && tx.splits.length > 0,
      };
    }),
  }));

};

export default function TransactionsScreen() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { transactions, fetchTransactions } = useDataStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await fetchTransactions();
    } catch (error) {
      console.error('Load transactions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter and group transactions
  const filteredTransactions = React.useMemo(() => {
    let filtered = transactions;

    if (activeFilter === 'Expenses') {
      filtered = transactions.filter(t => t.transaction_type === 'EXPENSE');
    } else if (activeFilter === 'Income') {
      filtered = transactions.filter(t => t.transaction_type === 'INCOME');
    } else if (activeFilter === 'Split') {
      filtered = transactions.filter(t => t.splits && t.splits.length > 0);
    }

    return groupTransactionsByDate(filtered);
  }, [transactions, activeFilter]);

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TransactionsHeader activeFilter={activeFilter} setActiveFilter={setActiveFilter} />

      <SectionList
        sections={filteredTransactions as any}
        keyExtractor={(item) => item.id}

        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}

        renderItem={({ item, index, section }) => (
          <View style={[
            styles.itemContainer,
            index === 0 && styles.firstItem,
            index === section.data.length - 1 && styles.lastItem,
          ]}>
            <TransactionRow item={item} isLast={index === section.data.length - 1} />
          </View>
        )}

        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to add your first transaction
            </Text>
          </View>
        }

        contentContainerStyle={[
          styles.listContent,
          filteredTransactions.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 100,
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    flexGrow: 1,
  },
  emptyListContent: {
    justifyContent: 'center',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  itemContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 0,
    ...SHADOWS.soft,
  },
  firstItem: {
    borderTopLeftRadius: RADIUS.l,
    borderTopRightRadius: RADIUS.l,
  },
  lastItem: {
    borderBottomLeftRadius: RADIUS.l,
    borderBottomRightRadius: RADIUS.l,
    marginBottom: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
