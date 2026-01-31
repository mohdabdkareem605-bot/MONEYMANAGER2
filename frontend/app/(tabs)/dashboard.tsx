import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { COLORS } from '../../constants/theme';

import DashboardHeader from '../../src/components/dashboard/DashboardHeader';
import PendingCollections from '../../src/components/dashboard/PendingCollections';
import RecentTransactionCard from '../../src/components/dashboard/RecentTransactionCard';

const RECENT_TRANSACTIONS = [
  { 
    id: '1', 
    title: 'Sushi with Bob', 
    date: 'Today, 12:30 PM', 
    amount: '200', 
    type: 'physical', 
    category: 'Food', 
    splitInfo: 'Lent AED 100',
    isPositive: false 
  },
  { 
    id: '2', 
    title: 'Uber to Work', 
    date: 'Yesterday, 8:45 AM', 
    amount: '45', 
    type: 'physical', 
    category: 'Transport', 
    isPositive: false 
  },
  { 
    id: '3', 
    title: 'Movie Tickets', 
    date: 'Jan 28, 7:00 PM', 
    amount: '120', 
    type: 'physical', 
    category: 'Social', 
    splitInfo: 'Lent AED 60',
    isPositive: false 
  },
  { 
    id: '4', 
    title: 'Grocery Run', 
    date: 'Jan 27, 5:15 PM', 
    amount: '350', 
    type: 'physical', 
    category: 'Shopping', 
    isPositive: false 
  },
];

export default function Dashboard() {
  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader />
        
        <PendingCollections />
        
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {RECENT_TRANSACTIONS.map((item) => (
            <RecentTransactionCard key={item.id} item={item as any} />
          ))}
        </View>

      </ScrollView>
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
  listContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: 24,
    marginBottom: 16,
  },
});
