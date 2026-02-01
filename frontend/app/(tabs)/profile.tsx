import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LogOut, Settings, CreditCard, Bell, Shield, CircleHelp, ChevronRight, User } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { useDataStore } from '../../src/store/dataStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();
  const { accounts, fetchAccounts } = useDataStore();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            await signOut();
            setSigningOut(false);
            router.replace('/auth/login');
          }
        },
      ]
    );
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.current_balance, 0);

  const menuItems = [
    { icon: CreditCard, label: 'Accounts', subtitle: `${accounts.length} accounts`, onPress: () => {} },
    { icon: Bell, label: 'Notifications', subtitle: 'Manage alerts', onPress: () => {} },
    { icon: Settings, label: 'Settings', subtitle: 'App preferences', onPress: () => {} },
    { icon: Shield, label: 'Privacy', subtitle: 'Data & security', onPress: () => {} },
    { icon: CircleHelp, label: 'Help & Support', subtitle: 'FAQ & contact', onPress: () => {} },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <User size={40} color={COLORS.white} />
          </View>
          
          {user ? (
            <>
              <Text style={styles.name}>{user.phone || 'User'}</Text>
              <Text style={styles.subtitle}>
                Phone: {user.phone || 'Not set'}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.name}>Demo Mode</Text>
              <Text style={styles.subtitle}>Sign in to sync your data</Text>
            </>
          )}
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Account Balance</Text>
          <Text style={styles.balanceAmount}>
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.balanceSubtext}>
            Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.menuItem,
                index === 0 && styles.menuItemFirst,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuIcon}>
                <item.icon size={22} color={COLORS.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <ChevronRight size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Auth Button */}
        {user ? (
          <TouchableOpacity 
            style={styles.signOutBtn}
            onPress={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? (
              <ActivityIndicator color={COLORS.danger} />
            ) : (
              <>
                <LogOut size={20} color={COLORS.danger} />
                <Text style={styles.signOutText}>Sign Out</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.loginBtn}
            onPress={handleLogin}
          >
            <Text style={styles.loginBtnText}>Sign In</Text>
          </TouchableOpacity>
        )}

        {/* Version */}
        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.l,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.m,
    ...SHADOWS.medium,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  balanceCard: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.l,
    borderRadius: RADIUS.l,
    padding: SPACING.l,
    alignItems: 'center',
    marginBottom: SPACING.l,
    ...SHADOWS.medium,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  menuSection: {
    marginHorizontal: SPACING.l,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.l,
    ...SHADOWS.soft,
    marginBottom: SPACING.l,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemFirst: {
    borderTopLeftRadius: RADIUS.l,
    borderTopRightRadius: RADIUS.l,
  },
  menuItemLast: {
    borderBottomLeftRadius: RADIUS.l,
    borderBottomRightRadius: RADIUS.l,
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderRadius: RADIUS.l,
    backgroundColor: COLORS.white,
    gap: SPACING.s,
    ...SHADOWS.soft,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.danger,
  },
  loginBtn: {
    marginHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderRadius: RADIUS.l,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.l,
  },
});
