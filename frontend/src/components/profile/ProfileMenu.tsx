import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronRight, Settings, Bell, Shield, HelpCircle, LogOut, Wallet, FileText } from 'lucide-react-native';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../constants/theme';

const MENU_ITEMS = [
  {
    title: 'Account Settings',
    items: [
      { id: '1', icon: Settings, label: 'Preferences', color: '#6366F1' },
      { id: '2', icon: Wallet, label: 'Payment Methods', color: '#10B981' },
      { id: '3', icon: Bell, label: 'Notifications', color: '#F59E0B' },
    ]
  },
  {
    title: 'Support & Legal',
    items: [
      { id: '4', icon: HelpCircle, label: 'Help Center', color: '#3B82F6' },
      { id: '5', icon: FileText, label: 'Terms of Service', color: '#8B5CF6' },
      { id: '6', icon: Shield, label: 'Privacy Policy', color: '#EC4899' },
    ]
  }
];

export default function ProfileMenu() {
  return (
    <View style={styles.container}>
      {MENU_ITEMS.map((section, index) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.card}>
            {section.items.map((item, itemIndex) => {
              const Icon = item.icon;
              const isLast = itemIndex === section.items.length - 1;
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.row, !isLast && styles.borderBottom]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                    <Icon size={20} color={item.color} />
                  </View>
                  <Text style={styles.label}>{item.label}</Text>
                  <ChevronRight size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.logoutButton}>
        <LogOut size={20} color={COLORS.danger} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.l,
    ...SHADOWS.soft,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: RADIUS.l,
    gap: 8,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.danger,
  },
});
