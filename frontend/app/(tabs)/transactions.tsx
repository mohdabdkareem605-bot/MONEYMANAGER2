import React, { useState } from 'react';
import { View, StyleSheet, SectionList, Text } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

import TransactionsHeader from '../../src/components/transactions/TransactionsHeader';
import TransactionRow from '../../src/components/transactions/TransactionRow';

const DATA = [
  {
    title: 'Today',
    data: [
      { id: '1', type: 'expense', desc: 'Uber', amount: 45.00, category: 'Transport', account: 'Chase ••45', isSplit: false },
      { id: '2', type: 'expense', desc: 'Team Lunch', amount: 240.00, category: 'Food', account: 'Chase ••45', isSplit: true, lent: 120.00 }
    ]
  },
  {
    title: 'Yesterday',
    data: [
      { id: '3', type: 'expense', desc: 'Grocery Run', amount: 350.00, category: 'Shopping', account: 'Visa ••12', isSplit: false },
      { id: '4', type: 'income', desc: 'Freelance Payout', amount: 1500.00, category: 'Income', account: 'Chase ••45', isSplit: false }
    ]
  },
  {
    title: 'Mon, 27 Jan',
    data: [
      { id: '5', type: 'expense', desc: 'Movie Tickets', amount: 120.00, category: 'Food', account: 'Cash', isSplit: true, lent: 60.00 }
    ]
  }
];

export default function TransactionsScreen() {
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <View style={styles.container}>
      <TransactionsHeader activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
      
      <SectionList
        sections={DATA as any}
        keyExtractor={(item) => item.id}
        
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        
        renderItem={({ item, index, section }) => (
          // Group logic: Wrap all items of a section in one card visually?
          // SectionList renders item by item. To wrap them in a single card per section, 
          // we usually style the first and last item or the container. 
          // Better approach for "iPhone Settings" style: 
          // The renderItem is just the row. The visual "Card" effect is achieved by styling the first/last items 
          // or putting a container around the item but that breaks the connected card look.
          
          // Strategy: The SectionList container style can't do this easily per section.
          // Instead, we style each row with a white background.
          // Top row gets top-radius. Bottom row gets bottom-radius.
          
          <View style={[
            styles.itemContainer,
            index === 0 && styles.firstItem,
            index === section.data.length - 1 && styles.lastItem,
            // If it's a single item, it needs both
          ]}>
             <TransactionRow item={item} isLast={index === section.data.length - 1} />
          </View>
        )}
        
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false} // Clean look
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingBottom: 100, // Bottom Nav
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  // Card Group Styling
  itemContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 0, // Inner padding handles it
    ...SHADOWS.soft,
  },
  firstItem: {
    borderTopLeftRadius: RADIUS.l,
    borderTopRightRadius: RADIUS.l,
  },
  lastItem: {
    borderBottomLeftRadius: RADIUS.l,
    borderBottomRightRadius: RADIUS.l,
    marginBottom: 8, // Space after the card
  },
});
