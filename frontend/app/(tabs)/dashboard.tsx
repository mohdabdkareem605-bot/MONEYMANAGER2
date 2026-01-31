import React from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { COLORS } from '../../src/constants/theme';

import DashboardHeader from '../../src/components/dashboard/DashboardHeader';
import CategoryExpenseCard from '../../src/components/dashboard/CategoryExpenseCard';

const CATEGORY_DATA = [
  { id: '1', category: 'Food & Dining', count: 12, amount: '450.00', percent: 0.4 },
  { id: '2', category: 'Transport', count: 5, amount: '120.50', percent: 0.15 },
  { id: '3', category: 'Shopping', count: 3, amount: '340.00', percent: 0.25 },
  { id: '4', category: 'Home', count: 2, amount: '850.00', percent: 0.6 },
  { id: '5', category: 'Social', count: 8, amount: '210.00', percent: 0.2 },
  { id: '6', category: 'Travel', count: 1, amount: '1,200.00', percent: 0.8 },
];

export default function Dashboard() {
  return (
    <View style={styles.container}>
      <FlatList
        data={CATEGORY_DATA}
        keyExtractor={(item) => item.id}
        
        // Header Component (Purple + Summary Card)
        ListHeaderComponent={
          <>
            <DashboardHeader />
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
        
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 100, // Bottom Nav Space
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: 24,
    marginBottom: 16,
    marginTop: 8,
  },
});
