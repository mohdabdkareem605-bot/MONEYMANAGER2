import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { User, Plus } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

const MOCK_PENDING = [
  { id: '1', name: 'Alice', amount: '150', image: null },
  { id: '2', name: 'Bob', amount: '50', image: null },
  { id: '3', name: 'Charlie', amount: '200', image: null },
  { id: '4', name: 'David', amount: '20', image: null },
];

export default function PendingCollections() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pending Collections</Text>
        <Text style={styles.seeAll}>See All</Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {MOCK_PENDING.map((user) => (
          <View key={user.id} style={styles.itemContainer}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <User size={24} color={COLORS.primary} />
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>!</Text>
              </View>
            </View>
            <Text style={styles.name} numberOfLines={1}>{user.name}</Text>
            <Text style={styles.amount}>{user.amount}</Text>
          </View>
        ))}
        
        {/* Add Reminder Action */}
        <TouchableOpacity style={styles.itemContainer}>
           <View style={[styles.avatar, styles.addAvatar]}>
             <Plus size={24} color={COLORS.textSecondary} />
           </View>
           <Text style={styles.name}>Remind</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.l, // 24px
    marginHorizontal: 24,
    marginTop: -40, // Negative margin overlap
    padding: SPACING.m,
    ...SHADOWS.medium, // Stronger shadow for floating effect
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  list: {
    paddingRight: SPACING.m,
    gap: 16,
  },
  itemContainer: {
    alignItems: 'center',
    width: 60,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  addAvatar: {
    backgroundColor: COLORS.background,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.warning,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  amount: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
