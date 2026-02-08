import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, UserPlus, Shield } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';

export default function SignUpScreen() {
    const router = useRouter();
    const { signUpWithEmail, loading } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSignUp = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        const { error } = await signUpWithEmail(email, password);

        if (error) {
            if (error.message?.includes('already registered')) {
                Alert.alert('Account Exists', 'This email is already registered. Please sign in.');
            } else {
                Alert.alert('Sign Up Failed', error.message || 'Failed to create account');
            }
        } else {
            Alert.alert(
                'Account Created!',
                'Your account has been created successfully.',
                [{ text: 'OK', onPress: () => router.replace('/(tabs)/dashboard') }]
            );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                {/* Back Button */}
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ArrowLeft size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <UserPlus size={32} color={COLORS.white} />
                    </View>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>
                        Sign up to start managing your finances
                    </Text>
                </View>

                {/* Input Fields */}
                <View style={styles.inputSection}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor={COLORS.textSecondary}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>

                <View style={styles.inputSection}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Create a password"
                        placeholderTextColor={COLORS.textSecondary}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                </View>

                <View style={styles.inputSection}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Confirm your password"
                        placeholderTextColor={COLORS.textSecondary}
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />
                </View>

                {/* Info */}
                <View style={styles.infoBox}>
                    <Shield size={16} color={COLORS.primary} />
                    <Text style={styles.infoText}>
                        Your data is encrypted and stored securely
                    </Text>
                </View>

                {/* Sign Up Button */}
                <TouchableOpacity
                    style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                    onPress={handleSignUp}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.submitBtnText}>Create Account</Text>
                    )}
                </TouchableOpacity>

                {/* Sign In Link */}
                <TouchableOpacity
                    style={styles.signinBtn}
                    onPress={() => router.back()}
                >
                    <Text style={styles.signinText}>Already have an account? </Text>
                    <Text style={styles.signinLink}>Sign In</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        padding: SPACING.l,
    },
    backBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginTop: SPACING.m,
        marginBottom: SPACING.l,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.m,
        ...SHADOWS.medium,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: SPACING.s,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    inputSection: {
        marginBottom: SPACING.m,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: SPACING.s,
    },
    input: {
        backgroundColor: COLORS.card,
        borderRadius: RADIUS.m,
        paddingHorizontal: SPACING.m,
        fontSize: 16,
        color: COLORS.textPrimary,
        borderWidth: 1,
        borderColor: COLORS.border,
        height: 56,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryLight,
        padding: SPACING.m,
        borderRadius: RADIUS.m,
        marginBottom: SPACING.l,
        gap: SPACING.s,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.primary,
    },
    submitBtn: {
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: RADIUS.l,
        justifyContent: 'center',
        alignItems: 'center',
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
    signinBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: SPACING.m,
        padding: SPACING.m,
    },
    signinText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    signinLink: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
});
