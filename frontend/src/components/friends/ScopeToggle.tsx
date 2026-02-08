import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

const OPTIONS = ['Friends', 'Groups'];
const { width } = Dimensions.get('window');
const CONTAINER_WIDTH = width - 48;
const TAB_WIDTH = (CONTAINER_WIDTH - 8) / 2;

interface ScopeToggleProps {
  mode: 'Friends' | 'Groups';
  setMode: (mode: 'Friends' | 'Groups') => void;
}

export default function ScopeToggle({ mode, setMode }: ScopeToggleProps) {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const index = OPTIONS.indexOf(mode);
    Animated.spring(translateX, {
      toValue: index * TAB_WIDTH,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
  }, [mode]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.activePill, { transform: [{ translateX }] }]} />
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
