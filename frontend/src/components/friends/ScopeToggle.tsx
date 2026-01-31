import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

const OPTIONS = ['Friends', 'Groups'];
const { width } = Dimensions.get('window');
const CONTAINER_WIDTH = width - 48; // Margin 24 * 2
const TAB_WIDTH = (CONTAINER_WIDTH - 8) / 2; // Padding 4 * 2

interface ScopeToggleProps {
  mode: 'Friends' | 'Groups';
  setMode: (mode: 'Friends' | 'Groups') => void;
}

export default function ScopeToggle({ mode, setMode }: ScopeToggleProps) {
  const translateX = useSharedValue(0);

  React.useEffect(() => {
    const index = OPTIONS.indexOf(mode);
    translateX.value = withSpring(index * TAB_WIDTH, { damping: 15, stiffness: 150 });
  }, [mode]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.activePill, animatedStyle]} />
      {OPTIONS.map((option) => {
        const isActive = mode === option;
        return (
          <TouchableOpacity
            key={option}
            style={styles.tab}
            onPress={() => setMode(option as 'Friends' | 'Groups')}
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
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.circle,
    height: 48,
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 4,
    ...SHADOWS.soft,
  },
  activePill: {
    position: 'absolute',
    width: TAB_WIDTH,
    height: 40,
    top: 4,
    left: 4,
    backgroundColor: COLORS.primary, // Purple active indicator for text color logic, but background style? 
    // Wait, prompt said: "Pill-shaped, white background, Purple (#7C3AED) active state text/indicator."
    // Let's invert: White background for toggle, Purple pill? Or White background, Purple Text?
    // "Sliding segmented control... Purple active state text/indicator" usually means the pill is purple, text white.
    // Or pill is white/light purple, text is purple.
    // Let's go with Purple Pill, White Text for active, like the Income/Expense toggle but simpler.
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.circle,
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
    color: COLORS.white,
    fontWeight: '600',
  },
});
