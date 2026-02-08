import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Animated, TextInput, Alert } from 'react-native';
import { X, Plus, Pencil, Check } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

const { height } = Dimensions.get('window');

interface SelectionSheetProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  items: { id: string; label: string; icon: any }[];
  onSelect: (item: any) => void;
  selectedId: string;
  onAddNew?: () => void;  // Changed to just trigger callback (for modal)
  onEdit?: (item: any) => void;  // Changed to trigger callback with item
  allowAdd?: boolean;
  allowEdit?: boolean;
  addButtonLabel?: string;
}

export default function SelectionSheet({
  isVisible,
  onClose,
  title,
  items,
  onSelect,
  selectedId,
  onAddNew,
  onEdit,
  allowAdd = false,
  allowEdit = false,
  addButtonLabel = 'Add New',
}: SelectionSheetProps) {
  const translateY = useRef(new Animated.Value(height)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, damping: 15, stiffness: 150, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: height, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]} pointerEvents={isVisible ? 'auto' : 'none'}>
      <Animated.View style={[styles.overlay, { opacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.headerActions}>
            {allowAdd && onAddNew && (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  setTimeout(() => onAddNew(), 100);
                }}
                style={styles.addHeaderBtn}
              >
                <Plus size={18} color={COLORS.white} />
                <Text style={styles.addHeaderText}>{addButtonLabel}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.grid}>
          {items.map((item) => {
            const isSelected = item.id === selectedId;
            const Icon = item.icon;
            const isDefault = item.id.startsWith('default-') || !isNaN(Number(item.id));

            return (
              <View key={item.id} style={styles.itemContainer}>
                <TouchableOpacity
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

                {/* Edit button for non-default items */}
                {allowEdit && !isDefault && onEdit && (
                  <TouchableOpacity
                    style={styles.editIconBtn}
                    onPress={() => {
                      onClose();
                      setTimeout(() => onEdit(item), 100);
                    }}
                  >
                    <Pencil size={12} color={COLORS.white} />
                  </TouchableOpacity>
                )}
              </View>
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
    paddingBottom: 100,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginRight: 12,
  },
  addHeaderText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
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
  itemContainer: {
    width: '23%',
    position: 'relative',
    marginBottom: SPACING.l,
  },
  item: {
    alignItems: 'center',
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
  selectedItem: {},
  // Edit button styles
  editIconBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    padding: 6,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
