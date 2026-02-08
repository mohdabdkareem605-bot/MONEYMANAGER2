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
import { Mail, Phone, ArrowRight, Shield } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';

type AuthMode = 'phone' | 'email';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithPhone, signInWithEmail, loading } = useAuth();

  const [authMode, setAuthMode] = useState<AuthMode>('email');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSendOTP = async () => {
    const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;

    if (phoneNumber.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    const { error } = await signInWithPhone(fullPhone);

    if (error) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } else {
      router.push({
        pathname: '/auth/verify',
        params: { phone: fullPhone },
      });
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    const { error } = await signInWithEmail(email, password);

    if (error) {
      // If user doesn't exist, try to sign up
      if (error.message?.includes('Invalid login credentials')) {
        Alert.alert(
          'Account Not Found',
          'Would you like to create a new account with this email?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Create Account',
              onPress: () => router.push('/auth/signup')
            },
          ]
        );
      } else {
        Alert.alert('Login Failed', error.message || 'Invalid credentials');
      }
    } else {
      router.replace('/(tabs)/dashboard');
    }
  };

  const handleSubmit = () => {
    if (authMode === 'phone') {
      handleSendOTP();
    } else {
      handleEmailLogin();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            {authMode === 'phone' ? (
              <Phone size={32} color={COLORS.white} />
            ) : (
              <Mail size={32} color={COLORS.white} />
            )}
          </View>
          <Text style={styles.title}>Welcome to FinanceFlow</Text>
          <Text style={styles.subtitle}>
            {authMode === 'phone'
              ? 'Enter your phone number to sign in'
              : 'Sign in with your email and password'}
          </Text>
        </View>

        {/* Auth Mode Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, authMode === 'email' && styles.toggleBtnActive]}
            onPress={() => setAuthMode('email')}
          >
            <Mail size={18} color={authMode === 'email' ? COLORS.white : COLORS.textSecondary} />
            <Text style={[styles.toggleText, authMode === 'email' && styles.toggleTextActive]}>
              Email
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, authMode === 'phone' && styles.toggleBtnActive]}
            onPress={() => setAuthMode('phone')}
          >
            <Phone size={18} color={authMode === 'phone' ? COLORS.white : COLORS.textSecondary} />
            <Text style={[styles.toggleText, authMode === 'phone' && styles.toggleTextActive]}>
              Phone
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input Section */}
        {authMode === 'phone' ? (
          <View style={styles.inputSection}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneInputRow}>
              <TouchableOpacity style={styles.countryCodeBtn}>
                <Text style={styles.countryCodeText}>{countryCode}</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter phone number"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                maxLength={15}
              />
            </View>
          </View>
        ) : (
          <>
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
                placeholder="Enter your password"
                placeholderTextColor={COLORS.textSecondary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </>
        )}

        {/* Info */}
        <View style={styles.infoBox}>
          <Shield size={16} color={COLORS.primary} />
          <Text style={styles.infoText}>
            {authMode === 'phone'
              ? "We'll send you a verification code via SMS"
              : "Your data is encrypted and secure"}
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.submitBtnText}>
                {authMode === 'phone' ? 'Continue' : 'Sign In'}
              </Text>
              <ArrowRight size={20} color={COLORS.white} />
            </>
          )}
        </TouchableOpacity>

        {/* Sign Up Link */}
        {authMode === 'email' && (
          <TouchableOpacity
            style={styles.signupBtn}
            onPress={() => router.push('/auth/signup')}
          >
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        )}
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
  header: {
    alignItems: 'center',
    marginTop: SPACING.xl,
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.l,
    padding: 4,
    marginBottom: SPACING.l,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.m,
    borderRadius: RADIUS.m,
    gap: SPACING.xs,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  toggleTextActive: {
    color: COLORS.white,
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
  phoneInputRow: {
    flexDirection: 'row',
    gap: SPACING.s,
  },
  countryCodeBtn: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.m,
    paddingHorizontal: SPACING.m,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 56,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  phoneInput: {
    flex: 1,
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.s,
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
  signupBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.m,
    padding: SPACING.m,
  },
  signupText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  signupLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
