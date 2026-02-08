import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { COLORS } from '../../src/constants/theme';
import { useDataStore, convertCurrency } from '../../src/store/dataStore';
import { useAuth } from '../../src/contexts/AuthContext';

import DashboardHeader from '../../src/components/dashboard/DashboardHeader';
import CategoryExpenseCard from '../../src/components/dashboard/CategoryExpenseCard';

export default function Dashboard() {
  const { user } = useAuth();
  const {
    dashboardSummary,
    transactions,
    userProfile,
    fetchDashboard,
    fetchTransactions,
    fetchAccounts,
    fetchContacts,
    fetchCategories,
    fetchUserProfile,
  } = useDataStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentView, setCurrentView] = useState<'cashflow' | 'networth'>('cashflow');

  const primaryCurrency = userProfile?.base_currency || 'USD';

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      await fetchUserProfile(); // Fetch user profile first for currency
      await Promise.all([
        fetchDashboard(),
        fetchTransactions(),
        fetchAccounts(),
        fetchContacts(),
        fetchCategories(),
      ]);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleViewChange = (view: 'cashflow' | 'networth') => {
    setCurrentView(view);
  };

  // Calculate category breakdown from transactions
  const categoryData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    // Filter based on current view
    const filterType = currentView === 'cashflow' ? 'EXPENSE' : 'INCOME';

    const relevantTransactions = transactions.filter(tx => {
      // Filter by transaction type (TRANSFER is excluded from both views)
      if (tx.transaction_type !== filterType) return false;
      return true;
    });

    const categoryMap: Record<string, { count: number; total: number }> = {};
    let totalAmount = 0;

    relevantTransactions.forEach(tx => {
      const category = tx.description || 'Other';
      const txAmount = convertCurrency(
        Math.abs(tx.total_amount),
        tx.currency_code || 'USD',
        primaryCurrency
      );

      let actualAmount = txAmount;

      // For EXPENSE transactions, deduct DEBT splits (amount owed by others)
      if (tx.transaction_type === 'EXPENSE' && tx.splits && tx.splits.length > 0) {
        const debtSplits = tx.splits.filter(s => s.split_type === 'DEBT');
        const splitTotal = debtSplits.reduce((sum, s) => {
          return sum + convertCurrency(
            Number(s.amount),
            s.currency_code || 'USD',
            primaryCurrency
          );
        }, 0);
        actualAmount = Math.max(0, txAmount - splitTotal);
      }

      if (!categoryMap[category]) {
        categoryMap[category] = { count: 0, total: 0 };
      }
      categoryMap[category].count += 1;
      categoryMap[category].total += actualAmount;
      totalAmount += actualAmount;
    });


    return Object.entries(categoryMap)
      .map(([name, data], index) => ({
        id: String(index),
        category: name,
        count: data.count,
        amount: data.total.toFixed(2),
        percent: totalAmount > 0 ? data.total / totalAmount : 0,
      }))
      .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount)); // Sort by amount descending
  }, [transactions, currentView, primaryCurrency]);

  const sectionTitle = currentView === 'cashflow' ? 'Expenses by Category' : 'Income by Category';

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={categoryData}
        keyExtractor={(item) => item.id}

        ListHeaderComponent={
          <>
            <DashboardHeader
              summary={dashboardSummary}
              primaryCurrency={primaryCurrency}
              onViewChange={handleViewChange}
            />
            <Text style={styles.sectionTitle}>{sectionTitle}</Text>
          </>
        }

        renderItem={({ item }) => (
          <CategoryExpenseCard
            category={item.category}
            count={item.count}
            amount={item.amount}
            percent={item.percent}
            currencyCode={primaryCurrency}
            isIncome={currentView === 'networth'}
          />
        )}


        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {currentView === 'cashflow' ? 'No expenses yet' : 'No income yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {currentView === 'cashflow'
                ? 'Add your first expense to get started'
                : 'Add your first income to get started'
              }
            </Text>
          </View>
        }

        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
  scrollContent: {
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: 24,
    marginBottom: 16,
    marginTop: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
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
