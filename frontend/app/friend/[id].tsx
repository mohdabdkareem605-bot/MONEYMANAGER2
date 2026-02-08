import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, User, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';
import { useDataStore } from '../../src/store/dataStore';
import { supabase } from '../../src/lib/supabase';
import SettleUpModal from '../../src/components/friends/SettleUpModal';

interface FriendTransaction {
    id: string;
    description: string;
    amount: number;
    split_type: 'DEBT' | 'PAYMENT';
    occurred_at: string;
    is_mine: boolean; // Did I create this transaction?
    currency_code: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
    'USD': '$',
    'INR': '₹',
    'AED': 'د.إ',
    'EUR': '€',
    'GBP': '£',
};

export default function FriendDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { contacts, contactBalances, accounts, fetchContactBalances } = useDataStore();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [transactions, setTransactions] = useState<FriendTransaction[]>([]);
    const [showSettleModal, setShowSettleModal] = useState(false);

    const contact = contacts.find(c => c.id === id);
    const balance = contactBalances.find(b => b.contact_id === id);
    const netBalance = balance?.total_in_primary || 0; // Use total_in_primary for aggregated USD balance

    useEffect(() => {
        if (id) {
            loadTransactions();
        }
    }, [id]);

    const loadTransactions = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !contact) return;

            // Get splits I created for this contact
            const { data: mySplits } = await supabase
                .from('splits')
                .select(`
          id,
          amount,
          split_type,
          currency_code,
          transaction:transactions(id, description, occurred_at)
        `)
                .eq('contact_id', id);

            // Get splits they created for me (via linked_profile_id)
            let theirSplits: any[] = [];
            if (contact.linked_profile_id) {
                const { data: theirContactForMe } = await supabase
                    .from('contacts')
                    .select('id')
                    .eq('owner_id', contact.linked_profile_id)
                    .eq('linked_profile_id', user.id)
                    .maybeSingle();

                if (theirContactForMe) {
                    const { data } = await supabase
                        .from('splits')
                        .select(`
              id,
              amount,
              split_type,
              currency_code,
              transaction:transactions(id, description, occurred_at)
            `)
                        .eq('contact_id', theirContactForMe.id);
                    theirSplits = data || [];
                }
            }

            // Combine and format
            const allTxs: FriendTransaction[] = [];

            for (const split of mySplits || []) {
                if (split.transaction) {
                    allTxs.push({
                        id: split.id,
                        description: (split.transaction as any).description || 'Transaction',
                        amount: Number(split.amount),
                        split_type: split.split_type as 'DEBT' | 'PAYMENT',
                        occurred_at: (split.transaction as any).occurred_at,
                        is_mine: true,
                        currency_code: (split as any).currency_code || 'USD',
                    });
                }
            }

            for (const split of theirSplits) {
                if (split.transaction) {
                    allTxs.push({
                        id: split.id,
                        description: (split.transaction as any).description || 'Transaction',
                        amount: Number(split.amount),
                        split_type: split.split_type as 'DEBT' | 'PAYMENT',
                        occurred_at: (split.transaction as any).occurred_at,
                        is_mine: false,
                        currency_code: (split as any).currency_code || 'USD',
                    });
                }
            }

            // Sort by date descending
            allTxs.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
            setTransactions(allTxs);
        } catch (error) {
            console.error('Load friend transactions error:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadTransactions();
        await fetchContactBalances();
        setRefreshing(false);
    };

    const handleSettleComplete = async () => {
        setShowSettleModal(false);
        await loadTransactions();
        await fetchContactBalances();
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const renderTransaction = ({ item }: { item: FriendTransaction }) => {
        // Determine if this is money coming to me or going from me
        let isPositive: boolean;
        let label: string;

        if (item.is_mine) {
            // I created this - DEBT means they owe me, PAYMENT means they paid me
            isPositive = item.split_type === 'DEBT';
            label = item.split_type === 'DEBT' ? 'They owe you' : 'They paid you';
        } else {
            // They created this - DEBT means I owe them, PAYMENT means I paid them
            isPositive = item.split_type === 'PAYMENT';
            label = item.split_type === 'DEBT' ? 'You owe' : 'You paid';
        }

        return (
            <View style={styles.txCard}>
                <View style={[styles.txIcon, { backgroundColor: isPositive ? '#E8F5E9' : '#FFEBEE' }]}>
                    {isPositive ? (
                        <ArrowDownLeft size={20} color={COLORS.success} />
                    ) : (
                        <ArrowUpRight size={20} color={COLORS.danger} />
                    )}
                </View>
                <View style={styles.txInfo}>
                    <Text style={styles.txDescription}>{item.description}</Text>
                    <Text style={styles.txDate}>{formatDate(item.occurred_at)} • {label}</Text>
                </View>
                <Text style={[styles.txAmount, { color: isPositive ? COLORS.success : COLORS.danger }]}>
                    {isPositive ? '+' : '-'}{CURRENCY_SYMBOLS[item.currency_code] || item.currency_code}{Math.abs(item.amount).toFixed(2)}
                </Text>
            </View>
        );
    };

    if (!contact) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>Contact not found</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{contact.name}</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Balance Card */}
            <View style={styles.balanceCard}>
                <View style={styles.avatar}>
                    <User size={32} color={COLORS.primary} />
                </View>
                <Text style={styles.contactName}>{contact.name}</Text>
                {contact.phone_number && (
                    <Text style={styles.contactPhone}>{contact.phone_number}</Text>
                )}
                {contact.email && (
                    <Text style={styles.contactPhone}>{contact.email}</Text>
                )}

                {/* Multi-Currency Balances */}
                <View style={styles.balanceSection}>
                    {!balance?.balances?.length ? (
                        <Text style={styles.settledText}>All settled up!</Text>
                    ) : (
                        balance.balances.map((b, idx) => {
                            const symbol = b.currency_code === 'USD' ? '$' :
                                b.currency_code === 'INR' ? '₹' :
                                    b.currency_code === 'AED' ? 'د.إ' :
                                        b.currency_code === 'EUR' ? '€' :
                                            b.currency_code === 'GBP' ? '£' : b.currency_code;
                            const isPositive = b.net_balance > 0;
                            return (
                                <View key={`${b.currency_code}-${idx}`} style={styles.balanceRow}>
                                    <Text style={styles.balanceLabel}>
                                        {isPositive ? 'owes you' : 'you owe'}
                                    </Text>
                                    <Text style={[styles.balanceAmount, { color: isPositive ? COLORS.success : COLORS.danger }]}>
                                        {symbol}{Math.abs(b.net_balance).toFixed(2)}
                                    </Text>
                                </View>
                            );
                        })
                    )}
                </View>
            </View>

            {/* Transaction List */}
            <View style={styles.listContainer}>
                <Text style={styles.sectionTitle}>Transaction History</Text>
                {loading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
                ) : (
                    <FlatList
                        data={transactions}
                        keyExtractor={(item) => item.id}
                        renderItem={renderTransaction}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <Text style={styles.emptyText}>No transactions yet</Text>
                            </View>
                        }
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={[COLORS.primary]}
                            />
                        }
                    />
                )}
            </View>

            {/* Settle Up Button */}
            {netBalance !== 0 && (
                <TouchableOpacity
                    style={styles.settleBtn}
                    onPress={() => setShowSettleModal(true)}
                >
                    <Text style={styles.settleBtnText}>Settle Up</Text>
                </TouchableOpacity>
            )}

            {/* Settle Up Modal */}
            <SettleUpModal
                visible={showSettleModal}
                onClose={() => setShowSettleModal(false)}
                onComplete={handleSettleComplete}
                contact={contact}
                balances={balance?.balances || []}
                netBalance={netBalance}
                accounts={accounts}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.m,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    balanceCard: {
        backgroundColor: COLORS.white,
        marginHorizontal: SPACING.l,
        borderRadius: RADIUS.l,
        padding: SPACING.l,
        alignItems: 'center',
        ...SHADOWS.soft,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    contactName: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    contactPhone: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: SPACING.m,
        gap: 8,
    },
    balanceLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    balanceAmount: {
        fontSize: 28,
        fontWeight: '700',
    },
    settledText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.success,
    },
    balanceSection: {
        marginTop: SPACING.m,
        alignItems: 'center',
    },
    listContainer: {
        flex: 1,
        marginTop: SPACING.l,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        paddingHorizontal: SPACING.l,
        marginBottom: SPACING.s,
    },
    listContent: {
        paddingHorizontal: SPACING.l,
        paddingBottom: 100,
    },
    txCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.m,
        padding: SPACING.m,
        marginBottom: SPACING.s,
        ...SHADOWS.soft,
    },
    txIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.m,
    },
    txInfo: {
        flex: 1,
    },
    txDescription: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    txDate: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    txAmount: {
        fontSize: 16,
        fontWeight: '700',
    },
    empty: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    settleBtn: {
        position: 'absolute',
        bottom: 30,
        left: SPACING.l,
        right: SPACING.l,
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.l,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    settleBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
});
