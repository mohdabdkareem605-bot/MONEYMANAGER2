import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { COLORS } from '../../src/constants/theme';
import { useDataStore } from '../../src/store/dataStore';
import { useAuth } from '../../src/contexts/AuthContext';

import DashboardHeader from '../../src/components/dashboard/DashboardHeader';
import CategoryExpenseCard from '../../src/components/dashboard/CategoryExpenseCard';

// Default categories for demo mode
const DEFAULT_CATEGORIES = [
  { id: '1', category: 'Food & Dining', count: 0, amount: '0.00', percent: 0 },
  { id: '2', category: 'Transport', count: 0, amount: '0.00', percent: 0 },
  { id: '3', category: 'Shopping', count: 0, amount: '0.00', percent: 0 },
  { id: '4', category: 'Home', count: 0, amount: '0.00', percent: 0 },
  { id: '5', category: 'Social', count: 0, amount: '0.00', percent: 0 },
  { id: '6', category: 'Travel', count: 0, amount: '0.00', percent: 0 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { 
    dashboardSummary, 
    transactions,
    fetchDashboard, 
    fetchTransactions,
    fetchAccounts,
    fetchContacts,
    fetchCategories,
  } = useDataStore();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
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

  // Calculate category breakdown from transactions
  const categoryData = React.useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return DEFAULT_CATEGORIES;
    }

    const categoryMap: Record<string, { count: number; total: number }> = {};
    let totalAmount = 0;

    transactions.forEach(tx => {
      const category = tx.description || 'Other';
      if (!categoryMap[category]) {
        categoryMap[category] = { count: 0, total: 0 };
      }
      categoryMap[category].count += 1;
      categoryMap[category].total += Math.abs(tx.total_amount);
      totalAmount += Math.abs(tx.total_amount);
    });

    return Object.entries(categoryMap).map(([name, data], index) => ({
      id: String(index),
      category: name,
      count: data.count,
      amount: data.total.toFixed(2),
      percent: totalAmount > 0 ? data.total / totalAmount : 0,
    }));
  }, [transactions]);

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
            <DashboardHeader summary={dashboardSummary} />
            <Text style={styles.sectionTitle}>Expenses by Category</Text>
          </>
        }
        
        renderItem={({ item }) => (
          <CategoryExpenseCard 
            category={item.category}
            count={item.count}
            amount={item.amount}
            percent={item.percent}
          />
        )}
        
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Add your first expense to get started</Text>
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
