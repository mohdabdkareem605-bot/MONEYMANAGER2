import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Dimensions,
    TextInput, Animated, Alert, ScrollView
} from 'react-native';
import { X, Check, Landmark } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';

const { height } = Dimensions.get('window');

const CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
];

interface AddAccountModalProps {
    isVisible: boolean;
    onClose: () => void;
    onSave: (data: { name: string; currency_code: string; current_balance: number }) => void;
    editingAccount?: { id: string; name: string; currency_code: string; current_balance: number } | null;
}

export default function AddAccountModal({
    isVisible,
    onClose,
    onSave,
    editingAccount
}: AddAccountModalProps) {
    const translateY = useRef(new Animated.Value(height)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    const [name, setName] = useState('');
    const [selectedCurrency, setSelectedCurrency] = useState('USD');
    const [balance, setBalance] = useState('');

    useEffect(() => {
        if (isVisible) {
            // Pre-fill if editing
            if (editingAccount) {
                setName(editingAccount.name);
                setSelectedCurrency(editingAccount.currency_code);
                setBalance(editingAccount.current_balance.toString());
            } else {
                setName('');
                setSelectedCurrency('USD');
                setBalance('');
            }

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
    }, [isVisible, editingAccount]);

    const handleSave = () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter an account name');
            return;
        }

        onSave({
            name: name.trim(),
            currency_code: selectedCurrency,
            current_balance: parseFloat(balance) || 0,
        });

        // Reset form
        setName('');
        setSelectedCurrency('USD');
        setBalance('');
        onClose();
    };

    if (!isVisible) return null;

    const isEditing = !!editingAccount;

    return (
        <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]} pointerEvents="auto">
            <Animated.View style={[styles.overlay, { opacity }]}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
            </Animated.View>

            <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
                <View style={styles.header}>
                    <Text style={styles.title}>{isEditing ? 'Edit Account' : 'Add New Account'}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <X size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
                    {/* Account Icon Preview */}
                    <View style={styles.iconPreview}>
                        <View style={styles.iconBox}>
                            <Landmark size={32} color={COLORS.white} />
                        </View>
                    </View>

                    {/* Account Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Account Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g., Savings, Checking, Wallet"
                            placeholderTextColor={COLORS.textSecondary}
                            autoFocus
                        />
                    </View>

                    {/* Currency Selection */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Currency</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.currencyRow}>
                                {CURRENCIES.map((curr) => (
                                    <TouchableOpacity
                                        key={curr.code}
                                        style={[
                                            styles.currencyChip,
                                            selectedCurrency === curr.code && styles.currencyChipSelected,
                                        ]}
                                        onPress={() => setSelectedCurrency(curr.code)}
                                    >
                                        <Text style={[
                                            styles.currencySymbol,
                                            selectedCurrency === curr.code && styles.currencySymbolSelected,
                                        ]}>
                                            {curr.symbol}
                                        </Text>
                                        <Text style={[
                                            styles.currencyCode,
                                            selectedCurrency === curr.code && styles.currencyCodeSelected,
                                        ]}>
                                            {curr.code}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Opening/Current Balance */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{isEditing ? 'Current Balance' : 'Opening Balance'}</Text>
                        <View style={styles.balanceInput}>
                            <Text style={styles.balanceSymbol}>
                                {CURRENCIES.find(c => c.code === selectedCurrency)?.symbol || '$'}
                            </Text>
                            <TextInput
                                style={styles.balanceField}
                                value={balance}
                                onChangeText={setBalance}
                                placeholder="0.00"
                                placeholderTextColor={COLORS.textSecondary}
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>
                </ScrollView>

                {/* Save Button */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Check size={20} color={COLORS.white} />
                        <Text style={styles.saveBtnText}>{isEditing ? 'Update Account' : 'Create Account'}</Text>
                    </TouchableOpacity>
                </View>
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
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        maxHeight: height * 0.85,
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
    content: {
        padding: SPACING.l,
    },
    iconPreview: {
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    iconBox: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    inputGroup: {
        marginBottom: SPACING.l,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.m,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: COLORS.textPrimary,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    currencyRow: {
        flexDirection: 'row',
        gap: 8,
    },
    currencyChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: RADIUS.m,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: 8,
    },
    currencyChipSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    currencySymbol: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginRight: 6,
    },
    currencySymbolSelected: {
        color: COLORS.white,
    },
    currencyCode: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    currencyCodeSelected: {
        color: COLORS.white,
    },
    balanceInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.m,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    balanceSymbol: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginRight: 8,
    },
    balanceField: {
        flex: 1,
        fontSize: 18,
        color: COLORS.textPrimary,
        paddingVertical: 14,
    },
    footer: {
        padding: SPACING.l,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: RADIUS.l,
        ...SHADOWS.medium,
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
        marginLeft: 8,
    },
});
