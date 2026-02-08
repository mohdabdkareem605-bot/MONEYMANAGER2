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
import {
  LogOut, Settings, Bell, Shield, CircleHelp, ChevronRight, User,
  Plus, Pencil, Landmark, Wallet, CreditCard, Banknote, Globe, ChevronDown
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { useDataStore, convertCurrency } from '../../src/store/dataStore';
import AddAccountModal from '../../src/components/add-transaction/AddAccountModal';

// Currency symbols map
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  AED: 'د.إ',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  SAR: 'ر.س',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();
  const {
    accounts,
    fetchAccounts,
    createAccount,
    updateAccount,
    userProfile,
    fetchUserProfile,
    updatePrimaryCurrency
  } = useDataStore();
  const [signingOut, setSigningOut] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [showAccounts, setShowAccounts] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const AVAILABLE_CURRENCIES = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
  ];

  useEffect(() => {
    fetchAccounts();
    fetchUserProfile();
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

  const handleAddAccount = () => {
    setEditingAccount(null);
    setShowAccountModal(true);
  };

  const handleEditAccount = (account: any) => {
    setEditingAccount(account);
    setShowAccountModal(true);
  };

  const handleSaveAccount = async (data: { name: string; currency_code: string; current_balance: number }) => {
    try {
      if (editingAccount) {
        const updated = await updateAccount(editingAccount.id, {
          name: data.name,
          currency_code: data.currency_code,
          current_balance: data.current_balance
        });
        if (updated) {
          await fetchAccounts();
          Alert.alert('Success', 'Account updated!');
        }
      } else {
        const newAccount = await createAccount(data);
        if (newAccount) {
          await fetchAccounts();
          Alert.alert('Success', `Account "${data.name}" created!`);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save account');
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => {
    const primaryCurrency = userProfile?.base_currency || 'USD';
    return sum + convertCurrency(acc.current_balance, acc.currency_code, primaryCurrency);
  }, 0);


  const menuItems = [
    { icon: Bell, label: 'Notifications', subtitle: 'Manage alerts', onPress: () => { } },
    { icon: Settings, label: 'Settings', subtitle: 'App preferences', onPress: () => { } },
    { icon: Shield, label: 'Privacy', subtitle: 'Data & security', onPress: () => { } },
    { icon: CircleHelp, label: 'Help & Support', subtitle: 'FAQ & contact', onPress: () => { } },
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
            {CURRENCY_SYMBOLS[userProfile?.base_currency || 'USD'] || '$'}{totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.balanceSubtext}>
            Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Primary Currency Selector */}
        <View style={styles.currencySection}>
          <TouchableOpacity
            style={styles.currencyHeader}
            onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
          >
            <View style={styles.currencyHeaderLeft}>
              <Globe size={20} color={COLORS.primary} />
              <View>
                <Text style={styles.currencyTitle}>Primary Currency</Text>
                <Text style={styles.currencySubtitle}>All amounts displayed in this currency</Text>
              </View>
            </View>
            <View style={styles.currencyHeaderRight}>
              <Text style={styles.currencyValue}>
                {userProfile?.base_currency || 'USD'}
              </Text>
              <ChevronDown
                size={20}
                color={COLORS.textSecondary}
                style={{ transform: [{ rotate: showCurrencyPicker ? '180deg' : '0deg' }] }}
              />
            </View>
          </TouchableOpacity>

          {showCurrencyPicker && (
            <View style={styles.currencyList}>
              {AVAILABLE_CURRENCIES.map((currency) => (
                <TouchableOpacity
                  key={currency.code}
                  style={[
                    styles.currencyOption,
                    userProfile?.base_currency === currency.code && styles.currencyOptionSelected,
                  ]}
                  onPress={async () => {
                    await updatePrimaryCurrency(currency.code);
                    setShowCurrencyPicker(false);
                  }}
                >
                  <Text style={styles.currencySymbol}>{currency.symbol}</Text>
                  <View style={styles.currencyInfo}>
                    <Text style={styles.currencyCode}>{currency.code}</Text>
                    <Text style={styles.currencyName}>{currency.name}</Text>
                  </View>
                  {userProfile?.base_currency === currency.code && (
                    <View style={styles.currencyCheck}>
                      <Text style={styles.currencyCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Accounts Section */}
        <View style={styles.accountsSection}>
          <TouchableOpacity
            style={styles.accountsHeader}
            onPress={() => setShowAccounts(!showAccounts)}
          >
            <View style={styles.accountsHeaderLeft}>
              <Wallet size={20} color={COLORS.primary} />
              <Text style={styles.accountsTitle}>My Accounts</Text>
            </View>
            <View style={styles.accountsHeaderRight}>
              <TouchableOpacity style={styles.addAccountBtn} onPress={handleAddAccount}>
                <Plus size={16} color={COLORS.white} />
              </TouchableOpacity>
              <ChevronRight
                size={20}
                color={COLORS.textSecondary}
                style={{ transform: [{ rotate: showAccounts ? '90deg' : '0deg' }] }}
              />
            </View>
          </TouchableOpacity>

          {showAccounts && (
            <View style={styles.accountsList}>
              {accounts.length === 0 ? (
                <View style={styles.noAccounts}>
                  <Text style={styles.noAccountsText}>No accounts yet</Text>
                  <TouchableOpacity style={styles.addFirstBtn} onPress={handleAddAccount}>
                    <Plus size={16} color={COLORS.primary} />
                    <Text style={styles.addFirstText}>Add your first account</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                accounts.map((account, index) => (
                  <View
                    key={account.id}
                    style={[
                      styles.accountItem,
                      index === accounts.length - 1 && styles.accountItemLast,
                    ]}
                  >
                    <View style={styles.accountIcon}>
                      <Landmark size={18} color={COLORS.primary} />
                    </View>
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName}>{account.name}</Text>
                      <Text style={styles.accountCurrency}>{account.currency_code}</Text>
                    </View>
                    <View style={styles.accountBalanceContainer}>
                      <Text style={styles.accountBalance}>
                        {CURRENCY_SYMBOLS[account.currency_code] || '$'}
                        {account.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </Text>
                      <TouchableOpacity
                        style={styles.editAccountBtn}
                        onPress={() => handleEditAccount(account)}
                      >
                        <Pencil size={14} color={COLORS.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
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

      {/* Add/Edit Account Modal */}
      <AddAccountModal
        isVisible={showAccountModal}
        onClose={() => {
          setShowAccountModal(false);
          setEditingAccount(null);
        }}
        onSave={handleSaveAccount}
        editingAccount={editingAccount}
      />
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
  // Currency Picker Section
  currencySection: {
    marginHorizontal: SPACING.l,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.l,
    marginBottom: SPACING.l,
    ...SHADOWS.soft,
  },
  currencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.m,
  },
  currencyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
  },
  currencyHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  currencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  currencySubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  currencyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  currencyList: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  currencyOptionSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  currencySymbol: {
    fontSize: 20,
    width: 36,
    textAlign: 'center',
    color: COLORS.textPrimary,
  },
  currencyInfo: {
    flex: 1,
    marginLeft: SPACING.s,
  },
  currencyCode: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  currencyName: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  currencyCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyCheckText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  // Accounts Section

  accountsSection: {
    marginHorizontal: SPACING.l,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.l,
    marginBottom: SPACING.l,
    ...SHADOWS.soft,
  },
  accountsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.m,
  },
  accountsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  accountsHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  accountsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  addAccountBtn: {
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountsList: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  noAccounts: {
    padding: SPACING.l,
    alignItems: 'center',
  },
  noAccountsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.s,
  },
  addFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  addFirstText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  accountItemLast: {
    borderBottomWidth: 0,
  },
  accountIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  accountCurrency: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  accountBalanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  accountBalance: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  editAccountBtn: {
    padding: 6,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  // Menu Section
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
