import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { X, Check, Wallet } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useDataStore, Account, Contact, CurrencyBalance } from '../../store/dataStore';

// Currency symbols
const CURRENCY_SYMBOLS: Record<string, string> = {
    'USD': '$',
    'INR': '₹',
    'AED': 'د.إ',
    'EUR': '€',
    'GBP': '£',
};

interface SettleUpModalProps {
    visible: boolean;
    onClose: () => void;
    onComplete: () => void;
    contact: Contact;
    balances: CurrencyBalance[]; // Multi-currency balances
    netBalance: number; // Total in primary currency for quick reference
    accounts: Account[];
}

export default function SettleUpModal({
    visible,
    onClose,
    onComplete,
    contact,
    balances,
    netBalance,
    accounts,
}: SettleUpModalProps) {
    const { createSettlement, getSettlementPreview } = useDataStore();

    const [amount, setAmount] = useState('');
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [direction, setDirection] = useState<'you_pay' | 'they_pay'>('you_pay');
    const [submitting, setSubmitting] = useState(false);
    const [preview, setPreview] = useState<any>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    // Determine default direction based on balance
    useEffect(() => {
        if (visible) {
            if (netBalance > 0) {
                // They owe you, so they should pay
                setDirection('they_pay');
                setAmount(Math.abs(netBalance).toFixed(2));
            } else if (netBalance < 0) {
                // You owe them, so you should pay
                setDirection('you_pay');
                setAmount(Math.abs(netBalance).toFixed(2));
            } else {
                setAmount('');
            }
            // Default to first account
            if (accounts.length > 0 && !selectedAccount) {
                setSelectedAccount(accounts[0]);
            }
        }
    }, [visible, netBalance, accounts]);

    // Fetch allocation preview
    useEffect(() => {
        const fetchPreview = async () => {
            if (!amount || !selectedAccount || parseFloat(amount) <= 0) {
                setPreview(null);
                setLoadingPreview(false);
                return;
            }

            setLoadingPreview(true);
            try {
                // If the function is not available on store yet (hot reload issue?), skip
                if (!getSettlementPreview) return;

                const res = await getSettlementPreview({
                    contact_id: contact.id,
                    account_id: selectedAccount.id,
                    amount: parseFloat(amount),
                    direction: direction
                });
                setPreview(res);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingPreview(false);
            }
        };

        const timer = setTimeout(fetchPreview, 500);
        return () => clearTimeout(timer);
    }, [amount, selectedAccount, direction, contact.id]);

    const handleSettle = async () => {
        const amountNum = parseFloat(amount);
        if (!amountNum || amountNum <= 0) return;
        if (!selectedAccount) return;

        setSubmitting(true);
        try {
            await createSettlement({
                contact_id: contact.id,
                account_id: selectedAccount.id,
                amount: amountNum,
                direction, // Pass direction to handle you_pay vs they_pay
            });
            onComplete();
        } catch (error) {
            console.error('Settlement error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAmountChange = (text: string) => {
        // Only allow numbers and one decimal point
        const cleaned = text.replace(/[^0-9.]/g, '');
        const parts = cleaned.split('.');
        if (parts.length > 2) return;
        if (parts[1]?.length > 2) return;
        setAmount(cleaned);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Settle Up</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Direction Toggle */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Who is paying?</Text>
                            <View style={styles.toggleRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.toggleBtn,
                                        direction === 'you_pay' && styles.toggleBtnActive,
                                    ]}
                                    onPress={() => setDirection('you_pay')}
                                >
                                    <Text style={[
                                        styles.toggleText,
                                        direction === 'you_pay' && styles.toggleTextActive,
                                    ]}>
                                        You pay {contact.name}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.toggleBtn,
                                        direction === 'they_pay' && styles.toggleBtnActive,
                                    ]}
                                    onPress={() => setDirection('they_pay')}
                                >
                                    <Text style={[
                                        styles.toggleText,
                                        direction === 'they_pay' && styles.toggleTextActive,
                                    ]}>
                                        {contact.name} pays you
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Amount */}
                        <View style={styles.section}>
                            <Text style={styles.label}>Amount</Text>
                            <View style={styles.amountInput}>
                                <Text style={styles.currency}>$</Text>
                                <TextInput
                                    style={styles.amountText}
                                    value={amount}
                                    onChangeText={handleAmountChange}
                                    keyboardType="decimal-pad"
                                    placeholder="0.00"
                                    placeholderTextColor={COLORS.textSecondary}
                                />
                            </View>
                            {netBalance !== 0 && (
                                <TouchableOpacity
                                    style={styles.fullAmountBtn}
                                    onPress={() => setAmount(Math.abs(netBalance).toFixed(2))}
                                >
                                    <Text style={styles.fullAmountText}>
                                        Use full amount (${Math.abs(netBalance).toFixed(2)})
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Account Selection */}
                        <View style={styles.section}>
                            <Text style={styles.label}>
                                {direction === 'you_pay' ? 'Pay from' : 'Receive to'}
                            </Text>
                            <View style={styles.accountList}>
                                {accounts.map((account) => (
                                    <TouchableOpacity
                                        key={account.id}
                                        style={[
                                            styles.accountCard,
                                            selectedAccount?.id === account.id && styles.accountCardActive,
                                        ]}
                                        onPress={() => setSelectedAccount(account)}
                                    >
                                        <Wallet size={20} color={
                                            selectedAccount?.id === account.id ? COLORS.primary : COLORS.textSecondary
                                        } />
                                        <View style={styles.accountInfo}>
                                            <Text style={[
                                                styles.accountName,
                                                selectedAccount?.id === account.id && styles.accountNameActive,
                                            ]}>
                                                {account.name}
                                            </Text>
                                            <Text style={styles.accountBalance}>
                                                {account.currency_code} {account.current_balance.toFixed(2)}
                                            </Text>
                                        </View>
                                        {selectedAccount?.id === account.id && (
                                            <Check size={20} color={COLORS.primary} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>


                        {/* Allocation Preview */}
                        {loadingPreview && (
                            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: SPACING.m }} />
                        )}

                        {preview && !loadingPreview && (
                            <View style={styles.previewContainer}>
                                <Text style={styles.previewTitle}>Settlement Breakdown</Text>

                                {/* Account Deduction */}
                                <View style={styles.previewRow}>
                                    <Text style={styles.previewLabel}>From Account:</Text>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={styles.previewValue}>
                                            {preview.accountDeduction.currency_code} {preview.accountDeduction.amount.toFixed(2)}
                                        </Text>
                                        {preview.accountDeduction.currency_code !== (selectedAccount?.currency_code || 'USD') && (
                                            <Text style={styles.previewSubtext}>
                                                (Converted from {selectedAccount?.currency_code})
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                {/* Splits Breakdown */}
                                <Text style={[styles.previewLabel, { marginBottom: 8 }]}>Allocated To:</Text>
                                {preview.splits.map((split: any, index: number) => (
                                    <View key={index} style={styles.previewRow}>
                                        <Text style={styles.previewSubtext}>
                                            • {split.split_type === 'PAYMENT' ? (
                                                split.currency_code === ((selectedAccount?.currency_code) || 'USD')
                                                    ? 'Payment'
                                                    : `Debt (${split.currency_code})`
                                            ) : 'Adjustment'}
                                        </Text>
                                        <Text style={styles.previewValue}>
                                            {split.currency_code} {split.amount.toFixed(2)}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </ScrollView>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitBtn, (!amount || !selectedAccount || submitting) && styles.submitBtnDisabled]}
                        onPress={handleSettle}
                        disabled={!amount || !selectedAccount || submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.submitBtnText}>Record Payment</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView >
        </Modal >
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: COLORS.overlay,
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        maxHeight: '90%',
        padding: SPACING.l,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    section: {
        marginBottom: SPACING.l,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: SPACING.s,
    },
    toggleRow: {
        flexDirection: 'row',
        gap: SPACING.s,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: SPACING.m,
        paddingHorizontal: SPACING.s,
        borderRadius: RADIUS.m,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
    },
    toggleBtnActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primaryLight,
    },
    toggleText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    toggleTextActive: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    amountInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.m,
        padding: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    currency: {
        fontSize: 24,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginRight: SPACING.s,
    },
    amountText: {
        flex: 1,
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    fullAmountBtn: {
        marginTop: SPACING.s,
        alignSelf: 'flex-start',
    },
    fullAmountText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '500',
    },
    accountList: {
        gap: SPACING.s,
    },
    accountCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    accountCardActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primaryLight,
    },
    accountInfo: {
        flex: 1,
        marginLeft: SPACING.m,
    },
    accountName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    accountNameActive: {
        color: COLORS.primary,
    },
    accountBalance: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    submitBtn: {
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.l,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.m,
        ...SHADOWS.medium,
    },
    submitBtnDisabled: {
        opacity: 0.7,
    },
    submitBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    previewContainer: {
        marginTop: SPACING.m,
        padding: SPACING.m,
        backgroundColor: COLORS.background,
        borderRadius: RADIUS.m,
        borderWidth: 1,
        borderColor: COLORS.primaryLight,
    },
    previewTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: SPACING.s,
    },
    previewRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    previewLabel: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    previewValue: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    previewSubtext: {
        fontSize: 11,
        color: COLORS.textSecondary,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.s,
    },
});
