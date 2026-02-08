import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView, LayoutAnimation, Platform, UIManager, TextInput } from 'react-native';
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

const SPLIT_TYPES = ['Equal', 'Percentage', 'Custom'];

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

  // Smart fields: what you paid and your share
  const [youPaid, setYouPaid] = useState<string>('');
  const [yourShare, setYourShare] = useState<string>('');

  // Percentage splits (for percentage mode)
  const [percentages, setPercentages] = useState<Record<string, string>>({});

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

  // Calculate participant count
  const participantCount = selectedFriends.length + 1; // +1 for self

  // Initialize "You Paid" with amount when it changes
  useEffect(() => {
    if (amount > 0) {
      setYouPaid(amount.toString());
    }
  }, [amount]);

  // Auto-calculate based on split type
  useEffect(() => {
    if (!setSplitAmounts || selectedFriends.length === 0) return;

    if (splitType === 'Equal') {
      const equalAmount = amount / participantCount;
      const newAmounts: Record<string, number> = {};
      selectedFriends.forEach(id => {
        newAmounts[id] = equalAmount;
      });
      setSplitAmounts(newAmounts);
      setYourShare(equalAmount.toFixed(2));

      // Set equal percentages
      const equalPercent = (100 / participantCount).toFixed(1);
      const newPercentages: Record<string, string> = { you: equalPercent };
      selectedFriends.forEach(id => {
        newPercentages[id] = equalPercent;
      });
      setPercentages(newPercentages);
    }
  }, [splitType, selectedFriends.length, amount, participantCount]);

  // Smart auto-calculation for 2 users
  const handleYouPaidChange = (value: string) => {
    setYouPaid(value);
  };

  const handleYourShareChange = (value: string) => {
    setYourShare(value);
    const yourShareNum = parseFloat(value) || 0;

    // For 2 participants, auto-calculate friend's share
    if (participantCount === 2 && selectedFriends.length === 1 && setSplitAmounts) {
      const friendShare = amount - yourShareNum;
      setSplitAmounts({ [selectedFriends[0]]: friendShare > 0 ? friendShare : 0 });
    }
  };

  const updateFriendAmount = (friendId: string, value: string) => {
    if (!setSplitAmounts) return;
    const numValue = parseFloat(value) || 0;
    setSplitAmounts({ ...splitAmounts, [friendId]: numValue });

    // For 2 participants, auto-calculate your share
    if (participantCount === 2 && selectedFriends.length === 1) {
      const yourShareCalc = amount - numValue;
      setYourShare(yourShareCalc > 0 ? yourShareCalc.toFixed(2) : '0');
    }
  };

  const updatePercentage = (id: string, value: string) => {
    const newPercentages = { ...percentages, [id]: value };
    setPercentages(newPercentages);

    // Recalculate amounts based on percentages
    if (setSplitAmounts) {
      const yourPercent = parseFloat(newPercentages.you || '0') / 100;
      setYourShare((amount * yourPercent).toFixed(2));

      const newAmounts: Record<string, number> = {};
      selectedFriends.forEach(friendId => {
        const friendPercent = parseFloat(newPercentages[friendId] || '0') / 100;
        newAmounts[friendId] = amount * friendPercent;
      });
      setSplitAmounts(newAmounts);
    }
  };

  const selectedFriendsList = friends.filter(f => selectedFriends.includes(f.id));

  // Calculate totals
  const totalFriendSplit = selectedFriends.reduce((sum, id) => sum + (splitAmounts[id] || 0), 0);
  const yourShareNum = parseFloat(yourShare) || 0;
  const youPaidNum = parseFloat(youPaid) || 0;
  const lendingAmount = youPaidNum - yourShareNum;

  // Validation
  const totalPercentage = Object.values(percentages).reduce((sum, p) => sum + (parseFloat(p) || 0), 0);
  const isPercentageValid = splitType !== 'Percentage' || Math.abs(totalPercentage - 100) < 0.1;
  const isTotalValid = splitType === 'Equal' || Math.abs(yourShareNum + totalFriendSplit - amount) < 0.01;

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

          {/* You Paid Field (always visible) */}
          {selectedFriends.length > 0 && (
            <View style={styles.splitInputSection}>
              <Text style={styles.splitInputLabel}>You Paid</Text>
              <View style={styles.splitInputRow}>
                <View style={styles.splitInputPerson}>
                  <View style={[styles.smallAvatar, { backgroundColor: COLORS.primary }]}>
                    <User size={14} color={COLORS.white} />
                  </View>
                  <Text style={styles.splitInputName}>Total Paid</Text>
                </View>
                <View style={styles.splitInputWrapper}>
                  <TextInput
                    style={styles.splitInput}
                    value={youPaid}
                    onChangeText={handleYouPaidChange}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
              </View>
            </View>
          )}

          {/* EQUAL Mode - Just shows calculated values */}
          {splitType === 'Equal' && selectedFriends.length > 0 && (
            <View style={styles.splitInputSection}>
              <Text style={styles.splitInputLabel}>Equal Split ({participantCount} people)</Text>

              <View style={styles.splitInputRow}>
                <View style={styles.splitInputPerson}>
                  <View style={[styles.smallAvatar, { backgroundColor: COLORS.primary }]}>
                    <User size={14} color={COLORS.white} />
                  </View>
                  <Text style={styles.splitInputName}>Your Share</Text>
                </View>
                <Text style={styles.splitAmountDisplay}>
                  {(amount / participantCount).toFixed(2)}
                </Text>
              </View>

              {selectedFriendsList.map((friend) => (
                <View key={friend.id} style={styles.splitInputRow}>
                  <View style={styles.splitInputPerson}>
                    <View style={styles.smallAvatar}>
                      <Text style={styles.smallAvatarText}>
                        {friend.label.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.splitInputName} numberOfLines={1}>{friend.label}</Text>
                  </View>
                  <Text style={styles.splitAmountDisplay}>
                    {(amount / participantCount).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* PERCENTAGE Mode */}
          {splitType === 'Percentage' && selectedFriends.length > 0 && (
            <View style={styles.splitInputSection}>
              <Text style={styles.splitInputLabel}>Enter percentages</Text>

              {/* Your percentage */}
              <View style={styles.splitInputRow}>
                <View style={styles.splitInputPerson}>
                  <View style={[styles.smallAvatar, { backgroundColor: COLORS.primary }]}>
                    <User size={14} color={COLORS.white} />
                  </View>
                  <Text style={styles.splitInputName}>Your Share</Text>
                </View>
                <View style={styles.splitInputWrapper}>
                  <TextInput
                    style={styles.splitInput}
                    value={percentages.you || ''}
                    onChangeText={(value) => updatePercentage('you', value)}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                  <Text style={styles.percentSymbol}>%</Text>
                </View>
              </View>

              {/* Friends percentages */}
              {selectedFriendsList.map((friend) => (
                <View key={friend.id} style={styles.splitInputRow}>
                  <View style={styles.splitInputPerson}>
                    <View style={styles.smallAvatar}>
                      <Text style={styles.smallAvatarText}>
                        {friend.label.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.splitInputName} numberOfLines={1}>{friend.label}</Text>
                  </View>
                  <View style={styles.splitInputWrapper}>
                    <TextInput
                      style={styles.splitInput}
                      value={percentages[friend.id] || ''}
                      onChangeText={(value) => updatePercentage(friend.id, value)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={COLORS.textSecondary}
                    />
                    <Text style={styles.percentSymbol}>%</Text>
                  </View>
                </View>
              ))}

              {/* Percentage validation */}
              {!isPercentageValid && (
                <Text style={styles.validationWarning}>
                  Total: {totalPercentage.toFixed(1)}% (should be 100%)
                </Text>
              )}
            </View>
          )}

          {/* CUSTOM Mode - Editable amounts */}
          {splitType === 'Custom' && selectedFriends.length > 0 && (
            <View style={styles.splitInputSection}>
              <Text style={styles.splitInputLabel}>Enter exact amounts</Text>

              {/* Your Share */}
              <View style={styles.splitInputRow}>
                <View style={styles.splitInputPerson}>
                  <View style={[styles.smallAvatar, { backgroundColor: COLORS.primary }]}>
                    <User size={14} color={COLORS.white} />
                  </View>
                  <Text style={styles.splitInputName}>Your Share</Text>
                </View>
                <View style={styles.splitInputWrapper}>
                  <TextInput
                    style={styles.splitInput}
                    value={yourShare}
                    onChangeText={handleYourShareChange}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
              </View>

              {/* Friends amounts */}
              {selectedFriendsList.map((friend) => (
                <View key={friend.id} style={styles.splitInputRow}>
                  <View style={styles.splitInputPerson}>
                    <View style={styles.smallAvatar}>
                      <Text style={styles.smallAvatarText}>
                        {friend.label.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.splitInputName} numberOfLines={1}>{friend.label}</Text>
                  </View>
                  <View style={styles.splitInputWrapper}>
                    <TextInput
                      style={styles.splitInput}
                      value={(splitAmounts[friend.id] || '').toString()}
                      onChangeText={(value) => updateFriendAmount(friend.id, value)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={COLORS.textSecondary}
                    />
                  </View>
                </View>
              ))}

              {/* Validation message */}
              {!isTotalValid && (
                <Text style={styles.validationWarning}>
                  Total: {(yourShareNum + totalFriendSplit).toFixed(2)} (should be {amount.toFixed(2)})
                </Text>
              )}
            </View>
          )}

          {/* Truth Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>You Paid</Text>
              <Text style={styles.summaryValue}>{youPaidNum.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Your Share</Text>
              <Text style={styles.summaryValue}>
                {splitType === 'Equal' ? (amount / participantCount).toFixed(2) : yourShareNum.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: COLORS.success }]}>Lending</Text>
              <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                {splitType === 'Equal'
                  ? (amount - (amount / participantCount)).toFixed(2)
                  : (lendingAmount > 0 ? lendingAmount.toFixed(2) : '0.00')}
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
  // Split Input Styles (no currency symbol)
  splitInputSection: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.m,
    padding: SPACING.s,
    marginBottom: 12,
  },
  splitInputLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  splitInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  splitInputPerson: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  smallAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  smallAvatarText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  splitInputName: {
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
  },
  splitInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.s,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  splitInput: {
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'right',
    padding: 0,
    minWidth: 50,
  },
  splitAmountDisplay: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    paddingRight: 8,
  },
  percentSymbol: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  validationWarning: {
    fontSize: 12,
    color: '#F59E0B',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
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
