import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { CreditCard, ChevronDown, User, ArrowDown, Tag } from 'lucide-react-native';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../constants/theme';

interface TransferDetailsProps {
  transferType: 'Internal Transfer' | 'Pay Friend';
  fromAccount: string;
  toAccount: string; // Or Friend Name
  reason?: string;
  note: string;
  setNote: (text: string) => void;
  onSelectFrom: () => void;
  onSelectTo: () => void;
  onSelectReason?: () => void;
}

export default function TransferDetails({
  transferType,
  fromAccount,
  toAccount,
  reason,
  note,
  setNote,
  onSelectFrom,
  onSelectTo,
  onSelectReason
}: TransferDetailsProps) {

  const isPayFriend = transferType === 'Pay Friend';

  return (
    <View style={styles.container}>
      {/* Visual Connector Line */}
      <View style={styles.connectorLine} />
      <View style={styles.connectorArrow}>
        <ArrowDown size={12} color={COLORS.primary} />
      </View>

      {/* FROM Row */}
      <TouchableOpacity style={styles.row} onPress={onSelectFrom}>
        <View style={styles.iconContainer}>
          <CreditCard size={20} color={COLORS.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>From</Text>
          <Text style={styles.value}>{fromAccount}</Text>
        </View>
        <ChevronDown size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* TO Row */}
      <TouchableOpacity style={styles.row} onPress={onSelectTo}>
        <View style={styles.iconContainer}>
          {isPayFriend ? (
            <User size={20} color={COLORS.primary} />
          ) : (
            <CreditCard size={20} color={COLORS.primary} />
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>{isPayFriend ? "To Friend" : "To Account"}</Text>
          <Text style={styles.value}>{toAccount}</Text>
        </View>
        <ChevronDown size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Reason Row (Only for Pay Friend) */}
      {isPayFriend && (
        <>
          <TouchableOpacity style={styles.row} onPress={onSelectReason}>
            <View style={styles.iconContainer}>
              <Tag size={20} color={COLORS.primary} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.label}>Reason</Text>
              <Text style={styles.value}>{reason || 'Select Reason'}</Text>
            </View>
            <ChevronDown size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <View style={styles.divider} />
        </>
      )}

      {/* Note Row */}
      <View style={styles.row}>
        <View style={[styles.iconContainer, { backgroundColor: 'transparent' }]} />
        <View style={styles.textContainer}>
          <TextInput
            style={styles.input}
            placeholder={isPayFriend ? "Settlement for..." : "Add a note..."}
            placeholderTextColor={COLORS.textSecondary}
            value={note}
            onChangeText={setNote}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.l,
    marginHorizontal: 24,
    paddingVertical: SPACING.s,
    marginBottom: 24,
    ...SHADOWS.soft,
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    zIndex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
    zIndex: 2,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  input: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.background,
    marginLeft: 72,
  },
  // Connector Visuals
  connectorLine: {
    position: 'absolute',
    left: 40 + SPACING.m - 20, // Padding + half icon width
    top: 50, // Approx center of first icon
    bottom: 120, // Stop before Note
    width: 2,
    backgroundColor: COLORS.primaryLight,
    zIndex: 0,
  },
  connectorArrow: {
    position: 'absolute',
    left: 40 + SPACING.m - 25,
    top: 92, // Midway between rows
    zIndex: 0,
  }
});
