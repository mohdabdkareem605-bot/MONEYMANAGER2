import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

const { height } = Dimensions.get('window');

interface SelectionSheetProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  items: { id: string; label: string; icon: any }[];
  onSelect: (item: any) => void;
  selectedId: string;
}

export default function SelectionSheet({ isVisible, onClose, title, items, onSelect, selectedId }: SelectionSheetProps) {
  const translateY = useSharedValue(height);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(height, { duration: 300 });
    }
  }, [isVisible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!isVisible && opacity.value === 0) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]} pointerEvents={isVisible ? 'auto' : 'none'}>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.sheet, sheetStyle]}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.grid}>
          {items.map((item) => {
            const isSelected = item.id === selectedId;
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.item, isSelected && styles.selectedItem]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <View style={[styles.iconWrapper, isSelected && styles.selectedIconWrapper]}>
                  <Icon size={24} color={isSelected ? COLORS.white : COLORS.primary} />
                </View>
                <Text style={[styles.label, isSelected && styles.selectedLabel]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.l,
    borderTopRightRadius: RADIUS.l,
    paddingBottom: 100, // Increased to clear Tab Bar
    maxHeight: height * 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  grid: {
    padding: SPACING.l,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  item: {
    width: '23%', // 4 items per row roughly
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedIconWrapper: {
    backgroundColor: COLORS.primary,
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  selectedLabel: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  selectedItem: {
    // Opacity or scale if needed
  }
});
