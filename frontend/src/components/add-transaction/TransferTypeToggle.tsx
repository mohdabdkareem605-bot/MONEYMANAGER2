import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';

const OPTIONS = ['Internal Transfer', 'Pay Friend'];
const { width } = Dimensions.get('window');
// Calculate width based on container padding (24 * 2 = 48)
const CONTAINER_WIDTH = width - 48;
const TAB_WIDTH = (CONTAINER_WIDTH - 8) / 2; // -8 for internal padding

interface TransferTypeToggleProps {
  type: string;
  setType: (type: string) => void;
}

export default function TransferTypeToggle({ type, setType }: TransferTypeToggleProps) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((option) => {
        const isActive = type === option;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => setType(option)}
            activeOpacity={0.8}
          >
            <Text style={[styles.text, isActive && styles.activeText]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: RADIUS.m,
    padding: 4,
    marginHorizontal: 24,
    marginBottom: 16,
    height: 40,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.s,
  },
  activeTab: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  activeText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
});
