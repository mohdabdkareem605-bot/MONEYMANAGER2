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
import { Phone, ArrowRight, Shield } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithPhone, loading } = useAuth();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');

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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Phone size={32} color={COLORS.white} />
          </View>
          <Text style={styles.title}>Welcome to SplitWise</Text>
          <Text style={styles.subtitle}>
            Enter your phone number to sign in or create an account
          </Text>
        </View>

        {/* Phone Input */}
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

        {/* Info */}
        <View style={styles.infoBox}>
          <Shield size={16} color={COLORS.primary} />
          <Text style={styles.infoText}>
            We'll send you a verification code via SMS
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSendOTP}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Continue</Text>
              <ArrowRight size={20} color={COLORS.white} />
            </>
          )}
        </TouchableOpacity>

        {/* Demo Mode */}
        <TouchableOpacity
          style={styles.demoBtn}
          onPress={() => router.replace('/(tabs)/dashboard')}
        >
          <Text style={styles.demoBtnText}>Continue in Demo Mode</Text>
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
  header: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xl,
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
    marginBottom: SPACING.xl,
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
  demoBtn: {
    marginTop: SPACING.m,
    padding: SPACING.m,
    alignItems: 'center',
  },
  demoBtnText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
