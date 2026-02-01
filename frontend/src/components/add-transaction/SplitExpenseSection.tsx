import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Plus, User, Check, X } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Friend {
  id: string;
  label: string;
  icon: any;
}

interface SplitExpenseSectionProps {
  amount: number;
  friends?: Friend[];
  selectedFriends?: string[];
  setSelectedFriends?: (ids: string[]) => void;
  splitAmounts?: Record<string, number>;
  setSplitAmounts?: (amounts: Record<string, number>) => void;
}

const SPLIT_TYPES = ['Equal', 'Exact', '%'];

export default function SplitExpenseSection({ 
  amount, 
  friends = [],
  selectedFriends = [],
  setSelectedFriends,
  splitAmounts = {},
  setSplitAmounts,
}: SplitExpenseSectionProps) {
  const [isSplit, setIsSplit] = useState(false);
  const [splitType, setSplitType] = useState('Equal');
  const [showFriendPicker, setShowFriendPicker] = useState(false);

  const toggleSplit = (value: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSplit(value);
    if (!value && setSelectedFriends) {
      setSelectedFriends([]);
    }
  };

  const toggleFriend = (friendId: string) => {
    if (!setSelectedFriends) return;
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  // Calculate split amounts
  const participantCount = selectedFriends.length + 1; // +1 for self
  const perPersonAmount = participantCount > 1 ? amount / participantCount : 0;
  const lendingAmount = participantCount > 1 ? amount - perPersonAmount : 0;

  const selectedFriendsList = friends.filter(f => selectedFriends.includes(f.id));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Split Expense</Text>
        <Switch
          value={isSplit}
          onValueChange={toggleSplit}
          trackColor={{ false: '#E5E7EB', true: COLORS.primary }}
          thumbColor={COLORS.white}
          ios_backgroundColor="#E5E7EB"
        />
      </View>

      {isSplit && (
        <View style={styles.logicalLayer}>
          
          {/* Participants Row */}
          <Text style={styles.sectionLabel}>Participants</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.participantsScroll}>
            <View style={styles.participantsRow}>
              {/* Self */}
              <View style={styles.participant}>
                <View style={[styles.avatar, styles.activeAvatar]}>
                  <User size={20} color={COLORS.white} />
                </View>
                <Text style={styles.name}>You</Text>
              </View>

              {/* Selected Friends */}
              {selectedFriendsList.map((friend) => (
                <TouchableOpacity 
                  key={friend.id} 
                  style={styles.participant}
                  onPress={() => toggleFriend(friend.id)}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {friend.label.substring(0, 2).toUpperCase()}
                    </Text>
                    <View style={styles.removeBtn}>
                      <X size={12} color={COLORS.white} />
                    </View>
                  </View>
                  <Text style={styles.name} numberOfLines={1}>
                    {friend.label}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Add Button */}
              <TouchableOpacity 
                style={styles.addBtn}
                onPress={() => setShowFriendPicker(!showFriendPicker)}
              >
                <Plus size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Friend Picker */}
          {showFriendPicker && friends.length > 0 && (
            <View style={styles.friendPicker}>
              <Text style={styles.pickerLabel}>Select Friends</Text>
              <ScrollView style={styles.friendList} nestedScrollEnabled>
                {friends.map((friend) => {
                  const isSelected = selectedFriends.includes(friend.id);
                  return (
                    <TouchableOpacity
                      key={friend.id}
                      style={[styles.friendItem, isSelected && styles.friendItemSelected]}
                      onPress={() => toggleFriend(friend.id)}
                    >
                      <View style={styles.friendAvatar}>
                        <Text style={styles.friendAvatarText}>
                          {friend.label.substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.friendName}>{friend.label}</Text>
                      {isSelected && (
                        <Check size={20} color={COLORS.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              {friends.length === 0 && (
                <Text style={styles.noFriendsText}>
                  No friends added yet. Go to Friends tab to add some!
                </Text>
              )}
            </View>
          )}

          {/* Split Type Chips */}
          <View style={styles.chipRow}>
            {SPLIT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.chip, splitType === type && styles.activeChip]}
                onPress={() => setSplitType(type)}
              >
                <Text style={[styles.chipText, splitType === type && styles.activeChipText]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Truth Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>You Paid</Text>
              <Text style={styles.summaryValue}>${amount.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Your Share</Text>
              <Text style={styles.summaryValue}>${perPersonAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: COLORS.success }]}>Lending</Text>
              <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                ${lendingAmount.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
    marginBottom: 0,
    marginHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  logicalLayer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.l,
    padding: SPACING.m,
    marginTop: 8,
    ...SHADOWS.soft,
  },
  sectionLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  participantsScroll: {
    marginBottom: 12,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  participant: {
    alignItems: 'center',
    marginRight: 16,
    width: 60,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeAvatar: {
    backgroundColor: COLORS.primary,
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  removeBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 12,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendPicker: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.m,
    padding: SPACING.s,
    marginBottom: 12,
    maxHeight: 150,
  },
  pickerLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  friendList: {
    maxHeight: 120,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: RADIUS.s,
  },
  friendItemSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  friendAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  friendAvatarText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  friendName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  noFriendsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    padding: 8,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    marginRight: 8,
  },
  activeChip: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  activeChipText: {
    color: COLORS.white,
  },
  summaryCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    height: '100%',
  },
});
