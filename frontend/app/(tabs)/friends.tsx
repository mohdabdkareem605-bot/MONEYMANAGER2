import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserPlus } from 'lucide-react-native';
import { COLORS, SHADOWS, RADIUS } from '../../src/constants/theme';

import FriendsHeader from '../../src/components/friends/FriendsHeader';
import ScopeToggle from '../../src/components/friends/ScopeToggle';
import FriendCard from '../../src/components/friends/FriendCard';

// Mock Data
const FRIENDS_DATA = [
  { id: '1', name: 'Alice', description: 'Non-group expenses', status: 'owed', amount: '150.00', currency: 'AED' },
  { id: '2', name: 'Bob', description: 'Settled up', status: 'settled' },
  { id: '3', name: 'Charlie', description: 'Non-group expenses', status: 'owing', amount: '50.00', currency: 'AED' },
  { id: '4', name: 'David', description: 'Trip to Dubai', status: 'owed', amount: '2,300.00', currency: 'AED' },
];

const GROUPS_DATA = [
  { id: '10', name: 'Apartment 4B', description: '3 members', status: 'owed', amount: '500.00', currency: 'USD' },
  { id: '11', name: 'Bali Trip', description: '5 members', status: 'owing', amount: '120.00', currency: 'USD' },
  { id: '12', name: 'Weekend BBQ', description: 'Settled up', status: 'settled' },
];

export default function FriendsScreen() {
  const [viewMode, setViewMode] = useState<'Friends' | 'Groups'>('Friends');

  const currentData = viewMode === 'Friends' ? FRIENDS_DATA : GROUPS_DATA;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Sticky Header Section */}
      <View style={styles.headerContainer}>
        <FriendsHeader />
        <ScopeToggle mode={viewMode} setMode={setViewMode} />
      </View>

      {/* Main List */}
      <FlatList
        data={currentData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FriendCard 
            item={item as any} 
            isGroup={viewMode === 'Groups'} 
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <UserPlus size={24} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    backgroundColor: COLORS.background,
    zIndex: 10,
  },
  listContent: {
    paddingBottom: 100, // Space for Bottom Nav + FAB
    paddingTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 110, // Above bottom tabs
    right: 24,
    width: 56,
    height: 56,
    borderRadius: RADIUS.circle,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
});
