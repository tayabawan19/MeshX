import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ArrowLeft, KeyRound, Mail } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { triggerHaptic } from '../../utils/haptics';

export const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const { forgotPassword, isLoading, error, clearError } = useAuthStore();
  const { theme } = useThemeStore();

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) return;
    triggerHaptic('selection');
    clearError();

    const success = await forgotPassword(email.trim());
    if (success) {
      triggerHaptic('success');
      navigation.navigate('OtpVerification', { email: email.trim(), mode: 'reset' });
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.surfaceLight }]}>
          <KeyRound size={40} color={theme.colors.primary} />
        </View>

        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Forgot Password?</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Enter your email address and we'll send a 6-digit verification code via Brevo to reset your password.
        </Text>

        <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Mail size={20} color={theme.colors.textSecondary} style={{ marginRight: 12 }} />
          <TextInput
            style={[styles.input, { color: theme.colors.textPrimary }]}
            placeholder="Enter your email"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(t) => {
              clearError();
              setEmail(t);
            }}
          />
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSubmit}
          disabled={isLoading || !email}
        >
          {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Send Reset Code</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 48 },
  header: { height: 48, justifyContent: 'center' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  content: { flex: 1, alignItems: 'center', paddingTop: 24 },
  iconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', width: '100%', height: 52, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, marginBottom: 16 },
  input: { flex: 1, fontSize: 15, fontWeight: '500' },
  errorText: { color: '#ef4444', fontSize: 13, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  submitButton: { width: '100%', height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
