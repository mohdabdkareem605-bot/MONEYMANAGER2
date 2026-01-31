import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { COLORS, SHADOWS, RADIUS } from '../../constants/theme';

const OPTIONS = ['Income', 'Expense', 'Transfer'];
const { width } = Dimensions.get('window');
const TOGGLE_WIDTH = width - 48; // Padding on screen
const TAB_WIDTH = TOGGLE_WIDTH / 3;

interface TransactionTypeToggleProps {
  type: string;
  setType: (type: string) => void;
}

export default function TransactionTypeToggle({ type, setType }: TransactionTypeToggleProps) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    const index = OPTIONS.indexOf(type);
    translateX.value = withSpring(index * TAB_WIDTH, { damping: 15, stiffness: 150 });
  }, [type]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.activePill, animatedStyle]} />
      {OPTIONS.map((option) => (
        <TouchableOpacity
          key={option}
          style={styles.tab}
          onPress={() => setType(option)}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.text,
            type === option && styles.activeText
          ]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.l,
    height: 48,
    position: 'relative',
    marginHorizontal: 24,
    marginTop: 16,
    ...SHADOWS.soft,
  },
  activePill: {
    position: 'absolute',
    width: TAB_WIDTH,
    height: 40,
    top: 4,
    left: 0,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.l - 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  activeText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
